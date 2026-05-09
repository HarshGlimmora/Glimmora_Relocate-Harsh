/**
 * Visa direction · visual cards.
 *
 * The legacy visa page was lists-of-text with a single dark hero. This
 * file replaces every list with a chart / meter / donut / bar so the
 * page reads as a glanceable dashboard instead of a paragraph wall.
 *
 * Hard rule: every value rendered here is sourced from the AI's
 * `VisaDirectionDetail`. No fixed copy, no synthetic numbers.
 */

import * as React from "react";
import type {
  VisaAlternativeRoute,
  VisaBlocker,
  VisaDependency,
  VisaDependencyStatus,
  VisaDifficulty,
  VisaPrimaryRoute,
  VisaRouteRequirement,
  VisaUserMeets,
} from "@/lib/backend/types";

// ---- Section label ---------------------------------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Tone palettes (shared across all visa visuals) ------------------

const DIFFICULTY_TONE: Record<
  VisaDifficulty,
  { bar: string; chip: string; ring: string; verdict: string; level: number }
> = {
  low: { bar: "bg-success-500", chip: "bg-success-100 text-success-800", ring: "stroke-success-500", verdict: "Straightforward", level: 1 },
  medium: { bar: "bg-gilt-500", chip: "bg-gilt-100 text-gilt-800", ring: "stroke-gilt-500", verdict: "Workable", level: 2 },
  high: { bar: "bg-danger-400", chip: "bg-danger-100 text-danger-800", ring: "stroke-danger-400", verdict: "Stretch", level: 3 },
  very_high: { bar: "bg-danger-600", chip: "bg-danger-200 text-danger-900", ring: "stroke-danger-600", verdict: "Very high lift", level: 4 },
};

const MEETS_TONE: Record<
  VisaUserMeets,
  { dot: string; chip: string; bg: string; border: string; label: string }
> = {
  yes: { dot: "bg-success-500", chip: "bg-success-100 text-success-800", bg: "bg-success-50/60", border: "border-success-200", label: "Met" },
  partial: { dot: "bg-gilt-500", chip: "bg-gilt-100 text-gilt-800", bg: "bg-gilt-50/60", border: "border-gilt-200", label: "Partial" },
  no: { dot: "bg-danger-500", chip: "bg-danger-100 text-danger-800", bg: "bg-danger-50/60", border: "border-danger-200", label: "Not met" },
  unknown: { dot: "bg-ink-300", chip: "bg-ink-100 text-ink-700", bg: "bg-white", border: "border-ink-200", label: "Unknown" },
};

const STATUS_TONE: Record<
  VisaDependencyStatus,
  { bg: string; chip: string; label: string }
> = {
  have: { bg: "bg-success-500", chip: "bg-success-100 text-success-800", label: "Have" },
  in_progress: { bg: "bg-lagoon-500", chip: "bg-lagoon-100 text-lagoon-800", label: "In progress" },
  need: { bg: "bg-danger-500", chip: "bg-danger-100 text-danger-800", label: "Need" },
  unknown: { bg: "bg-ink-300", chip: "bg-ink-100 text-ink-700", label: "Unknown" },
};

const SEVERITY_TONE: Record<
  "low" | "medium" | "high",
  { bar: string; chip: string; label: string; weight: number }
> = {
  low: { bar: "bg-success-500", chip: "bg-success-100 text-success-800", label: "Low", weight: 30 },
  medium: { bar: "bg-gilt-500", chip: "bg-gilt-100 text-gilt-800", label: "Medium", weight: 60 },
  high: { bar: "bg-danger-500", chip: "bg-danger-100 text-danger-800", label: "High", weight: 95 },
};

// ---- Hero · the AI's visa verdict at a glance ------------------------

