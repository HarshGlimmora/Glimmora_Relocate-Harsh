/**
 * Intent layer.
 *
 * The user picks a primary intent at onboarding. That choice changes:
 *   - which module is the lead value page on the dashboard
 *   - the order of secondary modules in the sidebar
 *   - the framing copy at the top of each module page
 *
 * Backend logic does not change — only emphasis, copy, and ordering.
 */

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const INTENT_IDS = [
  "compare_countries",
  "relocate_with_offer",
  "find_job_abroad",
  "visa_feasibility",
  "family_relocation",
  "stress_test_affordability",
  "documents_timeline",
  "move_fast",
] as const;

export type Intent = (typeof INTENT_IDS)[number];

export interface IntentMeta {
  id: Intent;
  label: string;
  hint: string;
  /**
   * Module slugs in priority order. The first item is the "lead module" —
   * the synthesis page surfaces it first; sidebar puts it at the top of
   * Analysis. Later items are secondary emphasis.
   */
  emphasis: ModuleSlug[];
  /** Synthesis-page framing line. */
  synthesisLead: string;
  /** Module-page framing key → copy. Pages read this to set their eyebrow. */
  framing: Partial<Record<ModuleSlug, string>>;
}

export type ModuleSlug =
  | "country"
  | "jobs"
  | "visa"
  | "family"
  | "finance"
  | "documents"
  | "workflow"
  | "culture"
  | "timeline"
  | "synthesis";

const ALL: ModuleSlug[] = [
  "country", "jobs", "visa", "family", "finance",
  "documents", "workflow", "culture", "timeline", "synthesis",
];

export const INTENTS: Record<Intent, IntentMeta> = {
  compare_countries: {
    id: "compare_countries",
    label: "Compare countries",
    hint: "I'm weighing more than one destination.",
    emphasis: ["country", "jobs", "finance", "visa", "synthesis", "culture", "documents", "timeline", "workflow", "family"],
    synthesisLead: "Best destination match for your profile.",
    framing: {
      country: "This is your primary question — which country wins.",
      jobs: "Career angle for the destination you're leaning toward.",
      finance: "Cost-of-living reality for your shortlist.",
    },
  },
  relocate_with_offer: {
    id: "relocate_with_offer",
    label: "I have an offer",
    hint: "I'm relocating with a job in hand.",
    emphasis: ["visa", "documents", "timeline", "finance", "family", "workflow", "culture", "jobs", "country", "synthesis"],
    synthesisLead: "What it takes to land your offer.",
    framing: {
      visa: "The route from offer to residence.",
      documents: "What HR will ask for.",
      timeline: "Earliest realistic relocation date.",
    },
  },
  find_job_abroad: {
    id: "find_job_abroad",
    label: "Find a job abroad",
    hint: "I need an offer before I can move.",
    emphasis: ["jobs", "visa", "country", "finance", "culture", "documents", "workflow", "timeline", "family", "synthesis"],
    synthesisLead: "Your most realistic job pathway.",
    framing: {
      jobs: "Roles where your skills convert and sponsors hire.",
      visa: "Which visa unlocks once you have an offer.",
    },
  },
  visa_feasibility: {
    id: "visa_feasibility",
    label: "Visa feasibility",
    hint: "I want to know if a visa is even realistic.",
    emphasis: ["visa", "documents", "country", "jobs", "timeline", "workflow", "family", "finance", "culture", "synthesis"],
    synthesisLead: "The visa route most likely to clear.",
    framing: {
      visa: "Your strongest route — and what blocks it.",
      documents: "Paperwork the consulate will scrutinize.",
    },
  },
  family_relocation: {
    id: "family_relocation",
    label: "Move with family",
    hint: "Spouse, children, or dependents are coming.",
    emphasis: ["family", "finance", "documents", "timeline", "country", "visa", "culture", "workflow", "jobs", "synthesis"],
    synthesisLead: "What this move costs your household.",
    framing: {
      family: "How a partner, kids, and parents change the move.",
      finance: "Household affordability — not just your paycheck.",
      documents: "Family-tier documents, not just yours.",
    },
  },
  stress_test_affordability: {
    id: "stress_test_affordability",
    label: "Stress-test affordability",
    hint: "Can I actually afford this comfortably?",
    emphasis: ["finance", "country", "family", "jobs", "timeline", "documents", "visa", "workflow", "culture", "synthesis"],
    synthesisLead: "Whether the numbers work, honestly.",
    framing: {
      finance: "Net surplus, runway, and the risks no one tells you.",
      country: "Cost-of-living reality, not glossy averages.",
    },
  },
  documents_timeline: {
    id: "documents_timeline",
    label: "Documents & timeline",
    hint: "I want a checklist and a date.",
    emphasis: ["documents", "timeline", "workflow", "visa", "country", "family", "finance", "jobs", "culture", "synthesis"],
    synthesisLead: "The shortest realistic path to ready.",
    framing: {
      documents: "What's missing, what's expiring, what blocks the route.",
      timeline: "Earliest realistic start date with current blockers.",
    },
  },
  move_fast: {
    id: "move_fast",
    label: "Move fast",
    hint: "Speed matters more than optimization.",
    emphasis: ["timeline", "workflow", "documents", "visa", "country", "jobs", "finance", "family", "culture", "synthesis"],
    synthesisLead: "The fastest path that actually clears.",
    framing: {
      timeline: "Your shortest critical path — and where it stalls.",
      workflow: "What's blocking what, ranked by impact.",
    },
  },
};

export function isIntent(s: unknown): s is Intent {
  return typeof s === "string" && (INTENT_IDS as readonly string[]).includes(s);
}

/** Read the user's intent from the consumer DB. Null if not yet selected. */
export async function getIntent(): Promise<IntentMeta | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { intent: true },
  });
  if (!u?.intent || !isIntent(u.intent)) return null;
  return INTENTS[u.intent];
}

/**
 * Sidebar / dashboard ordering. If no intent yet, returns the canonical
 * order. Otherwise reorders so emphasis modules come first.
 */
export function moduleOrder(intent: IntentMeta | null): ModuleSlug[] {
  if (!intent) return ALL;
  const emph = intent.emphasis;
  const seen = new Set(emph);
  return [...emph, ...ALL.filter((m) => !seen.has(m))];
}

/** Module-page eyebrow line.
 *
 * If the intent has explicit copy for this slug, use it. Otherwise fall
 * back to a slug+intent generic line so every page still surfaces an
 * intent-aware framing — that's the "feel like the system reacted to you"
 * promise. Returns null only when no intent is set yet.
 */
export function framingFor(slug: ModuleSlug, intent: IntentMeta | null): string | null {
  if (!intent) return null;
  if (intent.framing[slug]) return intent.framing[slug]!;
  // Generic per-slug fallback referencing the user's intent label.
  const lead = intent.emphasis[0];
  const isLead = slug === lead;
  if (isLead) return intent.synthesisLead;
  return `Filtered through your goal: ${intent.label.toLowerCase()}.`;
}
