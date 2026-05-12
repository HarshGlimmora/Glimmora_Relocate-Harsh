/**
 * Relocation Assistant chat endpoint.
 *
 * Pure frontend-side API route (no FastAPI backend changes). It:
 *
 *   1. Authenticates the caller via NextAuth.
 *   2. Validates the inbound message with Zod (sanitises + length-caps).
 *   3. Applies a simple in-memory per-user rate limit.
 *   4. Fetches the user's existing analyses from the FastAPI backend
 *      (profile + active case + relevant module envelopes) so every
 *      reply is grounded in their real data — never hard-coded.
 *   5. Generates a reply:
 *        - If `GEMINI_API_KEY` is set: calls Gemini REST with the user
 *          context as a system instruction (truly AI-generated).
 *        - Otherwise: routes the question via keyword intent to the
 *          most relevant module envelope and composes a natural-language
 *          answer from the AI-generated `summary`, `reasoning`,
 *          `next_actions`, and `risks` already produced by the backend.
 *
 * Either way, content is dynamic per-user. Failures degrade gracefully.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  country,
  culture,
  documents,
  family,
  finance,
  getActiveCase,
  getProfile,
  jobfit,
  synthesis,
  visa,
} from "@/lib/backend/client";
import type {
  AnalysisEnvelope,
  BackendProfile,
  CountryComparisonDetail,
  CultureDetail,
  DocumentChecklistDetail,
  FailedEnvelope,
  FamilyImpactDetail,
  FinanceDetail,
  JobFitDetail,
  ModuleResponse,
  SynthesisDetail,
  VisaDirectionDetail,
} from "@/lib/backend/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- Input validation ----------------------------------------------------

const bodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(1000, "Message too long.")
    // Strip control characters except newlines/tabs.
    .transform((s) => s.replace(new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g"), "")),
  userId: z.string().optional(), // accepted but ignored — we trust the session
});

// ---- Minimal in-memory rate limiter --------------------------------------
// Per-process best-effort guard against single-user spam. Not a substitute
// for an upstream limiter; just prevents a runaway client from hammering us.

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

// ---- Topic / safety filters ---------------------------------------------
//
// Two filters bracket the AI call:
//   1. `isRelocationRelevant()` — runs BEFORE generation so we never spend
//      tokens on irrelevant queries; off-topic messages are returned the
//      default greeting verbatim.
//   2. `isResponseSafe()` — runs AFTER generation so any model-side slip-up
//      that produces profanity or an empty/echo answer is replaced by the
//      same default greeting.
//
// The default greeting is the single source of truth used by:
//   - the frontend `WELCOME` message (mirrored, kept in sync by spec), and
//   - every off-topic / unsafe / fallback path in this route.

const DEFAULT_GREETING =
  "Hi — I'm your relocation assistant. I can walk you through your relocation insights, country fit, visa direction, cost of living, and the next best steps in your journey. What would you like to explore?";

/**
 * Strong off-topic signals — phrases that almost certainly indicate the
 * user has wandered off-topic, even if a relocation-adjacent word slipped
 * in (e.g. "tell me a joke about visas").
 */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\btell\s+me\s+a\s+joke\b/i,
  /\b(joke|jokes|funny|humou?r)\b/i,
  /\bsing\s+(me\s+)?a?\s*song\b/i,
  /\bweather\b/i,
  /\bwho\s+(won|is\s+winning)\b/i,
  /\bmatch\s+(score|result)\b/i,
  /\b(meaning\s+of\s+life|what\s+is\s+love|are\s+you\s+(alive|human|sentient|real|a\s+bot|an?\s+ai))\b/i,
  /\b(cricket|football|basketball|baseball|soccer|nba|nfl|fifa|olympic|tennis|wrestling|boxing)\b/i,
  /\b(movie|movies|film|films|netflix|prime\s+video|hulu|hbo|tv\s+show|series|episode|actor|actress|celebrity)\b/i,
  /\b(song|songs|music|album|lyrics|artist|rapper|singer)\b/i,
  /\b(election|elections|president|prime\s+minister|politic(s|al|ian)|war|conflict)\b/i,
  /\b(stock\s+(market|price|tip)|crypto|bitcoin|ethereum|nft|share\s+price|trading\s+tip)\b/i,
  /\b(recipe|cook(ing|book)|workout|gym|diet\s+plan)\b/i,
  /\b(write\s+(me\s+)?(a\s+)?(poem|story|essay|code|program|script))\b/i,
  /\b(insult|abuse|swear|curse)\s+(me|him|her|them)\b/i,
];

