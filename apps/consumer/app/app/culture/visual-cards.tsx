/**
 * Visual cards for the Culture page.
 *
 * Introduces visuals not used elsewhere on the workflow:
 *   • Workplace norms badges (chip pills with axis labels)
 *   • English usability speedometer (semicircular gauge instead of donut)
 *   • Language ladder (CEFR rungs A1 → C2, target rung highlighted)
 *   • First-week kanban (Must / Should / Nice columns with effort budgets)
 *   • Do · Don't dual scrollable cards
 *   • Daily life topic-grid with inferred icons
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import type { CultureDetail } from "@/lib/backend/types";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// CultureInsightCard moved → ./culture-insight-card.tsx (interactive view modes)
// WorkplaceNormsCard moved → ./workplace-norms-card.tsx (interactive accordion)

// ---- English usability speedometer (semicircular gauge) ------------

function EnglishUsabilityGauge({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  // Semicircle: arc from 180° to 0°. Use the path length to compute offset.
  const radius = 60;
  // Half-circle circumference
  const arcLen = Math.PI * radius;
  const offset = arcLen - (v / 100) * arcLen;
  const tone =
    v >= 75
      ? { stroke: "stroke-success-500", text: "text-success-700", verdict: "Comfortably workable in English" }
      : v >= 50
      ? { stroke: "stroke-gilt-500", text: "text-gilt-700", verdict: "Workable, but learn the local language" }
      : { stroke: "stroke-danger-500", text: "text-danger-700", verdict: "Local language strongly recommended" };

  return (
    <div data-english-usability-gauge className="text-center">
      <svg viewBox="0 0 160 96" className="mx-auto h-24 w-40" aria-hidden="true">
        {/* Background arc */}
        <path
          d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`}
          className="fill-none stroke-ink-100"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`}
          className={`fill-none ${tone.stroke}`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="-mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        English usability
      </p>
      <p className={`mt-0.5 font-sans text-[26px] font-semibold leading-none ${tone.text}`}>
        {v}
        <span className="text-[12px] text-ink-400">/100</span>
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.4] text-ink-600">{tone.verdict}</p>
    </div>
  );
}

// ---- Language ladder (CEFR rungs) ----------------------------------

const LADDER_RUNGS: { id: string; label: string; tone: string; chip: string }[] = [
  { id: "none", label: "None", tone: "bg-ink-100", chip: "bg-ink-100 text-ink-700" },
  { id: "A1", label: "A1 · Beginner", tone: "bg-danger-200", chip: "bg-danger-100 text-danger-800" },
  { id: "A2", label: "A2 · Elementary", tone: "bg-danger-300", chip: "bg-danger-100 text-danger-800" },
  { id: "B1", label: "B1 · Intermediate", tone: "bg-gilt-300", chip: "bg-gilt-100 text-gilt-800" },
  { id: "B2", label: "B2 · Upper-int.", tone: "bg-gilt-400", chip: "bg-gilt-100 text-gilt-800" },
  { id: "C1", label: "C1 · Advanced", tone: "bg-success-400", chip: "bg-success-100 text-success-800" },
  { id: "C2", label: "C2 · Proficient", tone: "bg-success-500", chip: "bg-success-100 text-success-800" },
];

function LanguageLadder({
  target,
}: {
  target: CultureDetail["language"]["proficiency_target"];
}) {
  const targetIdx = LADDER_RUNGS.findIndex((r) => r.id === target);
  return (
    <div data-language-ladder>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Target proficiency
      </p>
      <ol className="mt-2.5 space-y-1">
        {LADDER_RUNGS.slice(1) /* skip "none" rung in ladder */
          .map((rung, i) => {
            const idxFromBottom = i; // 0 = A1, 5 = C2
            const isTarget = LADDER_RUNGS.indexOf(rung) === targetIdx;
            const isReached = targetIdx >= 0 && LADDER_RUNGS.indexOf(rung) <= targetIdx;
            // Render bottom-to-top (C2 at top visually)
            const reverseIdx = LADDER_RUNGS.length - 2 - idxFromBottom;
            const r = LADDER_RUNGS.slice(1)[reverseIdx];
            const targetMatch = LADDER_RUNGS.indexOf(r) === targetIdx;
            const reachedMatch = targetIdx >= 0 && LADDER_RUNGS.indexOf(r) <= targetIdx;
            void isTarget;
            void isReached;
            return (
              <li
                key={r.id}
                data-rung={r.id}
                data-rung-target={targetMatch ? "true" : "false"}
                data-rung-reached={reachedMatch ? "true" : "false"}
                className={
                  "flex items-center gap-3 rounded-xl border px-3 py-2 transition-all " +
                  (targetMatch
                    ? "border-ink-900 bg-parchment/60 shadow-sm"
                    : reachedMatch
                    ? "border-ink-200 bg-white"
                    : "border-ink-100 bg-ink-50/60 opacity-70")
                }
              >
                <span className={`h-2.5 w-10 rounded-full ${r.tone}`} aria-hidden="true" />
                <span className="text-[12px] font-medium text-ink-900">{r.label}</span>
                {targetMatch ? (
                  <span className="ml-auto rounded-full bg-ink-900 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-parchment">
                    Target
                  </span>
                ) : reachedMatch ? (
                  <span className="ml-auto rounded-full bg-success-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success-800">
                    On the way
                  </span>
                ) : null}
              </li>
            );
          })}
      </ol>
    </div>
  );
}

// ---- Language card · combines gauge + ladder + rationale -----------