export function VisaHeroCard({ route }: { route: VisaPrimaryRoute }) {
  const tone = DIFFICULTY_TONE[route.difficulty];
  const minWeeks = route.typical_processing_weeks_min;
  const maxWeeks = route.typical_processing_weeks_max;
  const meetsCount = countByMeets(route.requirements);
  const totalReqs = route.requirements.length || 1;
  const readyRatio =
    (meetsCount.yes + 0.5 * meetsCount.partial) / totalReqs;
  const readyPct = Math.round(readyRatio * 100);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - readyRatio * circumference;

  return (
    <section
      data-visa-hero
      data-difficulty={route.difficulty}
      className="overflow-hidden rounded-2xl border-2 border-ink-900 bg-ink-900 text-parchment"
    >
      <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr] md:p-6">
        {/* Readiness ring · AI-derived from requirement match */}
        <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
          <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
            <circle cx="48" cy="48" r={radius} className="fill-none stroke-white/15" strokeWidth="9" />
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
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300">
              Readiness
            </p>
            <p
              data-readiness-pct={readyPct}
              className="mt-0.5 font-sans text-[30px] font-semibold leading-none"
            >
              {readyPct}
              <span className="ml-1 text-[12px] text-white/60">%</span>
            </p>
            <p className="mt-1 text-[11px] text-white/70">
              {meetsCount.yes}/{totalReqs} requirements met
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-300">
            Primary route
          </p>
          <h2 className="mt-1 font-sans text-[24px] font-semibold tracking-tight">
            {route.name}
            {route.code ? (
              <span className="ml-2 font-mono text-[12px] text-white/55">
                {route.code}
              </span>
            ) : null}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <DifficultyBadge difficulty={route.difficulty} dark />
            <ProcessingBadge minWeeks={minWeeks} maxWeeks={maxWeeks} />
            <SponsorBadge required={route.sponsor_required} />
            <FamilyBadge friendly={route.family_friendly} />
          </div>
          <p className="mt-4 max-w-prose text-[13px] leading-[1.55] text-white/85">
            {route.rationale}
          </p>
        </div>
      </div>

      {/* Difficulty bar — visual scale 1→4, AI sets the level */}
      <DifficultyBar difficulty={route.difficulty} />
    </section>
  );
}

function DifficultyBar({ difficulty }: { difficulty: VisaDifficulty }) {
  const tone = DIFFICULTY_TONE[difficulty];
  const segs: VisaDifficulty[] = ["low", "medium", "high", "very_high"];
  return (
    <div data-difficulty-bar className="grid grid-cols-4 gap-px bg-white/10">
      {segs.map((d) => {
        const active = DIFFICULTY_TONE[d].level <= tone.level;
        return (
          <div
            key={d}
            data-difficulty-seg={d}
            data-active={active ? "true" : "false"}
            className={
              "px-3 py-1.5 text-center font-mono text-[9.5px] uppercase tracking-[0.22em] " +
              (active
                ? d === "low"
                  ? "bg-success-500/80 text-white"
                  : d === "medium"
                  ? "bg-gilt-500/80 text-white"
                  : d === "high"
                  ? "bg-danger-400/80 text-white"
                  : "bg-danger-600/80 text-white"
                : "bg-white/5 text-white/40")
            }
          >
            {d.replace("_", " ")}
          </div>
        );
      })}
    </div>
  );
}