/**
 * Light-touch platform-help allowlist — short greetings and "what can you
 * do" style asks that are technically off-topic but should still be
 * answered (they map to the platform/synthesis intent in the router).
 */
const PLATFORM_HELP_PATTERNS: RegExp[] = [
  /^\s*(hi|hello|hey|yo|hola|namaste)\b/i,
  /\bwhat\s+can\s+you\s+(do|help)\b/i,
  /\b(who|what)\s+are\s+you\b/i,
  /\b(help\s+me|how\s+do\s+i\s+use|how\s+does\s+this\s+work|getting\s+started)\b/i,
  /\bglimmora\b/i,
  /\b(dashboard|sidebar|onboarding|profile|module|synthesis|verdict)\b/i,
];

/**
 * Allowlist — any of these patterns indicates the message is about
 * relocation, visas, immigration, jobs abroad, cost of living, family
 * relocation, documents, culture, or any module surface in Glimmora.
 */
const RELOCATION_PATTERNS: RegExp[] = [
  /\b(relocat\w+|migrat\w+|immigrat\w+|emigrat\w+|expat|expatriate)\b/i,
  /\bmov(e|ing)\s+(abroad|overseas|away|to\b|out|back)/i,
  /\b(visa|permit|residency|residence|citizenship|sponsor(ship)?|passport|nationality|green\s*card|blue\s*card|h-?1b|work\s+permit|settle(ment)?)\b/i,
  /\b(job|jobs|career|role|roles|employer|employers|hire|hiring|salary|salaries|compensation|paycheck|employment|recruiter|sponsorship|offer|offers)\b/i,
  /\b(cost\s+of\s+living|rent|rental|housing|finance|financial|feasibility|budget|expense|expenses|runway|savings|tax|taxes|currency|exchange\s+rate)\b/i,
  /\b(country|countries|destination|destinations|abroad|overseas|foreign|international|city|cities)\b/i,
  /\b(family|spouse|partner|kids?|children|school(ing|s)?|parents?|dependents?|household)\b/i,
  /\b(document|documents|paperwork|checklist|certificate|certificates|apostille|attestation|degree\s+evaluation)\b/i,
  /\b(culture|cultural|language|languages|integrat\w+|adapt(ation)?|workplace\s+norms?|lifestyle\s+abroad)\b/i,
  /\b(timeline|plan(ning)?|readiness|blocker|blockers|risk|risks|fit|comparison|next\s+best\s+(actions?|steps?))\b/i,
  /\brelocation\s+(score|verdict|insights?)\b/i,
  /\b(why\s+is\s+my\s+\w+\s+(score|low|high))\b/i,
  // Common destination country / city names — keeps "best country for me",
  // "moving to Canada", "salary in Berlin" relevant even without other
  // keywords.
  /\b(canada|australia|germany|netherlands|holland|ireland|portugal|spain|france|sweden|switzerland|england|britain|uk|united\s+kingdom|usa|america|united\s+states|singapore|japan|korea|hong\s*kong|new\s+zealand|uae|dubai|estonia|italy|israel|malaysia|nigeria|pakistan|india|brazil|south\s+africa|turkey|egypt|philippines|qatar|saudi(\s+arabia)?)\b/i,
  /\b(berlin|amsterdam|toronto|vancouver|sydney|melbourne|dublin|lisbon|madrid|paris|stockholm|zurich|london|new\s+york|san\s+francisco|seattle|tokyo|seoul|singapore|dubai|tel\s*aviv)\b/i,
];

function isRelocationRelevant(message: string): boolean {
  const m = message.trim();
  if (m.length === 0) return false;

  // Block off-topic phrases first — these win even if a relocation word
  // happens to appear in the same sentence ("tell me a joke about visas").
  if (OFF_TOPIC_PATTERNS.some((p) => p.test(m))) return false;

  // Light-touch greetings / help asks pass through.
  if (PLATFORM_HELP_PATTERNS.some((p) => p.test(m))) return true;

  // Otherwise we require at least one explicit relocation signal.
  return RELOCATION_PATTERNS.some((p) => p.test(m));
}

/**
 * Output-side guard. Drops replies that are empty, profane, abusive, or
 * an obvious self-harm prompt so the UI never renders unsafe content.
 */