export function LanguageCard({
  language,
}: {
  language: CultureDetail["language"];
}) {
  const targetMeta = LADDER_RUNGS.find((r) => r.id === language.proficiency_target);
  return (
    <section
      data-language-card
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Language · {language.primary_language}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${targetMeta?.chip ?? "bg-ink-100 text-ink-700"}`}
        >
          target · {targetMeta?.id ?? language.proficiency_target}
        </span>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[180px_1fr]">
        <EnglishUsabilityGauge score={language.english_usability_score} />
        <LanguageLadder target={language.proficiency_target} />
      </div>

      {language.rationale ? (
        <p className="mt-4 border-t border-ink-100 pt-3 text-[12.5px] leading-[1.55] text-ink-700">
          {language.rationale}
        </p>
      ) : null}
    </section>
  );
}

// ---- First-week kit kanban (Must / Should / Nice) -----------------

const KIT_PRIORITY: Record<
  "must" | "should" | "nice",
  { label: string; eyebrow: string; border: string; bg: string; chip: string; rank: number }
> = {
  must: { label: "Must", eyebrow: "text-danger-700", border: "border-danger-200", bg: "bg-danger-50/30", chip: "bg-danger-100 text-danger-800", rank: 1 },
  should: { label: "Should", eyebrow: "text-gilt-700", border: "border-gilt-200", bg: "bg-gilt-50/30", chip: "bg-gilt-100 text-gilt-800", rank: 2 },
  nice: { label: "Nice", eyebrow: "text-lagoon-700", border: "border-lagoon-200", bg: "bg-lagoon-50/30", chip: "bg-lagoon-100 text-lagoon-800", rank: 3 },
};

export function FirstWeekKanban({
  items,
}: {
  items: CultureDetail["first_week_kit"];
}) {
  if (!items?.length) return null;
  const grouped: Record<string, typeof items> = { must: [], should: [], nice: [] };
  for (const it of items) (grouped[it.priority] ||= []).push(it);

  // Sum effort per column for header chip
  const totals = {
    must: grouped.must.reduce((s, x) => s + (x.effort_hours ?? 0), 0),
    should: grouped.should.reduce((s, x) => s + (x.effort_hours ?? 0), 0),
    nice: grouped.nice.reduce((s, x) => s + (x.effort_hours ?? 0), 0),
  };

  return (
    <section data-first-week-kanban>
      <SectionLabel>First-week kit · prioritised by must-do, should-do, nice-to-have</SectionLabel>
      <div className="grid gap-3 md:grid-cols-3">
        {(["must", "should", "nice"] as const).map((p) => {
          const tone = KIT_PRIORITY[p];
          const list = grouped[p];
          return (
            <div
              key={p}
              data-kit-column={p}
              className={`rounded-2xl border ${tone.border} ${tone.bg} p-3`}
            >
              <div className="flex items-baseline justify-between">
                <p className={`font-mono text-[10.5px] uppercase tracking-[0.22em] ${tone.eyebrow}`}>
                  {tone.label}
                </p>
                <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-ink-700">
                  {list.length} · ~{totals[p]}h
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {list.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-ink-200 bg-white/50 p-2 text-[11px] text-ink-500">
                    Nothing in this priority
                  </li>
                ) : (
                  list.map((it, i) => (
                    <li
                      key={i}
                      data-kit-item={i}
                      className="rounded-xl bg-white/90 p-2.5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-semibold text-ink-900">{it.label}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums ${tone.chip}`}
                        >
                          {it.effort_hours}h
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-[1.45] text-ink-700">{it.why}</p>
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

// DailyLifeGrid moved → ./daily-life-grid.tsx (interactive filter + search)

// ---- Do · Don't dual cards ------------------------------------------

export function DosAndDontsCard({
  pairs,
}: {
  pairs: CultureDetail["dos_and_donts"];
}) {
  if (!pairs?.length) return null;
  return (
    <section data-dos-and-donts>
      <SectionLabel>Do · Don&apos;t · landmines and lifelines</SectionLabel>
      <ul className="grid gap-3 md:grid-cols-2">
        {pairs.map((p, i) => (
          <li
            key={i}
            data-do-dont={i}
            className="overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start gap-2 border-b border-ink-100 bg-success-50/40 p-3">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700"
              >
                <Check className="h-4 w-4" />
              </span>
              <p className="text-[12.5px] leading-[1.55] text-ink-800">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-700">do · </span>
                {p.do}
              </p>
            </div>
            <div className="flex items-start gap-2 bg-danger-50/40 p-3">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-700"
              >
                <X className="h-4 w-4" />
              </span>
              <p className="text-[12.5px] leading-[1.55] text-ink-800">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-danger-700">don&apos;t · </span>
                {p.dont}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- Family adaptation notes (compact list of insight chips) -------

export function FamilyAdaptationCard({
  notes,
}: {
  notes: CultureDetail["family_adaptation_notes"];
}) {
  if (!notes?.length) return null;
  return (
    <section data-family-adaptation>
      <SectionLabel>Family adaptation notes · the household-level adjustments</SectionLabel>
      <div className="rounded-2xl border border-lagoon-200 bg-lagoon-50/40 p-4">
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li
              key={i}
              data-adaptation-note={i}
              className="flex items-start gap-3 rounded-xl bg-white/80 p-3"
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-[12px] font-semibold text-lagoon-700"
              >
                {i + 1}
              </span>
              <p className="text-[12.5px] leading-[1.55] text-ink-700">{n}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
