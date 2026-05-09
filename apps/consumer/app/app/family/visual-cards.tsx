/**
 * Visual cards for the Family page.
 *
 * Introduces a few visuals we haven't used on other pages:
 *   • Pictograph household roster (avatar tiles per member)
 *   • Horizontal complexity scale with named checkpoints (instead of
 *     yet another circular ring)
 *   • Children placed on a horizontal age axis colour-coded by
 *     recommended schooling band
 *   • Suggestions as a priority kanban board (Now · 30d · 90d · later)
 */

import * as React from "react";
import {
  User,
  Users,
  Baby,
  GraduationCap,
  HeartPulse,
  Home,
  AlertTriangle,
} from "lucide-react";
import type { FamilyImpactDetail } from "@/lib/backend/types";

// ---- Section eyebrow label -------------------------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Household snapshot · pictograph of who's moving -----------------

export function HouseholdSnapshotCard({
  detail,
}: {
  detail: FamilyImpactDetail;
}) {
  const isSolo = detail.mode === "solo";
  const hasSpouse = !!detail.spouse_outlook;
  const children = detail.child_outlooks ?? [];
  const hasParents = !!detail.parents_outlook;
  const totalPeople = 1 + (hasSpouse ? 1 : 0) + children.length + (hasParents ? 2 : 0);

  return (
    <section
      data-household-snapshot
      className="overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-parchment to-white p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Household roster · {isSolo ? "moving alone" : `${totalPeople} on the move`}
        </p>
        <span
          className={
            "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
            (isSolo ? "bg-lagoon-100 text-lagoon-800" : "bg-gilt-100 text-gilt-800")
          }
        >
          {isSolo ? "Solo move" : "Household move"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PersonaTile icon={<User className="h-5 w-5" />} label="You" tone="ink" />

        {hasSpouse ? (
          <PersonaTile
            icon={<Users className="h-5 w-5" />}
            label="Spouse"
            tone="lagoon"
          />
        ) : null}

        {children.map((c, i) => (
          <PersonaTile
            key={i}
            icon={<Baby className="h-5 w-5" />}
            label={`Child · ${c.age}`}
            tone={c.age <= 5 ? "gilt" : c.age <= 11 ? "success" : "lagoon"}
          />
        ))}

        {hasParents ? (
          <>
            <PersonaTile icon={<HeartPulse className="h-5 w-5" />} label="Parents" tone="danger" />
          </>
        ) : null}
      </div>

      {detail.headline_finding ? (
        <p className="mt-4 rounded-xl border border-ink-100 bg-white/60 p-3 text-[12.5px] leading-[1.5] text-ink-700">
          ✦ {detail.headline_finding}
        </p>
      ) : null}
    </section>
  );
}

const PERSONA_TONE: Record<string, { wrap: string; ring: string; iconColor: string }> = {
  ink: { wrap: "bg-ink-900 text-parchment", ring: "ring-ink-200", iconColor: "" },
  lagoon: { wrap: "bg-lagoon-100 text-lagoon-800", ring: "ring-lagoon-200", iconColor: "" },
  gilt: { wrap: "bg-gilt-100 text-gilt-800", ring: "ring-gilt-200", iconColor: "" },
  success: { wrap: "bg-success-100 text-success-800", ring: "ring-success-200", iconColor: "" },
  danger: { wrap: "bg-danger-100 text-danger-800", ring: "ring-danger-200", iconColor: "" },
};

function PersonaTile({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: keyof typeof PERSONA_TONE;
}) {
  const p = PERSONA_TONE[tone];
  return (
    <div
      data-persona-tile={label}
      className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2 transition-shadow hover:shadow-sm"
    >
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.wrap} ring-2 ${p.ring}`}
      >
        {icon}
      </span>
      <p className="text-[12.5px] font-medium text-ink-900">{label}</p>
    </div>
  );
}

// ---- Complexity scale · horizontal checkpoints ---------------------

const COMPLEXITY_CHECKPOINTS = [
  { at: 0, label: "Solo" },
  { at: 25, label: "Couple" },
  { at: 50, label: "With kids" },
  { at: 75, label: "Multi-gen" },
  { at: 100, label: "Complex" },
];

export function ComplexityScale({
  complexity,
  familyFit,
}: {
  complexity: number;
  familyFit: number;
}) {
  const c = Math.max(0, Math.min(100, complexity));
  const f = Math.max(0, Math.min(100, familyFit));

  const fitTone =
    f >= 70
      ? { text: "text-success-700", chip: "bg-success-100 text-success-800", verdict: "Smooth landing" }
      : f >= 50
      ? { text: "text-gilt-700", chip: "bg-gilt-100 text-gilt-800", verdict: "Workable, with prep" }
      : { text: "text-danger-700", chip: "bg-danger-100 text-danger-800", verdict: "Heavy lift" };

  return (
    <section
      data-complexity-scale
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
            Household complexity scale
          </p>
          <p className="mt-1 text-[12px] text-ink-600">
            Where this move sits on the difficulty curve, from a single person to a multi-generation household.
          </p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${fitTone.text}`}>
            Family-fit
          </p>
          <p className={`font-sans text-[24px] font-semibold leading-none ${fitTone.text}`}>
            {f}
            <span className="text-[12px] text-ink-400">/100</span>
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${fitTone.chip}`}
          >
            {fitTone.verdict}
          </span>
        </div>
      </div>

      {/* The horizontal scale itself */}
      <div className="relative mt-6 mb-2 h-3 rounded-full bg-gradient-to-r from-success-200 via-gilt-200 to-danger-200">
        {/* Marker */}
        <span
          aria-hidden="true"
          data-complexity-marker={c}
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform"
          style={{ left: `${c}%` }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-[10px] font-mono font-semibold tabular-nums text-parchment shadow-md">
            {c}
          </span>
        </span>
        {/* Checkpoints */}
        {COMPLEXITY_CHECKPOINTS.map((cp) => (
          <span
            key={cp.at}
            aria-hidden="true"
            className="absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white/80"
            style={{ left: `${cp.at}%` }}
          />
        ))}
      </div>
      {/* Labels */}
      <div className="relative h-4">
        {COMPLEXITY_CHECKPOINTS.map((cp) => (
          <span
            key={cp.at}
            data-checkpoint={cp.label}
            className="absolute -translate-x-1/2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500"
            style={{ left: `${cp.at}%` }}
          >
            {cp.label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ---- Children age timeline -----------------------------------------

const AGE_BANDS = [
  { from: 0, to: 2, label: "Toddler", tone: "bg-gilt-200 text-gilt-900", chip: "bg-gilt-100 text-gilt-800" },
  { from: 3, to: 5, label: "Preschool", tone: "bg-gilt-300 text-gilt-900", chip: "bg-gilt-100 text-gilt-800" },
  { from: 6, to: 11, label: "Primary", tone: "bg-success-300 text-success-900", chip: "bg-success-100 text-success-800" },
  { from: 12, to: 14, label: "Middle", tone: "bg-lagoon-300 text-lagoon-900", chip: "bg-lagoon-100 text-lagoon-800" },
  { from: 15, to: 18, label: "Secondary", tone: "bg-lagoon-400 text-white", chip: "bg-lagoon-100 text-lagoon-800" },
];

function bandFor(age: number) {
  return (
    AGE_BANDS.find((b) => age >= b.from && age <= b.to) ??
    AGE_BANDS[AGE_BANDS.length - 1]
  );
}

export function ChildrenTimelineCard({
  outlooks,
}: {
  outlooks: NonNullable<FamilyImpactDetail["child_outlooks"]>;
}) {
  if (!outlooks?.length) return null;
  const maxAge = Math.max(18, ...outlooks.map((c) => c.age));
  return (
    <section data-children-timeline>
      <SectionLabel>Children · placed on the schooling spectrum</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {/* Age axis */}
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink-200" />
          {/* Band markers */}
          {AGE_BANDS.map((b) => (
            <span
              key={b.label}
              className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${b.tone.split(" ")[0]}`}
              style={{
                left: `${(b.from / maxAge) * 100}%`,
                width: `${((b.to - b.from + 1) / maxAge) * 100}%`,
              }}
              aria-hidden="true"
              title={`${b.label} (${b.from}–${b.to})`}
            />
          ))}
          {/* Child markers */}
          {outlooks.map((c, i) => (
            <span
              key={i}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(c.age / maxAge) * 100}%` }}
              aria-hidden="true"
              data-child-marker={c.age}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900 font-mono text-[9.5px] font-semibold text-parchment shadow-sm">
                {c.age}
              </span>
            </span>
          ))}
        </div>

        {/* Tick labels */}
        <div className="relative mt-1 h-3">
          {[0, 5, 10, 15, maxAge].map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 font-mono text-[9px] tabular-nums text-ink-400"
              style={{ left: `${(t / maxAge) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Per-child cards */}
        <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
          {outlooks.map((c, i) => {
            const band = bandFor(c.age);
            return (
              <li
                key={i}
                data-child-outlook={c.age}
                className="rounded-2xl border border-ink-200 p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700"
                  >
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <p className="text-[13px] font-semibold text-ink-900">
                    Age {c.age}
                  </p>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${band.chip}`}
                  >
                    {band.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] font-medium text-ink-800">
                  {c.schooling_recommendation}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-600">
                  {c.adaptation_note}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ---- Spouse / Parents outlook persona cards ------------------------

export function SpouseOutlookCard({
  outlook,
}: {
  outlook: NonNullable<FamilyImpactDetail["spouse_outlook"]>;
}) {
  return (
    <section
      data-spouse-outlook
      className="overflow-hidden rounded-2xl border border-lagoon-200 bg-lagoon-50/40 p-5"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700"
        >
          <Users className="h-4 w-4" />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
          Spouse outlook
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <BadgePair label="Work authorisation" value={outlook.work_authorisation} />
        <BadgePair label="Career continuity" value={outlook.career_continuity} />
      </div>
      <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-700">{outlook.note}</p>
    </section>
  );
}

export function ParentsOutlookCard({
  outlook,
}: {
  outlook: NonNullable<FamilyImpactDetail["parents_outlook"]>;
}) {
  return (
    <section
      data-parents-outlook
      className="overflow-hidden rounded-2xl border border-danger-200 bg-danger-50/40 p-5"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-700"
        >
          <HeartPulse className="h-4 w-4" />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-danger-800">
          Parents outlook
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <BadgePair label="Healthcare sensitivity" value={outlook.healthcare_sensitivity} />
        <BadgePair label="Visa path" value={outlook.visa_path} />
      </div>
      <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-700">{outlook.note}</p>
    </section>
  );
}

function BadgePair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 p-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-medium text-ink-900">{value}</p>
    </div>
  );
}

// ---- Housing fit indicator ------------------------------------------

const HOUSING_TONE: Record<
  string,
  { fillPct: number; bg: string; bar: string; label: string; chip: string }
> = {
  excellent: { fillPct: 95, bg: "bg-success-50", bar: "bg-success-500", label: "Excellent fit", chip: "bg-success-100 text-success-800" },
  good: { fillPct: 80, bg: "bg-success-50/40", bar: "bg-success-500", label: "Good fit", chip: "bg-success-100 text-success-800" },
  okay: { fillPct: 60, bg: "bg-gilt-50", bar: "bg-gilt-500", label: "Workable fit", chip: "bg-gilt-100 text-gilt-800" },
  workable: { fillPct: 60, bg: "bg-gilt-50", bar: "bg-gilt-500", label: "Workable fit", chip: "bg-gilt-100 text-gilt-800" },
  tight: { fillPct: 40, bg: "bg-gilt-50/60", bar: "bg-gilt-500", label: "Tight fit", chip: "bg-gilt-100 text-gilt-800" },
  poor: { fillPct: 20, bg: "bg-danger-50", bar: "bg-danger-500", label: "Poor fit", chip: "bg-danger-100 text-danger-800" },
  bad: { fillPct: 20, bg: "bg-danger-50", bar: "bg-danger-500", label: "Poor fit", chip: "bg-danger-100 text-danger-800" },
};

export function HousingFitCard({
  fit,
}: {
  fit: NonNullable<FamilyImpactDetail["housing_fit"]>;
}) {
  const rawFit = (fit.fit ?? "").toString();
  const fitNorm = rawFit.toLowerCase();
  const fallbackLabel = rawFit || "Unspecified";
  const tone =
    HOUSING_TONE[fitNorm] ??
    (fitNorm
      ? Object.entries(HOUSING_TONE).find(([k]) => fitNorm.includes(k))?.[1]
      : undefined) ??
    { fillPct: 60, bg: "bg-ink-50", bar: "bg-ink-400", label: fallbackLabel, chip: "bg-ink-100 text-ink-700" };
  const note = fit.note ?? "";

  return (
    <section data-housing-fit className={`rounded-2xl border border-ink-200 ${tone.bg} p-5`}>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-700 ring-2 ring-ink-100"
        >
          <Home className="h-4 w-4" />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
          Housing fit
        </p>
        <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
          {tone.label}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
        <div className={`h-full ${tone.bar}`} style={{ width: `${tone.fillPct}%` }} />
      </div>

      {note ? (
        <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-700">{note}</p>
      ) : null}
    </section>
  );
}

// ---- Family warnings · alert cards ----------------------------------

export function WarningsBoard({
  warnings,
}: {
  warnings: FamilyImpactDetail["family_warnings"];
}) {
  if (!warnings?.length) return null;
  return (
    <section data-family-warnings>
      <SectionLabel>Family warnings · what to plan around</SectionLabel>
      <ul className="grid gap-2 md:grid-cols-2">
        {warnings.map((w, i) => (
          <li
            key={i}
            data-warning={i}
            className="group flex items-start gap-3 rounded-2xl border border-gilt-200 bg-gilt-50/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gilt-100 text-gilt-700"
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-[13px] font-semibold text-ink-900">{w.label}</p>
                <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
                  affects · {w.affects}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-700">{w.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- Suggestions kanban-by-urgency -----------------------------------

const URGENCY_COLUMNS: { id: string; label: string; tone: { border: string; bg: string; eyebrow: string } }[] = [
  { id: "now", label: "Now", tone: { border: "border-danger-200", bg: "bg-danger-50/30", eyebrow: "text-danger-700" } },
  { id: "30d", label: "30 days", tone: { border: "border-gilt-200", bg: "bg-gilt-50/30", eyebrow: "text-gilt-700" } },
  { id: "90d", label: "90 days", tone: { border: "border-lagoon-200", bg: "bg-lagoon-50/30", eyebrow: "text-lagoon-700" } },
  { id: "later", label: "Later", tone: { border: "border-ink-200", bg: "bg-white", eyebrow: "text-ink-700" } },
];

function bucketFor(urgency: string | null | undefined): string {
  if (!urgency) return "later";
  const u = String(urgency).toLowerCase().trim();
  if (u.includes("now") || u === "high" || u === "urgent" || u === "asap") return "now";
  if (u.includes("30") || u === "medium" || u === "soon") return "30d";
  if (u.includes("90") || u.includes("3m")) return "90d";
  return "later";
}

export function SuggestionsBoard({
  suggestions,
}: {
  suggestions: FamilyImpactDetail["family_suggestions"];
}) {
  if (!suggestions?.length) return null;
  const grouped: Record<string, FamilyImpactDetail["family_suggestions"]> = {
    now: [],
    "30d": [],
    "90d": [],
    later: [],
  };
  for (const s of suggestions) grouped[bucketFor(s.urgency)].push(s);

  return (
    <section data-suggestions-board>
      <SectionLabel>Suggestions · grouped by urgency</SectionLabel>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {URGENCY_COLUMNS.map((col) => {
          const items = grouped[col.id];
          return (
            <div
              key={col.id}
              data-urgency-col={col.id}
              className={`rounded-2xl border ${col.tone.border} ${col.tone.bg} p-3`}
            >
              <div className="flex items-baseline justify-between">
                <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${col.tone.eyebrow}`}>
                  {col.label}
                </p>
                <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-ink-700">
                  {items.length}
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {items.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-ink-200 bg-white/50 p-2 text-[11px] text-ink-500">
                    Nothing in this bucket
                  </li>
                ) : (
                  items.map((s, i) => (
                    <li
                      key={i}
                      data-suggestion={i}
                      className="rounded-xl bg-white/90 p-2.5 transition-shadow hover:shadow-sm"
                    >
                      <p className="text-[12.5px] font-semibold text-ink-900">{s.label}</p>
                      <p className="mt-1 text-[11.5px] leading-[1.45] text-ink-700">
                        {s.detail}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- Family insight card · summary + collapsible reasoning ---------

export function FamilyInsightCard({
  summary,
  reasoning,
  confidence,
}: {
  summary: string;
  reasoning: string;
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.75 ? "bg-success-500" : confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";
  return (
    <section data-family-insight>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>Why this read · for your household</SectionLabel>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${pct}%`}
        >
          <span className={`h-2 w-2 rounded-full ${tone}`} />
          conf {pct}%
        </span>
      </div>
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="text-[14px] leading-[1.6] text-ink-800">{summary}</p>
        {reasoning ? (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 hover:text-ink-900">
              <span className="group-open:hidden">Show full reasoning ↓</span>
              <span className="hidden group-open:inline">Hide reasoning ↑</span>
            </summary>
            <p className="mt-2 whitespace-pre-line border-t border-ink-100 pt-3 text-[13px] leading-[1.6] text-ink-700">
              {reasoning}
            </p>
          </details>
        ) : null}
      </div>
    </section>
  );
}