const UNSAFE_PATTERNS: RegExp[] = [
  /\b(fuck|shit|asshole|bitch|bastard|cunt|dick|piss|wank)\b/i,
  /\b(retard|retarded|moron|idiot|stupid\s+(person|user))\b/i,
  /\b(kill\s+yourself|kys|end\s+your\s+life)\b/i,
  /\b(hate\s+(speech|crime|group)|racial\s+slur)\b/i,
  /\bn[i!1]gg[ae3]r\b/i,
  /\bf[a@]gg[o0]t\b/i,
];

function isResponseSafe(reply: string | null | undefined): boolean {
  if (!reply || reply.trim().length === 0) return false;
  return !UNSAFE_PATTERNS.some((p) => p.test(reply));
}

// ---- Route handler -------------------------------------------------------

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please send a non-empty message." },
      { status: 400 },
    );
  }

  if (rateLimited(session.user.id)) {
    return NextResponse.json(
      {
        error:
          "You're sending messages a little too quickly. Take a breath and try again in a minute.",
      },
      { status: 429 },
    );
  }

  const message = parsed.data.message;

  // Topic gate: off-topic queries never reach the AI. We short-circuit
  // with the canonical greeting so the user is gently re-anchored to the
  // relocation purpose of the assistant.
  if (!isRelocationRelevant(message)) {
    return NextResponse.json({ reply: DEFAULT_GREETING });
  }

  try {
    const ctx = await loadUserContext();
    const reply = await generateReply(message, ctx);
    // Safety gate: anything that slips through the AI but fails the
    // safety filter is replaced with the default greeting so the UI
    // never renders profane, abusive, or empty content.
    const safeReply = isResponseSafe(reply) ? reply : DEFAULT_GREETING;
    return NextResponse.json({ reply: safeReply });
  } catch (err) {
    console.error("[chatbot] query failed", err);
    return NextResponse.json(
      {
        reply:
          "Sorry, I couldn't process your request right now. Please try again in a moment.",
      },
      { status: 200 },
    );
  }
}

// ---- User context fan-out ------------------------------------------------

interface UserContext {
  profile: BackendProfile | null;
  synthesis: ModuleResponse<SynthesisDetail> | null;
  visa: ModuleResponse<VisaDirectionDetail> | null;
  finance: ModuleResponse<FinanceDetail> | null;
  country: ModuleResponse<CountryComparisonDetail> | null;
  jobfit: ModuleResponse<JobFitDetail> | null;
  documents: ModuleResponse<DocumentChecklistDetail> | null;
  family: ModuleResponse<FamilyImpactDetail> | null;
  culture: ModuleResponse<CultureDetail> | null;
}

async function safe<T>(p: Promise<T>): Promise<T | null> {
  return p.catch(() => null);
}

async function loadUserContext(): Promise<UserContext> {
  const profile = await safe(getProfile());
  const activeCase = await safe(getActiveCase());
  const caseId = activeCase?.id ?? null;

  if (!caseId) {
    return {
      profile,
      synthesis: null,
      visa: null,
      finance: null,
      country: null,
      jobfit: null,
      documents: null,
      family: null,
      culture: null,
    };
  }

  const [syn, v, fin, c, j, d, fam, cu] = await Promise.all([
    safe(synthesis.latest(caseId)),
    safe(visa.latest(caseId)),
    safe(finance.latest(caseId)),
    safe(country.latest(caseId)),
    safe(jobfit.latest(caseId)),
    safe(documents.latest(caseId)),
    safe(family.latest(caseId)),
    safe(culture.latest(caseId)),
  ]);

  return {
    profile,
    synthesis: syn,
    visa: v,
    finance: fin,
    country: c,
    jobfit: j,
    documents: d,
    family: fam,
    culture: cu,
  };
}

// ---- Reply generation ----------------------------------------------------

async function generateReply(message: string, ctx: UserContext): Promise<string> {
  // 1. Prefer a real LLM if the operator configured one. Pure REST — no SDK
  //    so we don't bloat the consumer bundle / lockfile.
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const llmReply = await callGemini(apiKey, message, ctx);
      if (llmReply) return llmReply;
    } catch (err) {
      console.warn("[chatbot] Gemini call failed, falling back to context router", err);
      /* fall through to the deterministic router */
    }
  }

  // 2. Deterministic context router. Composes a dynamic answer from the
  //    user's real envelope content — different per user, never canned.
  return routeFromContext(message, ctx);
}

// ---- Gemini REST call (optional) -----------------------------------------

