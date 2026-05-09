"use client";

/**
 * Interactive Milestone pin board.
 *
 * Adds:
 *   • Filter chips: All / Critical / By phase
 *   • Mark-as-done star toggle per milestone (local UI state)
 *   • Done-progress strip with reset
 *   • Pin axis colour-codes done milestones in success-green
 */

import * as React from "react";
import { Star, RotateCcw, Filter } from "lucide-react";
import type { TimelineMilestone, TimelinePhase } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

type FilterMode =
  | { kind: "all" }
  | { kind: "critical" }
  | { kind: "phase"; phaseId: string };

export function MilestonePinBoard({
  milestones,
  criticalMilestoneIds,
  phases,
  totalWeeksMax,
}: {
  milestones: TimelineMilestone[];
  criticalMilestoneIds: string[];
  phases: TimelinePhase[];
  totalWeeksMax: number;
}) {
  const [filter, setFilter] = React.useState<FilterMode>({ kind: "all" });
  const [done, setDone] = React.useState<Set<string>>(() => new Set());

  if (!milestones.length) return null;
  const phaseById = new Map(phases.map((p) => [p.id, p] as const));
  const maxWeek = Math.max(totalWeeksMax, ...milestones.map((m) => m.target_week), 1);
  const criticalSet = new Set(criticalMilestoneIds);

  const sortedAll = React.useMemo(
    () => [...milestones].sort((a, b) => a.target_week - b.target_week),
    [milestones],
  );

  const visible = React.useMemo(() => {
    if (filter.kind === "all") return sortedAll;
    if (filter.kind === "critical")
      return sortedAll.filter((m) => criticalSet.has(m.id));
    return sortedAll.filter((m) => m.phase_id === filter.phaseId);
  }, [sortedAll, filter, criticalSet]);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetDone() {
    setDone(new Set());
  }

  const donePct =
    milestones.length === 0 ? 0 : Math.round((done.size / milestones.length) * 100);

  // Phases that actually have milestones (for the chip set)
  const phasesWithMilestones = React.useMemo(() => {
    const ids = new Set(milestones.map((m) => m.phase_id));
    return phases.filter((p) => ids.has(p.id));
  }, [milestones, phases]);

  return (
    <section data-milestone-board>
      <SectionLabel>Milestones · the dots that have to land</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* ============ Done progress strip ============ */}
        <div
          data-milestone-progress
          className="mb-3 flex items-center gap-3 rounded-2xl border border-ink-100 bg-parchment/40 p-3"
        >
          <span
            aria-hidden="true"
            className={
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors " +
              (done.size > 0 ? "bg-success-100 text-success-700" : "bg-ink-100 text-ink-500")
            }
          >
            <Star className={"h-4 w-4 " + (done.size > 0 ? "fill-current" : "")} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Milestones cleared · {done.size} of {milestones.length}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className={
                  "h-full transition-[width] duration-300 " +
                  (donePct === 100 ? "bg-success-500" : "bg-success-400")
                }
                style={{ width: `${donePct}%` }}
              />
            </div>
          </div>
          {done.size > 0 ? (
            <button
              type="button"
              onClick={resetDone}
              data-milestone-reset
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          ) : null}
        </div>

        {/* ============ Filter chips ============ */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            <Filter className="h-3 w-3" />
            Filter
          </span>
          <FilterChip
            active={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
            label={`All (${milestones.length})`}
          />
          <FilterChip
            active={filter.kind === "critical"}
            onClick={() =>
              setFilter(filter.kind === "critical" ? { kind: "all" } : { kind: "critical" })
            }
            label={`Critical (${criticalSet.size})`}
            tone="bg-gilt-100 text-gilt-800"
          />
          {phasesWithMilestones.map((p) => {
            const n = milestones.filter((m) => m.phase_id === p.id).length;
            const active = filter.kind === "phase" && filter.phaseId === p.id;
            return (
              <FilterChip
                key={p.id}
                active={active}
                onClick={() =>
                  setFilter(active ? { kind: "all" } : { kind: "phase", phaseId: p.id })
                }
                label={`${p.label} (${n})`}
              />
            );
          })}
        </div>

        {/* ============ Pin axis ============ */}
        <div className="relative mt-4 h-10">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink-200" />
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <span
              key={p}
              aria-hidden="true"
              className="absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink-200"
              style={{ left: `${p * 100}%` }}
            />
          ))}
          {visible.map((m) => {
            const isCritical = criticalSet.has(m.id);
            const isDone = done.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleDone(m.id)}
                aria-pressed={isDone}
                aria-label={`Toggle ${m.label} done`}
                title={`${m.label} · wk ${m.target_week}${isDone ? " · done" : ""}`}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                style={{ left: `${(m.target_week / maxWeek) * 100}%` }}
                data-pin={m.id}
                data-pin-critical={isCritical ? "true" : "false"}
                data-pin-done={isDone ? "true" : "false"}
              >
                <span
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white font-mono text-[9.5px] font-semibold tabular-nums shadow-sm transition-colors " +
                    (isDone
                      ? "bg-success-500 text-white"
                      : isCritical
                      ? "bg-gilt-500 text-white"
                      : "bg-ink-900 text-parchment")
                  }
                >
                  {m.target_week}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tick labels */}
        <div className="relative mt-1 h-3">
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const w = Math.round(p * maxWeek);
            return (
              <span
                key={p}
                className="absolute -translate-x-1/2 font-mono text-[9px] tabular-nums text-ink-400"
                style={{ left: `${p * 100}%` }}
              >
                w{w}
              </span>
            );
          })}
        </div>

        {/* ============ Per-milestone cards ============ */}
        {visible.length === 0 ? (
          <p
            data-milestone-empty
            className="mt-5 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No milestones in this filter.
          </p>
        ) : (
          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {visible.map((m) => {
              const isCritical = criticalSet.has(m.id);
              const isDone = done.has(m.id);
              const phase = phaseById.get(m.phase_id);
              return (
                <li
                  key={m.id}
                  data-milestone={m.id}
                  data-milestone-critical={isCritical ? "true" : "false"}
                  data-milestone-done={isDone ? "true" : "false"}
                  className={
                    "relative rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm " +
                    (isDone
                      ? "border-success-200 bg-success-50/40"
                      : isCritical
                      ? "border-gilt-300 bg-gilt-50/40"
                      : "border-ink-200 bg-white")
                  }
                >
                  <div className="flex items-start gap-2.5 pr-9">
                    <span
                      aria-hidden="true"
                      className={
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold tabular-nums " +
                        (isDone
                          ? "bg-success-500 text-white"
                          : isCritical
                          ? "bg-gilt-500 text-white"
                          : "bg-ink-900 text-parchment")
                      }
                    >
                      w{m.target_week}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <p
                          className={
                            "text-[13px] font-semibold tracking-[-0.005em] " +
                            (isDone ? "text-ink-500 line-through" : "text-ink-900")
                          }
                        >
                          {m.label}
                        </p>
                        {isCritical ? (
                          <span className="rounded-full bg-gilt-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800">
                            critical
                          </span>
                        ) : null}
                        {isDone ? (
                          <span className="rounded-full bg-success-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-800">
                            done
                          </span>
                        ) : null}
                        {phase ? (
                          <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">
                            {phase.label}
                          </span>
                        ) : null}
                      </div>
                      {m.depends_on?.length ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
                            waits on
                          </span>
                          {m.depends_on.map((d) => (
                            <span
                              key={d}
                              className="rounded-full bg-parchment px-1.5 py-0 font-mono text-[9.5px] text-ink-700"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {m.why ? (
                        <p
                          className={
                            "mt-1.5 text-[11.5px] leading-[1.5] " +
                            (isDone ? "text-ink-500" : "text-ink-700")
                          }
                        >
                          {m.why}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {/* Star toggle */}
                  <button
                    type="button"
                    onClick={() => toggleDone(m.id)}
                    aria-pressed={isDone}
                    aria-label={`Mark ${m.label} ${isDone ? "not done" : "done"}`}
                    data-milestone-toggle={m.id}
                    className={
                      "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-all " +
                      (isDone
                        ? "bg-success-500 text-white shadow-sm hover:bg-success-600"
                        : "border border-ink-200 bg-white/70 text-ink-300 hover:border-success-300 hover:text-success-600")
                    }
                  >
                    <Star
                      className={"h-3.5 w-3.5 " + (isDone ? "fill-current" : "")}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: string;
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
          : (tone ?? "bg-white text-ink-700") + " border-ink-200 hover:border-ink-400")
      }
    >
      {label}
    </button>
  );
}