function DifficultyBadge({ difficulty, dark }: { difficulty: VisaDifficulty; dark?: boolean }) {
  const tone = DIFFICULTY_TONE[difficulty];
  return (
    <span
      data-badge="difficulty"
      data-difficulty={difficulty}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
        (dark ? "bg-white/10 text-white" : tone.chip)
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.bar}`} aria-hidden="true" />
      Difficulty · {tone.verdict}
    </span>
  );
}

function ProcessingBadge({ minWeeks, maxWeeks }: { minWeeks: number; maxWeeks: number }) {
  return (
    <span
      data-badge="processing"
      data-min={minWeeks}
      data-max={maxWeeks}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white"
    >
      <span aria-hidden="true">⌛</span>
      {minWeeks}–{maxWeeks} wks
    </span>
  );
}

function SponsorBadge({ required }: { required: boolean }) {
  return (
    <span
      data-badge="sponsor"
      data-sponsor-required={required ? "true" : "false"}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
        (required
          ? "bg-gilt-500/30 text-gilt-100"
          : "bg-success-500/25 text-success-100")
      }
    >
      <span aria-hidden="true">{required ? "🔗" : "○"}</span>
      Sponsor {required ? "required" : "optional"}
    </span>
  );
}

function FamilyBadge({ friendly }: { friendly: boolean }) {
  return (
    <span
      data-badge="family"
      data-family-friendly={friendly ? "true" : "false"}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
        (friendly
          ? "bg-success-500/25 text-success-100"
          : "bg-white/10 text-white/70")
      }
    >
      <span aria-hidden="true">{friendly ? "♥" : "·"}</span>
      Family {friendly ? "friendly" : "limited"}
    </span>
  );
}

// ---- Processing-time gauge --------------------------------------------

export function ProcessingGauge({
  minWeeks,
  maxWeeks,
  label,
}: {
  minWeeks: number;
  maxWeeks: number;
  label: string;
}) {
  // Map weeks onto a 0–52w scale (1 year). Routes longer than that get
  // clamped at the right edge with the actual numeric still surfaced.
  const SCALE_MAX = 52;
  const left = Math.min(100, (minWeeks / SCALE_MAX) * 100);
  const right = Math.min(100, (maxWeeks / SCALE_MAX) * 100);
  const width = Math.max(2, right - left);
  return (
    <section
      data-processing-gauge
      data-min={minWeeks}
      data-max={maxWeeks}
      className="rounded-2xl border border-ink-200 bg-white p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Processing window
        </p>
        <span className="font-mono text-[11px] tabular-nums text-ink-800">
          {label}
        </span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-ink-100">
        <div
          className="absolute inset-y-0 rounded-full bg-lagoon-500"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        <div
          className="absolute -top-1 h-5 w-px bg-ink-900"
          style={{ left: `${left}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-1 h-5 w-px bg-ink-900"
          style={{ left: `${right}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9.5px] text-ink-500">
        <span>0w</span>
        <span>3m</span>
        <span>6m</span>
        <span>9m</span>
        <span>12m+</span>
      </div>
    </section>
  );
}

// ---- Requirement-match donut + breakdown -----------------------------

export function RequirementMatchPanel({
  requirements,
}: {
  requirements: VisaRouteRequirement[];
}) {
  const counts = countByMeets(requirements);
  const total = requirements.length;
  return (
    <section
      data-requirement-match
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <RequirementDonut counts={counts} total={total} />
        <ul data-requirements-list className="space-y-2">
          {requirements.map((r, i) => (
            <RequirementRow key={i} req={r} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function RequirementDonut({
  counts,
  total,
}: {
  counts: Record<VisaUserMeets, number>;
  total: number;
}) {
  // Build a stacked donut from the AI's user_meets buckets.
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const order: VisaUserMeets[] = ["yes", "partial", "no", "unknown"];
  let acc = 0;
  const segments = order.map((k) => {
    const fraction = total === 0 ? 0 : counts[k] / total;
    const length = fraction * circumference;
    const dashoffset = -acc;
    acc += length;
    return {
      key: k,
      length,
      dashoffset,
      strokeClass:
        k === "yes"
          ? "stroke-success-500"
          : k === "partial"
          ? "stroke-gilt-500"
          : k === "no"
          ? "stroke-danger-500"
          : "stroke-ink-300",
      count: counts[k],
    };
  });

  const fitPct = total === 0
    ? 0
    : Math.round(((counts.yes + 0.5 * counts.partial) / total) * 100);

  return (
    <div className="flex items-center gap-4 md:flex-col md:items-start">
      <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="48" cy="48" r={radius} className="fill-none stroke-ink-100" strokeWidth="11" />
        {segments.map((s) =>
          s.length > 0 ? (
            <circle
              key={s.key}
              cx="48"
              cy="48"
              r={radius}
              className={`fill-none ${s.strokeClass}`}
              strokeWidth="11"
              strokeLinecap="butt"
              strokeDasharray={`${s.length} ${circumference}`}
              strokeDashoffset={s.dashoffset}
            />
          ) : null,
        )}
      </svg>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Requirement fit
        </p>
        <p className="mt-0.5 font-sans text-[24px] font-semibold leading-none text-ink-900">
          {fitPct}
          <span className="ml-1 text-[12px] text-ink-400">%</span>
        </p>
        <ul className="mt-2 space-y-0.5 text-[11.5px]">
          {(["yes", "partial", "no", "unknown"] as VisaUserMeets[]).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${MEETS_TONE[k].dot}`}
              />
              <span className="text-ink-700">{MEETS_TONE[k].label}</span>
              <span className="ml-auto font-mono tabular-nums text-ink-600">
                {counts[k]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RequirementRow({ req, index }: { req: VisaRouteRequirement; index: number }) {
  const tone = MEETS_TONE[req.user_meets] ?? MEETS_TONE.unknown;
  return (
    <li
      data-requirement={index}
      data-meets={req.user_meets}
      className={`rounded-xl border ${tone.border} ${tone.bg} p-3`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[12.5px] font-medium text-ink-900">{req.label}</p>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}
            >
              {tone.label}
            </span>
          </div>
          {req.detail ? (
            <p className="mt-1 text-[11.5px] leading-[1.45] text-ink-700">
              {req.detail}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

// ---- Blockers panel · severity bars + fixable badges -----------------

export function BlockersPanel({ blockers }: { blockers: VisaBlocker[] }) {
  if (!blockers?.length) return null;
  const sorted = [...blockers].sort(
    (a, b) => SEVERITY_TONE[b.severity].weight - SEVERITY_TONE[a.severity].weight,
  );
  return (
    <section data-blockers>
      <SectionLabel>Blockers · severity at a glance</SectionLabel>
      <ul className="grid gap-2 md:grid-cols-2">
        {sorted.map((b, i) => {
          const tone = SEVERITY_TONE[b.severity];
          return (
            <li
              key={i}
              data-blocker={i}
              data-severity={b.severity}
              data-fixable={b.fixable ? "true" : "false"}
              className="rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink-900">{b.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}
                >
                  {tone.label}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={`h-full ${tone.bar}`}
                  style={{ width: `${tone.weight}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] leading-[1.5] text-ink-700">{b.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {b.fixable ? (
                  <span className="rounded-full bg-success-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-700">
                    ✓ Fixable
                  </span>
                ) : (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-danger-700">
                    Hard blocker
                  </span>
                )}
                {typeof b.fixable_in_weeks === "number" ? (
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700">
                    ~{b.fixable_in_weeks}w to clear
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- Dependencies · single stacked bar + per-row chips ---------------

export function DependenciesPanel({ deps }: { deps: VisaDependency[] }) {
  if (!deps?.length) return null;
  const total = deps.length;
  const counts: Record<VisaDependencyStatus, number> = {
    have: 0,
    in_progress: 0,
    need: 0,
    unknown: 0,
  };
  for (const d of deps) counts[d.status] = (counts[d.status] ?? 0) + 1;

  const order: VisaDependencyStatus[] = ["have", "in_progress", "need", "unknown"];

  return (
    <section data-dependencies>
      <SectionLabel>Dependencies · how the documentation chain stacks up</SectionLabel>
      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* Stacked horizontal bar */}
        <div data-deps-bar className="flex h-3 overflow-hidden rounded-full bg-ink-100">
          {order.map((s) => {
            const w = total === 0 ? 0 : (counts[s] / total) * 100;
            if (w === 0) return null;
            return (
              <div
                key={s}
                data-deps-bar-seg={s}
                style={{ width: `${w}%` }}
                className={STATUS_TONE[s].bg}
                title={`${STATUS_TONE[s].label} · ${counts[s]}`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-ink-700">
          {order.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`h-1.5 w-3 rounded-full ${STATUS_TONE[s].bg}`}
              />
              <span className="text-ink-700">{STATUS_TONE[s].label}</span>
              <span className="text-ink-500">· {counts[s]}</span>
            </span>
          ))}
        </div>

        <ul className="mt-4 space-y-1.5">
          {deps.map((d, i) => {
            const tone = STATUS_TONE[d.status] ?? STATUS_TONE.unknown;
            return (
              <li
                key={i}
                data-dependency={i}
                data-status={d.status}
                className="flex items-start gap-2 rounded-xl bg-ink-50/60 p-2.5"
              >
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}
                >
                  {tone.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-ink-900">
                    <span className="font-medium">{d.requirement}</span>
                    <span className="text-ink-500"> ← depends on {d.depends_on}</span>
                  </p>
                  {d.note ? (
                    <p className="mt-0.5 text-[11.5px] text-ink-700">{d.note}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ---- Alternative routes · bar comparison ------------------------------

export function AlternativeRoutesPanel({
  alternatives,
}: {
  alternatives: VisaAlternativeRoute[];
}) {
  if (!alternatives?.length) return null;
  return (
    <section data-alternative-routes>
      <SectionLabel>Alternative routes · ranked by difficulty</SectionLabel>
      <ul className="grid gap-2 md:grid-cols-2">
        {alternatives.map((a, i) => {
          const tone = DIFFICULTY_TONE[a.difficulty];
          return (
            <li
              key={i}
              data-alt-route={i}
              data-difficulty={a.difficulty}
              className="rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13.5px] font-semibold text-ink-900">{a.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}
                >
                  {tone.verdict}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-px overflow-hidden rounded-full bg-ink-100">
                {(["low", "medium", "high", "very_high"] as VisaDifficulty[]).map(
                  (d) => {
                    const active = DIFFICULTY_TONE[d].level <= tone.level;
                    return (
                      <div
                        key={d}
                        data-alt-difficulty-seg={d}
                        data-active={active ? "true" : "false"}
                        className={`h-1.5 ${active ? tone.bar : "bg-transparent"}`}
                      />
                    );
                  },
                )}
              </div>
              <p className="mt-2 text-[12px] leading-[1.5] text-ink-700">{a.why_consider}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- Helpers ---------------------------------------------------------

function countByMeets(
  reqs: VisaRouteRequirement[],
): Record<VisaUserMeets, number> {
  const counts: Record<VisaUserMeets, number> = {
    yes: 0,
    partial: 0,
    no: 0,
    unknown: 0,
  };
  for (const r of reqs) {
    counts[r.user_meets] = (counts[r.user_meets] ?? 0) + 1;
  }
  return counts;
}