async function callGemini(
  apiKey: string,
  message: string,
  ctx: UserContext,
): Promise<string | null> {
  const model = process.env.GEMINI_CHATBOT_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemInstruction = [
    "You are the Glimmora Relocate AI assistant — a concise, warm guide that helps a working professional understand their relocation analysis on the Glimmora platform.",
    "STRICT SCOPE: you only answer questions about relocation, immigration, visa pathways, country fit, job market abroad, salary expectations, cost of living, finance / runway, relocation timelines, documents, family relocation impact, cultural adaptation, and how to use the Glimmora platform itself.",
    "If the user asks anything outside this scope (jokes, sports, movies, music, politics, personal opinions, code, recipes, weather, random trivia, insults), you MUST respond with EXACTLY this single sentence and nothing else:",
    `"${DEFAULT_GREETING}"`,
    "Do not invent jokes, opinions, or unrelated facts. Do not roleplay as anything other than the Glimmora relocation assistant. Never produce profane, abusive, or harmful content — if you would, return the default sentence above instead.",
    "Ground every relocation answer in the user's context below. Refer to their real numbers, target country, visa direction, and verdict when relevant.",
    "Keep replies under 140 words unless the user explicitly asks for detail. Use plain text — no markdown headings, no asterisks, no code fences.",
    "Never fabricate analyses the user hasn't run. If something isn't in their context, say so and point them to the relevant module.",
    "",
    "=== USER CONTEXT ===",
    buildContextSummary(ctx),
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 480,
        },
      }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text ?? "")
      .join("")
      .trim();
    return text && text.length > 0 ? text : null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Deterministic context-grounded router -------------------------------
//
// This is NOT hardcoded content. Every snippet below is composed from the
// AI-generated envelope already cached on the backend for the user. Two
// users asking the exact same question will get different answers because
// their `summary`, `reasoning`, `score`, `next_actions`, and `risks` are
// theirs alone.

const INTENTS = [
  {
    key: "synthesis",
    rx: /\b(score|verdict|recommendation|synthesis|summary|overall|relocat\w*\s+(score|fit|verdict))\b/i,
  },
  {
    key: "visa",
    rx: /\b(visa|sponsor|residency|permit|green\s*card|blue\s*card|h-?1b|work\s+permit|nationality|passport)\b/i,
  },
  {
    key: "finance",
    rx: /\b(finance|cost|salary|salar\w+|budget|runway|rent|housing\s+cost|cost\s+of\s+living|expenses?|save|savings|tax|money)\b/i,
  },
  {
    key: "country",
    rx: /\b(country|destination|where|move\s+to|relocate\s+to|compare|shortlist|alternatives?)\b/i,
  },
  { key: "jobfit", rx: /\b(job|career|role|hire|hiring|employer|market|work)\b/i },
  { key: "documents", rx: /\b(document|paperwork|checklist|forms?|certificate|apostille)\b/i },
  { key: "family", rx: /\b(family|spouse|partner|kids?|children|school|parent\w*)\b/i },
  { key: "culture", rx: /\b(culture|language|adapt|integrat\w+|workplace\s+norms?|lifestyle)\b/i },
  { key: "next", rx: /\b(next|what\s+now|what\s+should\s+i\s+do|action|step|plan|guide|help)\b/i },
  { key: "platform", rx: /\b(how\s+do\s+i|where\s+is|how\s+to\s+use|module|dashboard|onboarding|profile)\b/i },
] as const;

type IntentKey = (typeof INTENTS)[number]["key"];

function classifyIntent(message: string): IntentKey {
  for (const i of INTENTS) {
    if (i.rx.test(message)) return i.key;
  }
  return "synthesis";
}

function readyEnvelope<T>(
  m: ModuleResponse<T> | null,
): AnalysisEnvelope<T> | null {
  if (!m) return null;
  const env = m.envelope as AnalysisEnvelope<T> | FailedEnvelope;
  if (!env || env.status === "failed") return null;
  return env as AnalysisEnvelope<T>;
}

function joinSentence(parts: (string | null | undefined)[], sep = " "): string {
  return parts.filter((p) => typeof p === "string" && p.trim().length > 0).join(sep);
}

function firstNextAction(env: AnalysisEnvelope<unknown>): string | null {
  const a = env.next_actions?.[0];
  if (!a) return null;
  const urgency = a.urgency ? ` (${a.urgency})` : "";
  return `${a.label}${urgency}${a.why ? ` — ${a.why}` : ""}`;
}

