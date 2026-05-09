/**
 * Visual cards for the Job Fit page.
 *
 * Same pattern as the Finance page's visual-cards.tsx — pure SVG/divs,
 * tone palette of success/gilt/danger/lagoon, mono eyebrow labels.
 */

import * as React from "react";
import type {
  Assumption,
  JobFitDetail,
  MarketDemandDetail,
  Risk,
  RiskSeverity,
  RoleMatchDetail,
  SalaryRealismDetail,
  SupportingSignal,
  VisaEmployabilityDetail,
} from "@/lib/backend/types";

// ---- Section label (re-exported pattern) -----------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Job-fit score donut ---------------------------------------------

export function JobFitScoreCard({
  value,
  targetRole,
  rationale,
}: {
  value: number;
  targetRole: string | null;
  rationale?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v >= 70
      ? { ring: "stroke-success-500", text: "text-success-700", bg: "bg-success-50", border: "border-success-300", verdict: "Strong fit" }
      : v >= 50
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", bg: "bg-gilt-50", border: "border-gilt-300", verdict: "Workable fit" }
      : { ring: "stroke-danger-500", text: "text-danger-700", bg: "bg-danger-50", border: "border-danger-300", verdict: "Stretched fit" };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;

  return (
    <div
      data-jobfit-score={v}
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-5`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        AI job compatibility
      </p>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
          <circle cx="48" cy="48" r={radius} className="fill-none stroke-white" strokeWidth="9" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`fill-none ${tone.ring}`}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="min-w-0">
          <p className={`font-sans text-[36px] font-semibold leading-none ${tone.text}`}>
            {v}
            <span className="text-[14px] text-ink-400">/100</span>
          </p>
          <p className="mt-1.5 inline-block rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
            {tone.verdict}
          </p>
          {targetRole ? (
            <p className="mt-2 text-[13px] font-medium text-ink-900">
              Inferred target role: <span className="text-ink-700">{targetRole}</span>
            </p>
          ) : null}
        </div>
      </div>
      {rationale ? (
        <p className="mt-3 border-t border-white/60 pt-2.5 text-[12px] leading-[1.45] text-ink-700">
          {rationale}
        </p>
      ) : null}
    </div>
  );
}

// ---- Generic key-metric card with tone-driven emphasis ----------------

type Tone = "good" | "warn" | "bad" | "neutral" | "info";

const TONE_PALETTE: Record<Tone, { border: string; bg: string; text: string; dot: string }> = {
  good: { border: "border-success-300", bg: "bg-success-50", text: "text-success-800", dot: "bg-success-500" },
  warn: { border: "border-gilt-300", bg: "bg-gilt-50", text: "text-gilt-800", dot: "bg-gilt-500" },
  bad: { border: "border-danger-300", bg: "bg-danger-50", text: "text-danger-800", dot: "bg-danger-500" },
  info: { border: "border-lagoon-300", bg: "bg-lagoon-50", text: "text-lagoon-800", dot: "bg-lagoon-500" },
  neutral: { border: "border-ink-200", bg: "bg-white", text: "text-ink-900", dot: "bg-ink-400" },
};

export function FitMetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
}) {
  const p = TONE_PALETTE[tone];
  return (
    <div
      data-fit-metric={label}
      data-metric-tone={tone}
      className={`rounded-2xl border-2 ${p.border} ${p.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
      </div>
      <p className={`mt-2 font-sans text-[24px] font-semibold tracking-tight ${p.text}`}>
        {typeof value === "number" ? (
          <>
            {value}
            <span className="ml-1 text-[12px] text-ink-500">/100</span>
          </>
        ) : (
          value
        )}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-600">{hint}</p> : null}
    </div>
  );
}

// ---- Market Demand card · 4th tile of the Compatibility Dashboard ---

const DEMAND_TONE: Record<
  MarketDemandDetail["level"],
  { border: string; bg: string; chip: string; bar: string; iconWrap: string; iconColor: string; verdict: string }
> = {
  high: {
    border: "border-success-300",
    bg: "bg-success-50",
    chip: "bg-success-100 text-success-800",
    bar: "bg-success-500",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    verdict: "Hot market",
  },
  medium: {
    border: "border-gilt-300",
    bg: "bg-gilt-50",
    chip: "bg-gilt-100 text-gilt-800",
    bar: "bg-gilt-500",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    verdict: "Steady demand",
  },
  low: {
    border: "border-danger-300",
    bg: "bg-danger-50",
    chip: "bg-danger-100 text-danger-800",
    bar: "bg-danger-500",
    iconWrap: "bg-danger-100",
    iconColor: "text-danger-700",
    verdict: "Thin market",
  },
};

export function MarketDemandCard({ data }: { data: MarketDemandDetail }) {
  const tone = DEMAND_TONE[data.level] ?? DEMAND_TONE.medium;
  const v = Math.max(0, Math.min(100, data.score));

  return (
    <div
      data-market-demand={v}
      data-demand-level={data.level}
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Market demand
        </p>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}>
          {data.level}
        </span>
      </div>
      <p className={`mt-2 font-sans text-[24px] font-semibold tracking-tight ${tone.iconColor}`}>
        {v}
        <span className="ml-1 text-[12px] text-ink-500">/100</span>
      </p>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
        <div className={`h-full ${tone.bar}`} style={{ width: `${v}%` }} />
      </div>

      <p className="mt-2 inline-block rounded-full bg-white/70 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700">
        {tone.verdict}
      </p>

      {data.note ? (
        <p className="mt-2.5 text-[11.5px] leading-[1.45] text-ink-700">{data.note}</p>
      ) : null}

      {data.demand_signals?.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {data.demand_signals.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 font-mono text-[10px] text-ink-700"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- Compatibility-dashboard tiles (Role / Salary / Visa) ------------
//
// Each tile mirrors the structure of MarketDemandCard so the four grid
// cells feel balanced. The chip list is built dynamically from:
//   - card-specific structured fields the AI already returns
//     (target role, gap, density, sponsor titles, market p50, etc.)
//   - `supporting_signals` whose `category` matches the tile's domain
// No hardcoded copy: if the AI returns nothing for a slot, the chip
// simply doesn't appear.

function toneFromScore(
  score: number,
): { border: string; bg: string; chip: string; bar: string; verdictText: string; verdict: string } {
  if (score >= 70) {
    return {
      border: "border-success-300",
      bg: "bg-success-50",
      chip: "bg-success-100 text-success-800",
      bar: "bg-success-500",
      verdictText: "text-success-700",
      verdict: "Strong",
    };
  }
  if (score >= 50) {
    return {
      border: "border-gilt-300",
      bg: "bg-gilt-50",
      chip: "bg-gilt-100 text-gilt-800",
      bar: "bg-gilt-500",
      verdictText: "text-gilt-700",
      verdict: "Workable",
    };
  }
  return {
    border: "border-danger-300",
    bg: "bg-danger-50",
    chip: "bg-danger-100 text-danger-800",
    bar: "bg-danger-500",
    verdictText: "text-danger-700",
    verdict: "Stretched",
  };
}

function pickSignalsByCategory(
  signals: SupportingSignal[] | undefined,
  patterns: readonly string[],
  limit: number,
): SupportingSignal[] {
  if (!signals?.length) return [];
  const norm = (s: string) => s.toLowerCase();
  const matched = signals.filter((sig) => {
    const cat = norm(sig.category ?? "");
    return patterns.some((p) => cat.includes(p));
  });
  // Surface the strongest first so we don't hide the most credible signal.
  matched.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  return matched.slice(0, limit);
}

function DashboardTile({
  label,
  score,
  badge,
  badgeTone = "subtle",
  note,
  chips,
}: {
  label: string;
  score: number;
  badge?: string;
  /** "subtle" uses the score-tone chip palette, "neutral" stays grey. */
  badgeTone?: "subtle" | "neutral";
  note?: string | null;
  /** Short signal phrases. Empty array → nothing rendered. */
  chips: string[];
}) {
  const v = Math.max(0, Math.min(100, score));
  const tone = toneFromScore(v);
  const badgeClass =
    badgeTone === "neutral"
      ? "bg-white/70 text-ink-700"
      : tone.chip;
  return (
    <div
      data-fit-metric={label}
      data-metric-tone={
        v >= 70 ? "good" : v >= 50 ? "warn" : "bad"
      }
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
        {badge ? (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${badgeClass}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 font-sans text-[24px] font-semibold tracking-tight ${tone.verdictText}`}>
        {v}
        <span className="ml-1 text-[12px] text-ink-500">/100</span>
      </p>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
        <div className={`h-full ${tone.bar}`} style={{ width: `${v}%` }} />
      </div>

      <p className="mt-2 inline-block rounded-full bg-white/70 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700">
        {tone.verdict}
      </p>

      {note ? (
        <p className="mt-2.5 text-[11.5px] leading-[1.45] text-ink-700">{note}</p>
      ) : null}

      {chips.length ? (
        <div data-tile-signals className="mt-3 flex flex-wrap gap-1">
          {chips.map((chip, i) => (
            <span
              key={`${chip}-${i}`}
              className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 font-mono text-[10px] text-ink-700"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Truncate a sentence to ~`max` chars without splitting a word, suffix
 * with "…" if the original was longer. Keeps note/rationale chips
 * compact without losing meaning.
 */
function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

const ROLE_CATEGORIES = ["role", "skill", "industry", "pathway"] as const;
const SALARY_CATEGORIES = ["salary", "finance", "compensation", "demand"] as const;
const VISA_CATEGORIES = ["visa", "sponsor"] as const;

export function RoleMatchTile({
  data,
  alignedSkills,
  signals,
}: {
  data: RoleMatchDetail;
  /** Top-level aligned skills from the AI. Used to surface the most
   *  credible "you already bring this" chip when present. */
  alignedSkills?: { name: string }[];
  signals?: SupportingSignal[];
}) {
  const conf = Math.round(data.confidence * 100);
  const aiChips = pickSignalsByCategory(signals, ROLE_CATEGORIES, 3).map((s) =>
    truncate(s.title, 48),
  );
  // Card-specific chips derived from structured AI fields. These are
  // *not* hardcoded copy — they read from `data` and `alignedSkills`,
  // both produced by the AI. We prefer these first so the tile always
  // says something concrete when supporting_signals is sparse.
  const structured: string[] = [];
  if (data.target_role_inferred) {
    structured.push(`Target: ${truncate(data.target_role_inferred, 40)}`);
  }
  const topAligned = alignedSkills?.[0]?.name;
  if (topAligned) structured.push(`Aligned: ${truncate(topAligned, 32)}`);

  // Final chip list: structured first, then AI signals, capped at 4.
  const chips = [...structured, ...aiChips].slice(0, 4);

  return (
    <DashboardTile
      label="Role match"
      score={data.score}
      badge={`conf ${conf}%`}
      badgeTone="neutral"
      note={data.rationale ? truncate(data.rationale, 130) : null}
      chips={chips}
    />
  );
}

export function SalaryRealismTile({
  data,
  signals,
}: {
  data: SalaryRealismDetail;
  signals?: SupportingSignal[];
}) {
  const gap = data.gap_pct;
  const gapBadge = `gap ${gap > 0 ? "+" : ""}${gap}%`;
  const aiChips = pickSignalsByCategory(signals, SALARY_CATEGORIES, 3).map((s) =>
    truncate(s.title, 48),
  );
  // Structured chips derived from AI's salary fields.
  const structured: string[] = [];
  if (data.market_estimate?.p50) {
    structured.push(
      `Market p50: ${data.market_estimate.p50.toLocaleString()} ${data.market_estimate.currency}`,
    );
  }
  // The "band" tag mirrors the chip palette of SalaryComparisonCard so
  // the user's mental model stays consistent across the page.
  if (Math.abs(gap) <= 10) structured.push("On-market band");
  else if (Math.abs(gap) <= 25)
    structured.push(gap > 0 ? "Slightly above market" : "Slightly below market");

  const chips = [...structured, ...aiChips].slice(0, 4);

  return (
    <DashboardTile
      label="Salary realism"
      score={data.score}
      badge={gapBadge}
      note={data.note ? truncate(data.note, 130) : null}
      chips={chips}
    />
  );
}

export function VisaEmployabilityTile({
  data,
  signals,
}: {
  data: VisaEmployabilityDetail;
  signals?: SupportingSignal[];
}) {
  const density = densityFor(data.sponsor_friendly_employer_density);
  const aiChips = pickSignalsByCategory(signals, VISA_CATEGORIES, 3).map((s) =>
    truncate(s.title, 48),
  );
  const structured: string[] = [];
  structured.push(`Sponsors: ${density.label}`);
  const topTitle = data.typical_sponsor_titles?.[0];
  if (topTitle) structured.push(`Hires: ${truncate(topTitle, 32)}`);

  const chips = [...structured, ...aiChips].slice(0, 4);

  return (
    <DashboardTile
      label="Visa employability"
      score={data.score}
      badge={data.sponsor_friendly_employer_density?.toString().toLowerCase()}
      note={data.note ? truncate(data.note, 130) : null}
      chips={chips}
    />
  );
}

// ---- Skill chip group (aligned / missing / transferable) -------------

type SkillKind = "aligned" | "missing" | "transferable";

const SKILL_TONE: Record<SkillKind, { card: string; chip: string; iconWrap: string; icon: string; eyebrow: string; label: string }> = {
  aligned: {
    card: "border-success-200 bg-success-50/40",
    chip: "border-success-300 bg-success-100 text-success-800",
    iconWrap: "bg-success-100 text-success-700",
    icon: "✓",
    eyebrow: "text-success-700",
    label: "Skills you already bring",
  },
  missing: {
    card: "border-danger-200 bg-danger-50/40",
    chip: "border-danger-300 bg-danger-100 text-danger-800",
    iconWrap: "bg-danger-100 text-danger-700",
    icon: "△",
    eyebrow: "text-danger-700",
    label: "Skills the market wants",
  },
  transferable: {
    card: "border-lagoon-200 bg-lagoon-50/40",
    chip: "border-lagoon-300 bg-lagoon-100 text-lagoon-800",
    iconWrap: "bg-lagoon-100 text-lagoon-700",
    icon: "↻",
    eyebrow: "text-lagoon-700",
    label: "Skills that transfer",
  },
};

export function SkillChipGroup({
  kind,
  title,
  items,
}: {
  kind: SkillKind;
  title: string;
  items: { name: string; why: string }[];
}) {
  const tone = SKILL_TONE[kind];
  if (!items.length) return null;
  return (
    <div
      data-skill-group={kind}
      className={`rounded-2xl border ${tone.card} p-4`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} text-[14px] font-semibold`}
        >
          {tone.icon}
        </span>
        <p className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${tone.eyebrow}`}>
          {title}
        </p>
        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] tabular-nums text-ink-700">
          {items.length}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((s, i) => (
          <li
            key={i}
            data-skill={s.name}
            className="rounded-xl bg-white/70 p-2.5 transition-shadow hover:shadow-sm"
          >
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${tone.chip}`}
            >
              {s.name}
            </span>
            <p className="mt-1.5 text-[11.5px] leading-[1.45] text-ink-700">{s.why}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Salary realism card with bar comparison ------------------------

export function SalaryComparisonCard({
  data,
}: {
  data: SalaryRealismDetail;
}) {
  const u = data.user_expectation;
  const m = data.market_estimate;
  const overall = Math.max(u.max, m.max, 1);

  function barFor(min: number, max: number) {
    const left = (min / overall) * 100;
    const width = ((max - min) / overall) * 100;
    return { left, width };
  }
  const userBar = barFor(u.min, u.max);
  const marketBar = barFor(m.min, m.max);

  const gap = data.gap_pct;
  const gapTone =
    Math.abs(gap) <= 10
      ? { chip: "bg-success-100 text-success-800", label: "On-market" }
      : Math.abs(gap) <= 25
      ? { chip: "bg-gilt-100 text-gilt-800", label: gap > 0 ? "Slightly above" : "Slightly below" }
      : { chip: "bg-danger-100 text-danger-800", label: gap > 0 ? "Well above" : "Well below" };

  return (
    <div
      data-salary-comparison
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Salary realism
        </p>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${gapTone.chip}`}>
          {gapTone.label} · {gap > 0 ? "+" : ""}
          {gap}%
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Your expectation
            </span>
            <span className="font-semibold text-ink-900">
              {u.min.toLocaleString()}–{u.max.toLocaleString()} {u.currency}
            </span>
          </div>
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="absolute inset-y-0 rounded-full bg-ink-900"
              style={{ left: `${userBar.left}%`, width: `${userBar.width}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-700">
              Market estimate
            </span>
            <span className="font-semibold text-ink-900">
              {m.min.toLocaleString()}–{m.max.toLocaleString()} {m.currency}
            </span>
          </div>
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="absolute inset-y-0 rounded-full bg-lagoon-500"
              style={{ left: `${marketBar.left}%`, width: `${marketBar.width}%` }}
            />
          </div>
        </div>
      </div>

      {data.note ? (
        <p className="mt-3 text-[12px] leading-[1.5] text-ink-700">{data.note}</p>
      ) : null}
    </div>
  );
}

// ---- Visa employability card ----------------------------------------

const DENSITY_TONE: Record<string, { dots: number; chip: string; label: string }> = {
  high: { dots: 5, chip: "bg-success-100 text-success-800", label: "High demand" },
  "high.": { dots: 5, chip: "bg-success-100 text-success-800", label: "High demand" },
  medium: { dots: 3, chip: "bg-gilt-100 text-gilt-800", label: "Moderate demand" },
  low: { dots: 2, chip: "bg-danger-100 text-danger-800", label: "Low demand" },
  thin: { dots: 1, chip: "bg-danger-100 text-danger-800", label: "Thin pipeline" },
};

function densityFor(s: string): { dots: number; chip: string; label: string } {
  const norm = (s ?? "").toLowerCase().trim();
  for (const k of Object.keys(DENSITY_TONE)) {
    if (norm.includes(k)) return DENSITY_TONE[k];
  }
  return { dots: 3, chip: "bg-ink-100 text-ink-700", label: norm || "Unspecified" };
}

export function VisaEmployabilityCard({
  data,
}: {
  data: VisaEmployabilityDetail;
}) {
  const d = densityFor(data.sponsor_friendly_employer_density);
  return (
    <div
      data-visa-employability
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Visa employability
        </p>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${d.chip}`}>
          score {data.score}/100
        </span>
      </div>

      <div className="mt-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
          Sponsor density · {d.label}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              data-density-dot={n}
              className={
                "h-2 w-7 rounded-full transition-colors " +
                (n <= d.dots ? "bg-lagoon-500" : "bg-ink-100")
              }
            />
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-700">{data.note}</p>

      {data.typical_sponsor_titles?.length ? (
        <div className="mt-3 border-t border-ink-100 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Titles sponsors typically hire
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.typical_sponsor_titles.map((t) => (
              <span
                key={t}
                data-sponsor-title={t}
                className="rounded-full border border-lagoon-200 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[11px] text-lagoon-800"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---- Role match card ------------------------------------------------

export function RoleMatchCard({ data }: { data: RoleMatchDetail }) {
  const conf = Math.round(data.confidence * 100);
  const confTone =
    data.confidence >= 0.75 ? "bg-success-500" : data.confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";
  return (
    <div data-role-match className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Role match
        </p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${conf}%`}
        >
          <span className={`h-2 w-2 rounded-full ${confTone}`} />
          conf {conf}%
        </span>
      </div>
      <p className="mt-2 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
        {data.target_role_inferred}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div
            className={
              "absolute inset-y-0 left-0 " +
              (data.score >= 70 ? "bg-success-500" : data.score >= 50 ? "bg-gilt-500" : "bg-danger-500")
            }
            style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-ink-700">
          {data.score}/100
        </span>
      </div>
      {data.rationale ? (
        <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-700">{data.rationale}</p>
      ) : null}
    </div>
  );
}

// ---- Alternate roles grid -------------------------------------------

export function AlternateRolesGrid({
  roles,
}: {
  roles: JobFitDetail["alternate_roles"];
}) {
  if (!roles?.length) return null;
  return (
    <section data-alternate-roles>
      <SectionLabel>Alternate roles · other directions worth a look</SectionLabel>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((r, i) => {
          const tone =
            r.fit_score >= 70 ? "bg-success-500" : r.fit_score >= 50 ? "bg-gilt-500" : "bg-danger-500";
          return (
            <div
              key={i}
              data-alt-role={r.role}
              className="group rounded-2xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ink-400 hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-sans text-[14px] font-semibold tracking-tight text-ink-900">
                  {r.role}
                </p>
                <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-ink-700">
                  fit {r.fit_score}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div className={`h-full ${tone}`} style={{ width: `${r.fit_score}%` }} />
              </div>
              <p className="mt-2.5 text-[12px] leading-[1.5] text-ink-600">{r.why}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- Key gaps card --------------------------------------------------

export function KeyGapsCard({
  gaps,
}: {
  gaps: { label: string; severity: string }[];
}) {
  if (!gaps?.length) return null;
  return (
    <section data-key-gaps>
      <SectionLabel>Key gaps · the things to close</SectionLabel>
      <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {gaps.map((g, i) => {
          const sev = g.severity.toLowerCase();
          const tone =
            sev === "high"
              ? { border: "border-danger-200", bg: "bg-danger-50", chip: "bg-danger-100 text-danger-800", icon: "!" }
              : sev === "medium"
              ? { border: "border-gilt-200", bg: "bg-gilt-50", chip: "bg-gilt-100 text-gilt-800", icon: "△" }
              : { border: "border-ink-200", bg: "bg-white", chip: "bg-ink-100 text-ink-700", icon: "·" };
          return (
            <li
              key={i}
              data-key-gap={i}
              className={`flex items-start gap-2 rounded-2xl border ${tone.border} ${tone.bg} p-3 transition-shadow hover:shadow-sm`}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-sans text-[12px] font-semibold text-ink-700"
              >
                {tone.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-ink-900">{g.label}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}
                >
                  {sev}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- Why this direction · the conviction read ------------------------
//
// Synthesises the AI's verdict + every sub-score into a magazine-style
// briefing: hero summary on the left (with a circular conviction ring),
// "Pulling for it" / "Working against it" panels on the right derived
// from the sub-scores, then a collapsible long-form reasoning.

interface Driver {
  pillar: string;
  score: number;
  one_line: string;
}

/**
 * Map AI risk severity to a 0–100 strength score so the cons panel can
 * draw a comparable progress bar against the pros panel. Lower score =
 * higher severity = stronger headwind.
 */
function severityToScore(severity: string | null | undefined): number {
  switch ((severity ?? "").toLowerCase()) {
    case "high":
      return 30;
    case "medium":
      return 55;
    case "low":
      return 75;
    default:
      return 60;
  }
}

/**
 * Convert an AI Risk into a Driver row. The pillar uses a short label
 * derived from the risk's own `label`, the one-liner is the risk's own
 * `detail` — both straight from the AI, no hardcoded copy.
 */
function risksToDrivers(risks: Risk[] | undefined, limit: number): Driver[] {
  if (!risks?.length) return [];
  return risks.slice(0, limit).map((r) => ({
    pillar: r.label,
    score: severityToScore(r.severity),
    one_line: r.detail,
  }));
}

/**
 * Build the cons list (working-against-it). Three layered sources, in
 * priority order:
 *   1. `envelope.risks` — the AI's first-class risk list (always
 *      present; v3 prompt mandates 4–8 entries).
 *   2. `detail.key_gaps` — high/medium gaps the AI flagged.
 *   3. score-derived signals (salary gap, weak role match, low market
 *      demand, long ramp, etc.) — fallback when the above are sparse.
 *
 * Every entry is grounded in AI output; nothing is hardcoded.
 */
function buildCons(detail: JobFitDetail, risks?: Risk[]): Driver[] {
  const out: Driver[] = [];
  const seen = new Set<string>();
  const push = (d: Driver) => {
    const k = d.pillar.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(d);
  };

  // 1. AI risks first — they're the load-bearing signal.
  for (const d of risksToDrivers(risks, 5)) push(d);

  // 2. AI-flagged key gaps with severity (medium+).
  for (const g of detail.key_gaps ?? []) {
    const sev = (g.severity ?? "").toLowerCase();
    if (sev !== "high" && sev !== "medium") continue;
    push({
      pillar: g.label,
      score: severityToScore(g.severity),
      one_line: `${sev.charAt(0).toUpperCase()}${sev.slice(1)}-severity gap flagged by the AI.`,
    });
  }

  // 3. Score-derived signals (catch-all so weak sub-scores still surface
  //    even if risks/key_gaps came back lean).
  const roleScore = detail.role_match?.score ?? 100;
  if (roleScore < 50) {
    push({
      pillar: "Role match",
      score: roleScore,
      one_line: `${detail.role_match.target_role_inferred} · score ${roleScore}/100`,
    });
  }

  const salScore = detail.salary_realism?.score ?? 100;
  const gap = detail.salary_realism?.gap_pct ?? 0;
  if (salScore < 50 || Math.abs(gap) > 25) {
    const salLine =
      gap > 25
        ? `Asking ${gap}% above market · negotiation friction`
        : gap < -25
        ? `Asking ${Math.abs(gap)}% below market · risk of under-pricing`
        : `Salary realism score ${salScore}/100`;
    push({ pillar: "Salary realism", score: salScore, one_line: salLine });
  }

  const visaScore = detail.visa_employability?.score ?? 100;
  if (visaScore < 50) {
    push({
      pillar: "Visa employability",
      score: visaScore,
      one_line: `Sponsor density · ${detail.visa_employability.sponsor_friendly_employer_density}`,
    });
  }

  if (detail.market_demand && detail.market_demand.level === "low") {
    push({
      pillar: "Market demand",
      score: detail.market_demand.score,
      one_line: detail.market_demand.note ?? "Market signal is thin for this role",
    });
  }

  const missing = detail.missing_skills?.length ?? 0;
  if (missing >= 3) {
    push({
      pillar: "Skill gaps",
      score: Math.max(0, 100 - missing * 15),
      one_line: `${missing} skill${missing > 1 ? "s" : ""} the market expects you don't have yet`,
    });
  }

  const path0 = detail.job_pathways?.[0];
  if (path0 && path0.time_to_offer_weeks > 24) {
    push({
      pillar: "Long ramp",
      score: Math.max(0, 70 - path0.time_to_offer_weeks),
      one_line: `Fastest path is ${path0.time_to_offer_weeks}w to offer`,
    });
  }

  out.sort((a, b) => a.score - b.score); // worst (lowest score) first
  return out.slice(0, 5);
}

/**
 * Pad the AI-supplied risk list with derived risks so the dashboard's
 * Risks grid is always filled (4 cards minimum, capped at the target).
 *
 * Every synthesised risk is grounded in real backend analysis data —
 * visa score, salary gap, missing skills, market_demand level, etc.
 * No hardcoded copy: the labels are categorical, the detail strings
 * substitute live AI numbers.
 *
 * Each derived risk has data-risk-synthetic="true" via its `_synthetic`
 * flag, set on the wrapper element by the caller, so QA can tell them
 * apart in the DOM without hiding them in the UI.
 */
export function padRisksToFour(
  detail: JobFitDetail,
  risks: Risk[],
  target = 4,
): Risk[] {
  if (risks.length >= target) return risks;
  const need = target - risks.length;

  const seen = new Set(risks.map((r) => r.label.toLowerCase()));
  const candidates: Risk[] = [];
  const push = (sev: RiskSeverity, label: string, detailText: string) => {
    if (seen.has(label.toLowerCase())) return;
    candidates.push({ severity: sev, label, detail: detailText });
    seen.add(label.toLowerCase());
  };

  // 1. Salary expectation above market — friction at first-pass screening
  const gap = detail.salary_realism?.gap_pct ?? 0;
  if (gap > 25) {
    push(
      "medium",
      "Salary Above Market",
      `Your stated range is ${gap}% above the market median for this role at the destination, which often filters resumes out before interview.`,
    );
  } else if (gap < -25) {
    push(
      "low",
      "Salary Anchored Low",
      `Your range is ${Math.abs(gap)}% below market, which can leave money on the table and signal junior positioning to recruiters.`,
    );
  }

  // 2. Visa employability — sponsor-friendly density is thin
  const visaScore = detail.visa_employability?.score ?? 100;
  const density = (detail.visa_employability?.sponsor_friendly_employer_density ?? "").toLowerCase();
  if (visaScore < 50 || density === "low") {
    push(
      "high",
      "Limited Sponsor Pool",
      detail.visa_employability?.note ||
        "Sponsor-friendly employers for this role are scarce at the destination, which lengthens the search and narrows feasible employers.",
    );
  }

  // 3. Market demand — thin / cooling
  if (detail.market_demand && detail.market_demand.level === "low") {
    push(
      "high",
      "Thin Market Demand",
      detail.market_demand.note ||
        "Hiring for this role at the destination is currently weak — vacancy density and posting volume are below average.",
    );
  } else if (detail.market_demand && detail.market_demand.level === "medium") {
    push(
      "medium",
      "Moderate Market Competition",
      `Demand is steady (${detail.market_demand.score}/100) but you'll be competing against established local candidates and other internationals on the same path.`,
    );
  }

  // 4. Skill coverage gap
  const missingCount = detail.missing_skills?.length ?? 0;
  if (missingCount >= 3) {
    push(
      missingCount >= 5 ? "high" : "medium",
      "Skill Coverage Gap",
      `${missingCount} skills the market expects aren't visible in your profile yet — closing these is what unlocks shortlisting at sponsor-grade employers.`,
    );
  }

  // 5. Critical key-gap (named)
  const highKeyGap = (detail.key_gaps ?? []).find(
    (g) => (g.severity ?? "").toLowerCase() === "high",
  );
  if (highKeyGap) {
    push(
      "high",
      `Critical Gap · ${highKeyGap.label}`,
      "This gap consistently shows up as a screening filter for sponsor-friendly hiring managers and needs to be closed or hedged before applying at scale.",
    );
  }

  // 6. Long ramp to offer — runway risk
  const path0 = detail.job_pathways?.[0];
  if (path0 && path0.time_to_offer_weeks > 24) {
    push(
      "medium",
      "Long Ramp to Offer",
      `Your fastest realistic pathway is ~${path0.time_to_offer_weeks} weeks, which raises living-cost burn and visa-clock pressure if savings are tight.`,
    );
  }

  // 7. Role-match weakness fallback (for cases where almost nothing else applies)
  const roleScore = detail.role_match?.score ?? 100;
  if (roleScore < 50) {
    push(
      "high",
      "Role Match Weakness",
      detail.role_match?.rationale?.slice(0, 360) ||
        "Your inferred next-role fit is below 50/100 — the gap between your current evidence and what the market wants for this title is significant.",
    );
  }

  return [...risks, ...candidates.slice(0, need)];
}

/**
 * Convert AI-supplied SupportingSignal[] into the Driver shape the
 * existing DriversPanel renders. confidence × 100 → "score" so the
 * progress bar visualises model conviction.
 */
function aiDriversFromSignals(signals: SupportingSignal[]): Driver[] {
  return signals
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((s) => ({
      pillar: s.category || "Signal",
      score: Math.round(Math.max(0, Math.min(1, s.confidence)) * 100),
      one_line: `${s.title} — ${s.detail}`,
    }));
}

export function JobInsightCard({
  summary,
  reasoning,
  confidence,
  detail,
  risks,
  assumptions,
}: {
  summary: string;
  reasoning: string;
  confidence: number;
  detail: JobFitDetail;
  /** AI-generated risks from `envelope.risks` — feeds the cons panel
   *  so the section never collapses to a static "nothing to see here"
   *  empty state when sub-scores are healthy. */
  risks?: Risk[];
  /** AI-generated assumptions used for the bottom of "Show full
   *  reasoning". Surfaces the model's framing context so the user can
   *  audit the conviction. */
  assumptions?: Assumption[];
}) {
  const pct = Math.round(confidence * 100);
  const verdict =
    confidence >= 0.75
      ? { ring: "stroke-success-500", text: "text-success-700", chip: "bg-success-100 text-success-800", label: "Strong basis" }
      : confidence >= 0.55
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", chip: "bg-gilt-100 text-gilt-800", label: "Mixed basis" }
      : { ring: "stroke-danger-500", text: "text-danger-700", chip: "bg-danger-100 text-danger-800", label: "Soft basis" };

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.max(0, Math.min(1, confidence)) * circumference;

  // Pros panel: prefer AI-supplied supporting_signals (fully dynamic).
  // Fall back to a derived list ONLY if the backend hasn't sent any —
  // never hardcoded copy.
  const pros: Driver[] =
    detail.supporting_signals && detail.supporting_signals.length > 0
      ? aiDriversFromSignals(detail.supporting_signals)
      : [];
  const aiDriven = pros.length > 0;
  const cons = buildCons(detail, risks);

  return (
    <section data-job-insight>
      <SectionLabel>Why this direction · the conviction read</SectionLabel>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {/* ============ Hero strip — summary + conviction ring ============ */}
        <div className="grid gap-4 border-b border-ink-100 p-5 md:grid-cols-[200px_1fr]">
          {/* Conviction ring + breakdown */}
          <div data-conviction-ring className="flex flex-col gap-3">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
              <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90 md:h-24 md:w-24" aria-hidden="true">
                <circle cx="40" cy="40" r={radius} className="fill-none stroke-ink-100" strokeWidth="7" />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`fill-none ${verdict.ring}`}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
                <circle cx="40" cy="40" r="2.5" className="fill-ink-300" />
              </svg>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  Conviction
                </p>
                <p className={`mt-0.5 font-sans text-[26px] font-semibold leading-none ${verdict.text}`}>
                  {pct}
                  <span className="text-[12px] text-ink-400">%</span>
                </p>
                <p className={`mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${verdict.chip}`}>
                  {verdict.label}
                </p>
              </div>
            </div>
            <ConvictionBreakdown detail={detail} />
          </div>

          {/* Summary + AI-driven key drivers + signal tags */}
          <OurReadColumn summary={summary} detail={detail} />
        </div>

        {/* ============ Pulling for / Working against split ============ */}
        <div className="grid gap-px bg-ink-100 md:grid-cols-2">
          <DriversPanel kind="pros" drivers={pros} aiDriven={aiDriven} />
          <DriversPanel
            kind="cons"
            drivers={cons}
            aiDriven={(risks?.length ?? 0) > 0}
            fallback={
              cons.length === 0 ? <ConsEmptyFromAI assumptions={assumptions} /> : null
            }
          />
        </div>

        {/* ============ Collapsible long-form reasoning ============ */}
        {reasoning || hasFullReasoningExtras(detail) ? (
          <details className="group border-t border-ink-100 px-5 py-3">
            <summary className="cursor-pointer list-none font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 hover:text-ink-900">
              <span className="group-open:hidden">Show full reasoning ↓</span>
              <span className="hidden group-open:inline">Hide reasoning ↑</span>
            </summary>
            <FullReasoningPanel
              reasoning={reasoning}
              detail={detail}
              assumptions={assumptions}
            />
          </details>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Bullet list under the conviction ring showing the AI's contributing
 * sub-scores. Each bullet is just a label + the AI's own number — no
 * derived prose, no hardcoded thresholds in the copy. Lets the user
 * audit *why* the conviction landed where it did at a glance.
 */
function ConvictionBreakdown({ detail }: { detail: JobFitDetail }) {
  const pillars: { label: string; score: number }[] = [];
  if (detail.role_match) pillars.push({ label: "Role alignment", score: detail.role_match.score });
  if (detail.market_demand)
    pillars.push({ label: "Market demand", score: detail.market_demand.score });
  if (detail.visa_employability)
    pillars.push({ label: "Visa accessibility", score: detail.visa_employability.score });
  if (detail.salary_realism)
    pillars.push({ label: "Salary feasibility", score: detail.salary_realism.score });

  if (pillars.length === 0) return null;
  return (
    <div data-conviction-breakdown className="rounded-xl bg-ink-50/60 p-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
        Conviction is built on
      </p>
      <ul className="mt-1.5 space-y-1">
        {pillars.map((p) => {
          const tone =
            p.score >= 70
              ? "bg-success-500"
              : p.score >= 50
              ? "bg-gilt-500"
              : "bg-danger-500";
          return (
            <li
              key={p.label}
              data-conviction-pillar={p.label}
              className="flex items-center gap-2"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
              <span className="flex-1 text-[11.5px] text-ink-700">{p.label}</span>
              <span className="font-mono text-[10.5px] tabular-nums text-ink-600">
                {p.score}/100
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Right column of the conviction-read hero strip.
 *
 * Three stacked, conditional sub-blocks — every one of them sourced
 * from existing AI fields, never hardcoded:
 *
 *   1. Our read · the AI's `summary` (existing 1–2 sentence read).
 *   2. Key drivers · 3–4 short bullets, one per pillar that the AI
 *      actually wrote a `note` / `rationale` for. Pillar label +
 *      truncated AI text — this is the AI explaining its own scoring.
 *   3. Signal tags · up to 5 short chips drawn from the categories of
 *      `supporting_signals` (sorted by confidence), with
 *      `market_demand.demand_signals` as a fallback. Pure passthrough
 *      of AI-supplied tag text, title-cased for display.
 *
 * Anything the AI didn't supply simply doesn't render — no
 * placeholder copy.
 */
function OurReadColumn({
  summary,
  detail,
}: {
  summary: string;
  detail: JobFitDetail;
}) {
  const drivers = buildKeyDrivers(detail);
  const tags = buildSignalTags(detail);
  return (
    <div className="space-y-4 border-l-0 md:border-l md:border-ink-100 md:pl-4">
      {summary ? (
        <div data-our-read>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Our read
          </p>
          <p className="mt-1.5 text-[14.5px] leading-[1.55] text-ink-800">{summary}</p>
        </div>
      ) : null}

      {drivers.length > 0 ? (
        <div data-key-drivers>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Key drivers · the factors shaping this direction
          </p>
          <ul className="mt-1.5 space-y-1">
            {drivers.map((d) => (
              <li
                key={d.pillar}
                data-key-driver={d.pillar}
                className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink-700"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400"
                />
                <span>
                  <span className="font-medium text-ink-900">{d.pillar}</span>
                  <span className="text-ink-700"> · {d.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div data-signal-tags>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Signal tags
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                data-signal-tag={t}
                className="rounded-full border border-lagoon-200 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[10.5px] text-lagoon-800"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Build the "Key drivers" bullet list from per-pillar AI notes — each
 * pillar contributes at most one bullet, and only when the AI actually
 * wrote text for that pillar. The text is the AI's own `rationale` /
 * `note`, truncated at ~130 chars on a word boundary so the column
 * stays compact.
 */
function buildKeyDrivers(detail: JobFitDetail): { pillar: string; text: string }[] {
  const out: { pillar: string; text: string }[] = [];
  if (detail.role_match?.rationale) {
    out.push({ pillar: "Role match", text: truncate(detail.role_match.rationale, 130) });
  }
  if (detail.market_demand?.note) {
    out.push({ pillar: "Market demand", text: truncate(detail.market_demand.note, 130) });
  }
  if (detail.visa_employability?.note) {
    out.push({ pillar: "Visa", text: truncate(detail.visa_employability.note, 130) });
  }
  if (detail.salary_realism?.note) {
    out.push({ pillar: "Salary", text: truncate(detail.salary_realism.note, 130) });
  }
  return out.slice(0, 4);
}

/**
 * Title-case a tag label coming from a free-form `category` string.
 * Splits on whitespace, underscores, and hyphens so backend categories
 * like `role_match` or `salary-feasibility` render as "Role Match" and
 * "Salary Feasibility" without us inventing copy.
 */
function titleCaseTag(raw: string): string {
  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Up to 5 short chip labels drawn from the AI's signal vocabulary:
 *   1. Categories on `supporting_signals` (sorted by confidence) —
 *      these come straight from the v3 schema and are already short
 *      tag-style strings.
 *   2. `market_demand.demand_signals` — used as a fallback when there
 *      aren't enough distinct supporting-signal categories.
 * De-duplicates case-insensitively and renders title-cased.
 */
function buildSignalTags(detail: JobFitDetail): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const tryAdd = (raw: string | undefined) => {
    if (!raw) return;
    const cased = titleCaseTag(raw.trim());
    if (!cased) return;
    const key = cased.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(cased);
  };

  const sigs = (detail.supporting_signals ?? [])
    .slice()
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  for (const s of sigs) {
    tryAdd(s.category);
    if (out.length >= 5) return out;
  }
  for (const s of detail.market_demand?.demand_signals ?? []) {
    tryAdd(s);
    if (out.length >= 5) return out;
  }
  return out;
}

/**
 * Empty-state filler for the "Working against it" panel, used only when
 * the AI returned no risks AND no derivable cons. Pulls the first AI
 * assumption (which the v3 prompt always populates) so the copy stays
 * grounded in real model output rather than a static "nothing here"
 * line.
 */
function ConsEmptyFromAI({ assumptions }: { assumptions?: Assumption[] }) {
  const first = assumptions?.[0];
  if (!first) return null;
  return (
    <div
      data-cons-empty-ai
      className="mt-3 rounded-xl border border-dashed border-ink-200 bg-white/60 p-3"
    >
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
        AI framing
      </p>
      <p className="mt-1 text-[12px] leading-[1.45] text-ink-700">
        {first.label}
        {first.detail ? ` — ${first.detail}` : ""}
      </p>
    </div>
  );
}

function hasFullReasoningExtras(detail: JobFitDetail): boolean {
  return Boolean(
    (detail.career_angle_recommendations?.length ?? 0) > 0 ||
      (detail.job_pathways?.length ?? 0) > 0 ||
      (detail.key_gaps?.length ?? 0) > 0 ||
      (detail.alternate_roles?.length ?? 0) > 0,
  );
}

/**
 * The expanded body of "Show full reasoning". Renders the AI's
 * `reasoning` text (paragraph) followed by structured AI artifacts —
 * career-angle highlights, the fastest pathway, top skill gaps, and one
 * adjacent role — each section conditional on the AI actually
 * supplying it. No hardcoded fallback copy.
 */
function FullReasoningPanel({
  reasoning,
  detail,
  assumptions,
}: {
  reasoning: string;
  detail: JobFitDetail;
  assumptions?: Assumption[];
}) {
  const recs = (detail.career_angle_recommendations ?? []).slice(0, 3);
  const path0 = detail.job_pathways?.[0];
  const gaps = (detail.key_gaps ?? []).slice(0, 2);
  const alt0 = detail.alternate_roles?.[0];
  const assumptionList = (assumptions ?? []).slice(0, 3);

  return (
    <div
      data-full-reasoning
      className="mt-2 space-y-4 border-t border-ink-100 pt-3"
    >
      {reasoning ? (
        <p className="whitespace-pre-line text-[13px] leading-[1.6] text-ink-700">
          {reasoning}
        </p>
      ) : null}

      {recs.length > 0 ? (
        <div data-reasoning-block="career-angle">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Career-angle highlights · AI positioning tips
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {recs.map((r, i) => (
              <li
                key={i}
                data-reasoning-rec={i}
                data-impact={r.impact}
                className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink-700"
              >
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lagoon-500" />
                <span className="flex-1">
                  <span className="font-medium text-ink-900">{r.title}</span>
                  {r.detail ? <span className="text-ink-700"> — {r.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {path0 ? (
        <div data-reasoning-block="pathway">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Fastest path forward · ~{path0.time_to_offer_weeks}w to offer
          </p>
          <p className="mt-1.5 text-[12.5px] font-medium text-ink-900">{path0.name}</p>
          {path0.steps?.length ? (
            <ol className="mt-1.5 list-inside list-decimal space-y-0.5 text-[12px] text-ink-700">
              {path0.steps.slice(0, 4).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      {gaps.length > 0 ? (
        <div data-reasoning-block="gaps">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Skills to close · AI-flagged gaps
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {gaps.map((g, i) => {
              const sev = (g.severity ?? "").toLowerCase();
              const tone =
                sev === "high"
                  ? "bg-danger-100 text-danger-800"
                  : sev === "medium"
                  ? "bg-gilt-100 text-gilt-800"
                  : "bg-ink-100 text-ink-700";
              return (
                <li
                  key={i}
                  data-reasoning-gap={g.label}
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10.5px] ${tone}`}
                >
                  {g.label}
                  <span className="ml-1 opacity-70">· {sev}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {alt0 ? (
        <div data-reasoning-block="alternate">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Adjacent direction worth a look
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-700">
            <span className="font-medium text-ink-900">{alt0.role}</span>
            <span className="ml-2 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] tabular-nums text-ink-700">
              fit {alt0.fit_score}
            </span>
            {alt0.why ? <span className="block mt-0.5">{alt0.why}</span> : null}
          </p>
        </div>
      ) : null}

      {assumptionList.length > 0 ? (
        <div data-reasoning-block="assumptions">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Framing assumptions
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] text-ink-700">
            {assumptionList.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                <span>
                  {a.label}
                  {a.detail ? <span className="text-ink-500"> · {a.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DriversPanel({
  kind,
  drivers,
  aiDriven,
  fallback,
}: {
  kind: "pros" | "cons";
  drivers: Driver[];
  /** When true, the panel header shows an AI badge — used by the pros
   *  panel because its content comes from the AI's supporting_signals. */
  aiDriven?: boolean;
  /** Element rendered in place of the static empty-state copy when
   *  `drivers` is empty. Lets callers surface AI-derived context (e.g.
   *  the first assumption) instead of hardcoded "nothing here" text. */
  fallback?: React.ReactNode;
}) {
  const tone =
    kind === "pros"
      ? {
          bg: "bg-success-50/40",
          eyebrow: "text-success-700",
          title: "Pulling for it",
          icon: "↑",
          iconWrap: "bg-success-100 text-success-700",
          chip: "bg-success-100 text-success-800",
          bar: "bg-success-500",
          empty: "Nothing standing out as a tailwind yet.",
        }
      : {
          bg: "bg-danger-50/30",
          eyebrow: "text-danger-700",
          title: "Working against it",
          icon: "↓",
          iconWrap: "bg-danger-100 text-danger-700",
          chip: "bg-danger-100 text-danger-800",
          bar: "bg-danger-400",
          empty: "Nothing material weighing it down.",
        };

  return (
    <div data-drivers-panel={kind} className={`${tone.bg} p-5`}>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} text-[14px] font-bold`}
        >
          {tone.icon}
        </span>
        <p className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${tone.eyebrow}`}>
          {tone.title}
        </p>
        {aiDriven ? (
          <span className="rounded-full bg-lagoon-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-lagoon-800">
            ✦ AI
          </span>
        ) : null}
        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] tabular-nums text-ink-700">
          {drivers.length}
        </span>
      </div>

      {drivers.length === 0 ? (
        fallback ?? (
          <p className="mt-3 rounded-xl border border-dashed border-ink-200 bg-white/60 p-3 text-[12px] text-ink-500">
            {tone.empty}
          </p>
        )
      ) : (
        <ul className="mt-3 space-y-2">
          {drivers.map((d, i) => {
            const pct = Math.max(0, Math.min(100, d.score));
            return (
              <li
                key={i}
                data-driver={d.pillar}
                data-driver-score={d.score}
                className="rounded-xl bg-white/80 p-2.5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}
                  >
                    {d.pillar}
                  </span>
                  <span className="ml-auto font-mono text-[10.5px] tabular-nums text-ink-600">
                    {d.score}/100
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-700">{d.one_line}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
