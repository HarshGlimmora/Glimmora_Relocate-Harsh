"use client";

/**
 * Interactive Gantt chart.
 *
 * The static SVG layout from visual-cards is preserved, but layered
 * with:
 *   • Category filter chips that dim non-matching phases
 *   • Click-to-focus on any phase bar (focused row highlights, others
 *     dim) — also focuses the matching legend row below
 *   • A "Show only critical milestones" toggle
 *   • Hover cursor + accessible aria-pressed states
 */

import * as React from "react";
import { Filter, Star } from "lucide-react";
import type {
  TimelineMilestone,
  TimelinePhase,
} from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

const CATEGORY_PALETTE: Record<
  string,
  { fill: string; stroke: string; chip: string; bg: string }
> = {
  visa: { fill: "fill-lagoon-300", stroke: "stroke-lagoon-500", chip: "bg-lagoon-100 text-lagoon-800", bg: "bg-lagoon-300" },
  documents: { fill: "fill-gilt-300", stroke: "stroke-gilt-500", chip: "bg-gilt-100 text-gilt-800", bg: "bg-gilt-300" },
  job: { fill: "fill-success-300", stroke: "stroke-success-500", chip: "bg-success-100 text-success-800", bg: "bg-success-300" },
  career: { fill: "fill-success-300", stroke: "stroke-success-500", chip: "bg-success-100 text-success-800", bg: "bg-success-300" },
  finance: { fill: "fill-gilt-300", stroke: "stroke-gilt-500", chip: "bg-gilt-100 text-gilt-800", bg: "bg-gilt-300" },
  family: { fill: "fill-danger-300", stroke: "stroke-danger-500", chip: "bg-danger-100 text-danger-800", bg: "bg-danger-300" },
  housing: { fill: "fill-lagoon-300", stroke: "stroke-lagoon-500", chip: "bg-lagoon-100 text-lagoon-800", bg: "bg-lagoon-300" },
  move: { fill: "fill-ink-300", stroke: "stroke-ink-500", chip: "bg-ink-100 text-ink-700", bg: "bg-ink-300" },
  default: { fill: "fill-ink-300", stroke: "stroke-ink-500", chip: "bg-ink-100 text-ink-700", bg: "bg-ink-300" },
};

function paletteFor(category: string) {
  const c = (category ?? "").toLowerCase();
  return CATEGORY_PALETTE[c] ?? CATEGORY_PALETTE.default;
}