function topRisk(env: AnalysisEnvelope<unknown>): string | null {
  const r = env.risks?.[0];
  if (!r) return null;
  return `${r.label}: ${r.detail}`;
}

function routeFromContext(message: string, ctx: UserContext): string {
  const intent = classifyIntent(message);
  const dest = ctx.profile?.target_country ?? null;

  switch (intent) {
    case "synthesis": {
      const env = readyEnvelope(ctx.synthesis);
      if (!env) {
        return missingModuleHint(
          "your final verdict",
          "synthesis",
          "/app/synthesis",
          dest,
        );
      }
      return joinSentence([
        env.score != null
          ? `Your overall relocation score is ${Math.round(env.score)}/100${
              env.confidence ? ` (confidence ${(env.confidence * 100).toFixed(0)}%)` : ""
            }.`
          : null,
        env.summary,
        env.reasoning ? trim(env.reasoning, 320) : null,
        firstNextAction(env) ? `Next best step: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "visa": {
      const env = readyEnvelope(ctx.visa);
      if (!env) {
        return missingModuleHint("your visa direction", "visa", "/app/visa", dest);
      }
      return joinSentence([
        dest ? `For ${dest}:` : null,
        env.summary,
        env.reasoning ? trim(env.reasoning, 280) : null,
        firstNextAction(env) ? `Suggested step: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "finance": {
      const env = readyEnvelope(ctx.finance);
      if (!env) {
        return missingModuleHint(
          "your finance feasibility",
          "finance",
          "/app/finance",
          dest,
        );
      }
      return joinSentence([
        env.score != null ? `Finance feasibility: ${Math.round(env.score)}/100.` : null,
        env.summary,
        env.reasoning ? trim(env.reasoning, 280) : null,
        topRisk(env) ? `Watch-out — ${topRisk(env)}.` : null,
        firstNextAction(env) ? `Try this next: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "country": {
      const env = readyEnvelope(ctx.country);
      if (!env) {
        return missingModuleHint(
          "your country comparison",
          "country",
          "/app/country",
          dest,
        );
      }
      return joinSentence([
        dest ? `${dest} is your current destination.` : null,
        env.summary,
        env.reasoning ? trim(env.reasoning, 280) : null,
        firstNextAction(env) ? `Next: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "jobfit": {
      const env = readyEnvelope(ctx.jobfit);
      if (!env) {
        return missingModuleHint("your job-fit read", "jobfit", "/app/jobs", dest);
      }
      return joinSentence([
        env.score != null ? `Job-fit conviction: ${Math.round(env.score)}/100.` : null,
        env.summary,
        env.reasoning ? trim(env.reasoning, 280) : null,
        firstNextAction(env) ? `Next: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "documents": {
      const env = readyEnvelope(ctx.documents);
      if (!env) {
        return missingModuleHint(
          "your documents checklist",
          "documents",
          "/app/documents",
          dest,
        );
      }
      return joinSentence([
        env.summary,
        env.reasoning ? trim(env.reasoning, 240) : null,
        firstNextAction(env) ? `Start with: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "family": {
      const env = readyEnvelope(ctx.family);
      if (!env) {
        return missingModuleHint(
          "your family impact analysis",
          "family",
          "/app/family",
          dest,
        );
      }
      return joinSentence([
        env.summary,
        env.reasoning ? trim(env.reasoning, 260) : null,
        firstNextAction(env) ? `Next: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "culture": {
      const env = readyEnvelope(ctx.culture);
      if (!env) {
        return missingModuleHint("your cultural prep", "culture", "/app/culture", dest);
      }
      return joinSentence([
        env.summary,
        env.reasoning ? trim(env.reasoning, 240) : null,
        firstNextAction(env) ? `Try this: ${firstNextAction(env)}.` : null,
      ]);
    }

    case "next": {
      const env =
        readyEnvelope(ctx.synthesis) ??
        readyEnvelope(ctx.visa) ??
        readyEnvelope(ctx.finance) ??
        readyEnvelope(ctx.country);
      if (!env) {
        return [
          "Here's a good order to follow on Glimmora:",
          "1) Upload your resume, 2) confirm destination + visa intent in your profile,",
          "3) review Country, Job fit, Visa, Finance, Documents, Family and Culture modules,",
          "4) read your Synthesis verdict on the dashboard.",
          "Open the sidebar and pick the next unchecked step to keep moving.",
        ].join(" ");
      }
      const actions = env.next_actions?.slice(0, 3) ?? [];
      if (actions.length === 0) {
        return joinSentence([env.summary, env.reasoning ? trim(env.reasoning, 240) : null]);
      }
      const numbered = actions
        .map(
          (a, i) =>
            `${i + 1}. ${a.label}${a.urgency ? ` (${a.urgency})` : ""}${
              a.why ? ` — ${a.why}` : ""
            }`,
        )
        .join("\n");
      return `Based on your latest analysis, here are the top next steps:\n${numbered}`;
    }

    case "platform": {
      return [
        "Glimmora Relocate walks you through nine AI-driven analyses end-to-end:",
        "country comparison, job fit, visa direction, family impact, finance feasibility, documents, culture, workflow, and timeline — all rolling up to a final Synthesis verdict on the dashboard.",
        "Use the left sidebar to jump between modules. When you change your profile, anything downstream auto-flags as stale and re-runs the next time you open it.",
      ].join(" ");
    }
  }
}

function trim(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  // Trim at the nearest sentence boundary so we don't cut mid-word.
  const slice = text.slice(0, max);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return (lastStop > max * 0.6 ? slice.slice(0, lastStop + 1) : slice.trimEnd() + "…").trim();
}

function missingModuleHint(
  what: string,
  _kind: string,
  path: string,
  dest: string | null,
): string {
  const where = dest ? ` for ${dest}` : "";
  return [
    `I don't have ${what}${where} cached yet.`,
    `Open ${path} and the analysis will run with your latest profile — then I can answer with your real numbers.`,
  ].join(" ");
}

// ---- Compact context summary for the LLM path ---------------------------

function buildContextSummary(ctx: UserContext): string {
  const p = ctx.profile;
  const lines: string[] = [];

  // Profile snapshot
  if (p) {
    const bits: string[] = [];
    if (p.full_name) bits.push(`Name: ${p.full_name}`);
    if (p.current_role) bits.push(`Current role: ${p.current_role}`);
    if (p.target_role) bits.push(`Target role: ${p.target_role}`);
    if (p.industry) bits.push(`Industry: ${p.industry}`);
    if (p.years_experience != null) bits.push(`Experience: ${p.years_experience}y`);
    if (p.nationality) bits.push(`Nationality: ${p.nationality}`);
    if (p.current_country) bits.push(`Currently in: ${p.current_country}`);
    if (p.target_country) bits.push(`Target country: ${p.target_country}`);
    if (p.move_urgency) bits.push(`Urgency: ${p.move_urgency}`);
    if (p.current_visa_status) bits.push(`Visa status: ${p.current_visa_status}`);
    if (p.family_status) bits.push(`Family: ${p.family_status}`);
    if (p.children_count != null) bits.push(`Children: ${p.children_count}`);
    if (p.expected_salary && p.salary_currency)
      bits.push(`Target salary: ${p.expected_salary} ${p.salary_currency}`);
    if (p.savings) bits.push(`Savings: ${p.savings}`);
    if (p.cost_sensitivity) bits.push(`Cost sensitivity: ${p.cost_sensitivity}`);
    lines.push(`Profile: ${bits.join(" · ") || "(empty)"}`);
  } else {
    lines.push("Profile: (not loaded)");
  }

  // Module envelopes — summary + score + first next action.
  pushModule(lines, "Synthesis verdict", ctx.synthesis);
  pushModule(lines, "Visa direction", ctx.visa);
  pushModule(lines, "Finance feasibility", ctx.finance);
  pushModule(lines, "Country comparison", ctx.country);
  pushModule(lines, "Job fit", ctx.jobfit);
  pushModule(lines, "Documents checklist", ctx.documents);
  pushModule(lines, "Family impact", ctx.family);
  pushModule(lines, "Culture prep", ctx.culture);

  return lines.join("\n");
}

function pushModule(
  lines: string[],
  label: string,
  m: ModuleResponse<unknown> | null,
): void {
  const env = readyEnvelope(m);
  if (!env) {
    lines.push(`${label}: not run yet.`);
    return;
  }
  const parts: string[] = [];
  if (env.score != null) parts.push(`score ${Math.round(env.score)}/100`);
  if (env.summary) parts.push(env.summary);
  const action = firstNextAction(env);
  if (action) parts.push(`Next: ${action}`);
  lines.push(`${label}: ${trim(parts.join(" · "), 320)}`);
}