export function GanttChart({
  phases,
  milestones,
  criticalMilestoneIds,
  totalWeeksMax,
}: {
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
  criticalMilestoneIds: string[];
  totalWeeksMax: number;
}) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [focusedPhaseId, setFocusedPhaseId] = React.useState<string | null>(null);
  const [criticalOnly, setCriticalOnly] = React.useState(false);

  if (!phases.length) return null;

  const maxWeek = Math.max(
    totalWeeksMax,
    ...phases.map((p) => p.end_week),
    ...milestones.map((m) => m.target_week),
    1,
  );

  // Categories present
  const categories = React.useMemo(() => {
    const seen = new Map<string, number>();
    for (const p of phases) seen.set(p.category, (seen.get(p.category) ?? 0) + 1);
    return Array.from(seen.entries());
  }, [phases]);

  function isPhaseDimmed(p: TimelinePhase): boolean {
    if (activeCategory && p.category !== activeCategory) return true;
    if (focusedPhaseId && focusedPhaseId !== p.id) return true;
    return false;
  }

  function isPhaseFocused(p: TimelinePhase): boolean {
    return focusedPhaseId === p.id;
  }

  // SVG layout
  const W = 760;
  const padL = 90;
  const padR = 16;
  const padT = 24;
  const rowH = 32;
  const rowGap = 6;
  const padB = 28;
  const innerW = W - padL - padR;
  const totalH = padT + (rowH + rowGap) * phases.length + padB;

  const xFor = (week: number) => padL + (week / maxWeek) * innerW;
  const widthFor = (start: number, end: number) =>
    Math.max(8, ((end - start) / maxWeek) * innerW);

  const step = maxWeek <= 12 ? 1 : maxWeek <= 24 ? 4 : maxWeek <= 52 ? 8 : 12;
  const ticks: number[] = [];
  for (let w = 0; w <= maxWeek; w += step) ticks.push(w);
  if (ticks[ticks.length - 1] !== maxWeek) ticks.push(maxWeek);

  const criticalSet = new Set(criticalMilestoneIds);
  const visibleMilestones = criticalOnly
    ? milestones.filter((m) => criticalSet.has(m.id))
    : milestones;

  return (
    <section data-gantt-chart>
      <SectionLabel>Phase Gantt · weeks 0–{maxWeek}, anchored to your earliest start</SectionLabel>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white p-3">
        {/* ============ Category chips + critical toggle ============ */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            <Filter className="h-3 w-3" />
            Category
          </span>
          <FilterChip
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
            label={`All (${phases.length})`}
          />
          {categories.map(([cat, n]) => {
            const palette = paletteFor(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                data-gantt-category={cat}
                data-category-active={activeCategory === cat ? "true" : "false"}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors " +
                  (activeCategory === cat
                    ? "border-ink-900 bg-ink-900 text-parchment"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "h-2 w-2 rounded-full " +
                    (activeCategory === cat ? "bg-parchment/70" : palette.bg)
                  }
                />
                {cat}
                <span
                  className={
                    "rounded-full px-1.5 py-0 font-mono text-[9.5px] tabular-nums " +
                    (activeCategory === cat ? "bg-white/15 text-parchment" : palette.chip)
                  }
                >
                  {n}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCriticalOnly((c) => !c)}
            aria-pressed={criticalOnly}
            data-gantt-critical-only={criticalOnly ? "true" : "false"}
            className={
              "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
              (criticalOnly
                ? "border-gilt-300 bg-gilt-50 text-gilt-800"
                : "border-ink-200 text-ink-700 hover:border-ink-400")
            }
          >
            <Star className={"h-3 w-3 " + (criticalOnly ? "fill-current" : "")} />
            {criticalOnly ? "Critical only · ON" : "Critical only"}
          </button>
        </div>

        {/* ============ SVG ============ */}
        <div className="mt-3 overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${totalH}`}
            role="img"
            aria-label={`Gantt chart of ${phases.length} phases across ${maxWeek} weeks`}
            className="block w-full"
            style={{ minWidth: 600 }}
          >
            {/* Background week grid */}
            {ticks.map((t) => (
              <line
                key={`grid-${t}`}
                x1={xFor(t)}
                y1={padT - 4}
                x2={xFor(t)}
                y2={totalH - padB + 4}
                className="stroke-ink-100"
                strokeWidth="1"
              />
            ))}
            {/* Start marker */}
            <line
              x1={xFor(0)}
              y1={padT - 6}
              x2={xFor(0)}
              y2={totalH - padB + 6}
              className="stroke-ink-700"
              strokeWidth="1.5"
              strokeDasharray="2 3"
            />
            <text
              x={xFor(0) + 3}
              y={padT - 8}
              className="fill-ink-700 font-mono"
              fontSize="9"
            >
              Start
            </text>

            {/* Phase rows */}
            {phases.map((p, i) => {
              const y = padT + i * (rowH + rowGap);
              const x = xFor(p.start_week);
              const w = widthFor(p.start_week, p.end_week);
              const palette = paletteFor(p.category);
              const dimmed = isPhaseDimmed(p);
              const focused = isPhaseFocused(p);
              const opacity = dimmed ? 0.25 : 1;
              return (
                <g
                  key={p.id}
                  data-gantt-phase={p.id}
                  data-phase-focused={focused ? "true" : "false"}
                  data-phase-dimmed={dimmed ? "true" : "false"}
                  style={{ opacity, cursor: "pointer", transition: "opacity 200ms" }}
                  onClick={() =>
                    setFocusedPhaseId(focused ? null : p.id)
                  }
                >
                  <text
                    x={padL - 8}
                    y={y + rowH / 2 + 3}
                    textAnchor="end"
                    className="fill-ink-700 font-mono"
                    fontSize="10"
                  >
                    <title>{p.label}</title>
                    {p.label.length > 14 ? p.label.slice(0, 13) + "…" : p.label}
                  </text>
                  <rect
                    x={padL}
                    y={y + rowH / 2 - 1}
                    width={innerW}
                    height={2}
                    className="fill-ink-100"
                  />
                  {/* Focus highlight rect (under the bar) */}
                  {focused ? (
                    <rect
                      x={padL - 4}
                      y={y}
                      width={innerW + 8}
                      height={rowH}
                      rx="6"
                      className="fill-ink-50"
                    />
                  ) : null}
                  <rect
                    x={x}
                    y={y + 4}
                    width={w}
                    height={rowH - 8}
                    rx="6"
                    className={`${palette.fill} ${palette.stroke}`}
                    strokeWidth={focused ? "2" : "1.5"}
                  >
                    <title>{`${p.label} · weeks ${p.start_week}–${p.end_week} · ${p.category}`}</title>
                  </rect>
                  {w > 90 ? (
                    <text
                      x={x + 8}
                      y={y + rowH / 2 + 3}
                      className="fill-ink-900 font-mono"
                      fontSize="10"
                    >
                      wk {p.start_week}–{p.end_week}
                    </text>
                  ) : (
                    <text
                      x={x + w + 4}
                      y={y + rowH / 2 + 3}
                      className="fill-ink-700 font-mono"
                      fontSize="9"
                    >
                      wk {p.start_week}–{p.end_week}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Milestone pins */}
            {visibleMilestones.map((m) => {
              const x = xFor(m.target_week);
              const isCritical = criticalSet.has(m.id);
              return (
                <g
                  key={m.id}
                  data-gantt-milestone={m.id}
                  data-critical={isCritical ? "true" : "false"}
                >
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={totalH - padB + 4}
                    className={isCritical ? "stroke-gilt-500" : "stroke-ink-300"}
                    strokeWidth={isCritical ? "1.5" : "1"}
                    strokeDasharray={isCritical ? "" : "3 3"}
                  />
                  <polygon
                    points={`${x},${totalH - padB + 8} ${x - 5},${totalH - padB + 14} ${x},${totalH - padB + 20} ${x + 5},${totalH - padB + 14}`}
                    className={isCritical ? "fill-gilt-500" : "fill-ink-300"}
                  >
                    <title>{`${m.label} · wk ${m.target_week}${isCritical ? " · critical" : ""}`}</title>
                  </polygon>
                </g>
              );
            })}

            {/* Tick labels */}
            {ticks.map((t) => (
              <text
                key={`tick-${t}`}
                x={xFor(t)}
                y={totalH - 8}
                textAnchor="middle"
                className="fill-ink-500 font-mono"
                fontSize="9"
              >
                w{t}
              </text>
            ))}
          </svg>
        </div>

        {/* ============ Legend rows below ============ */}
        <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
          {phases.map((p) => {
            const palette = paletteFor(p.category);
            const dimmed = isPhaseDimmed(p);
            const focused = isPhaseFocused(p);
            return (
              <li
                key={p.id}
                data-gantt-legend-row={p.id}
                data-row-focused={focused ? "true" : "false"}
                onClick={() => setFocusedPhaseId(focused ? null : p.id)}
                className={
                  "flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition-all " +
                  (focused
                    ? "border-ink-900 bg-parchment/60 shadow-sm"
                    : "border-ink-100 bg-parchment/30 hover:border-ink-300") +
                  (dimmed ? " opacity-50" : "")
                }
              >
                <span
                  aria-hidden="true"
                  className={"mt-1 h-2.5 w-6 shrink-0 rounded-full " + palette.bg}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <p className="text-[12.5px] font-semibold text-ink-900">{p.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${palette.chip}`}
                    >
                      {p.category}
                    </span>
                    <span className="ml-auto font-mono text-[9.5px] tabular-nums text-ink-600">
                      wk {p.start_week}–{p.end_week}
                    </span>
                  </div>
                  {p.description ? (
                    <p className="mt-0.5 text-[11.5px] leading-[1.45] text-ink-600">{p.description}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {focusedPhaseId ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
            ✦ {phases.find((p) => p.id === focusedPhaseId)?.label} focused · click again to clear
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-filter-active={active ? "true" : "false"}
      className={
        "rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors " +
        (active
          ? "border-ink-900 bg-ink-900 text-parchment"
          : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
      }
    >
      {label}
    </button>
  );
}
