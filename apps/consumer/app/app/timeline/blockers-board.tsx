"use client";

/**
 * Interactive Blockers board.
 *
 * Adds:
 *   • Severity filter chips (All / High / Medium / Low) with counts
 *   • Sort toggle: by severity (High first) vs by ETA (closest unblock first)
 *   • Mark-as-resolved per blocker (local UI state) — shows a strike
 *     and dims the card; surfaces a "resolved" counter in the header
 *   • Empty filter state
 */

import * as React from "react";
import {
  AlertTriangle,
  CalendarClock,
  Filter,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import type { TimelineBlocker } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

type Sev = "high" | "medium" | "low";
type SortDir = "by-severity" | "by-eta";

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEV_TONE: Record<
  Sev,
  { border: string; bg: string; chip: string; iconWrap: string; iconColor: string; bar: string }
> = {
  high: {
    border: "border-danger-200",
    bg: "bg-danger-50/40",
    chip: "bg-danger-100 text-danger-800",
    iconWrap: "bg-danger-100",
    iconColor: "text-danger-700",
    bar: "bg-danger-400",
  },
  medium: {
    border: "border-gilt-200",
    bg: "bg-gilt-50/40",
    chip: "bg-gilt-100 text-gilt-800",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    bar: "bg-gilt-400",
  },
  low: {
    border: "border-ink-200",
    bg: "bg-white",
    chip: "bg-ink-100 text-ink-700",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-500",
    bar: "bg-ink-400",
  },
};

export function BlockersBoard({ blockers }: { blockers: TimelineBlocker[] }) {
  const [activeSev, setActiveSev] = React.useState<Sev | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("by-severity");
  const [resolved, setResolved] = React.useState<Set<number>>(() => new Set());

  if (!blockers?.length) return null;

  const counts = React.useMemo(() => {
    const c: Record<Sev, number> = { high: 0, medium: 0, low: 0 };
    for (const b of blockers) {
      const sev = (b.severity ?? "low").toLowerCase() as Sev;
      if (sev in c) c[sev] += 1;
    }
    return c;
  }, [blockers]);

  const visible = React.useMemo(() => {
    const indexed = blockers.map((b, i) => ({ b, i }));
    const filtered = activeSev
      ? indexed.filter(({ b }) => (b.severity ?? "").toLowerCase() === activeSev)
      : indexed;
    filtered.sort((a, b) => {
      if (sortDir === "by-eta") {
        return a.b.estimated_unblock_weeks - b.b.estimated_unblock_weeks;
      }
      const ra = SEVERITY_RANK[(a.b.severity ?? "low").toLowerCase()] ?? 99;
      const rb = SEVERITY_RANK[(b.b.severity ?? "low").toLowerCase()] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.b.estimated_unblock_weeks - b.b.estimated_unblock_weeks;
    });
    return filtered;
  }, [blockers, activeSev, sortDir]);

  function toggleResolve(i: number) {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function resetResolved() {
    setResolved(new Set());
  }

  return (
    <section data-blockers-board>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Blockers · what's slowing the runway</SectionLabel>
        {resolved.size > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success-800">
            <CheckCircle2 className="h-3 w-3" />
            {resolved.size} marked clear · click reset to undo
          </span>
        ) : null}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* ============ Filter chips + sort toggle ============ */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            <Filter className="h-3 w-3" />
            Severity
          </span>
          <FilterChip
            active={activeSev === null}
            onClick={() => setActiveSev(null)}
            label={`All (${blockers.length})`}
          />
          {(["high", "medium", "low"] as Sev[]).map((sev) => {
            const n = counts[sev];
            if (!n) return null;
            const tone = SEV_TONE[sev];
            return (
              <FilterChip
                key={sev}
                active={activeSev === sev}
                onClick={() => setActiveSev(activeSev === sev ? null : sev)}
                label={`${sev} (${n})`}
                tone={tone.chip}
              />
            );
          })}

          <button
            type="button"
            onClick={() =>
              setSortDir((d) => (d === "by-severity" ? "by-eta" : "by-severity"))
            }
            data-blockers-sort={sortDir}
            className="ml-auto rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            {sortDir === "by-severity"
              ? "Sort · severity first ↑"
              : "Sort · clears soonest ↑"}
          </button>

          {resolved.size > 0 ? (
            <button
              type="button"
              onClick={resetResolved}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          ) : null}
        </div>

        {/* ============ Cards ============ */}
        {visible.length === 0 ? (
          <p
            data-blockers-empty
            className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No blockers in this severity.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {visible.map(({ b, i }) => {
              const sev = ((b.severity ?? "low").toLowerCase() as Sev);
              const tone = SEV_TONE[sev] ?? SEV_TONE.low;
              const isResolved = resolved.has(i);
              const cap = 12;
              const pct = Math.max(
                2,
                Math.min(100, ((cap - Math.min(cap, b.estimated_unblock_weeks)) / cap) * 100),
              );
              return (
                <li
                  key={i}
                  data-blocker={i}
                  data-severity={sev}
                  data-resolved={isResolved ? "true" : "false"}
                  className={
                    "group relative rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm " +
                    (isResolved
                      ? "border-success-200 bg-success-50/40"
                      : `${tone.border} ${tone.bg}`)
                  }
                >
                  <div className="flex items-start gap-3 pr-9">
                    <span
                      aria-hidden="true"
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors " +
                        (isResolved
                          ? "bg-success-100 text-success-700"
                          : `${tone.iconWrap} ${tone.iconColor}`)
                      }
                    >
                      {isResolved ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <p
                          className={
                            "text-[13px] font-semibold " +
                            (isResolved ? "text-ink-500 line-through" : "text-ink-900")
                          }
                        >
                          {b.label}
                        </p>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                            (isResolved ? "bg-success-100 text-success-800" : tone.chip)
                          }
                        >
                          {isResolved ? "cleared" : sev}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                          <CalendarClock className="h-3 w-3" />
                          ~{b.estimated_unblock_weeks}w to clear
                        </span>
                      </div>
                      <p
                        className={
                          "mt-1 text-[12px] leading-[1.5] " +
                          (isResolved ? "text-ink-500" : "text-ink-700")
                        }
                      >
                        {b.detail}
                      </p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/60">
                        <div
                          className={
                            "h-full transition-all " +
                            (isResolved ? "bg-success-500" : tone.bar)
                          }
                          style={{ width: `${isResolved ? 100 : pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Resolve toggle */}
                  <button
                    type="button"
                    onClick={() => toggleResolve(i)}
                    aria-pressed={isResolved}
                    aria-label={`Mark blocker ${b.label} ${isResolved ? "open" : "cleared"}`}
                    data-blocker-toggle={i}
                    className={
                      "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-all " +
                      (isResolved
                        ? "bg-success-500 text-white shadow-sm hover:bg-success-600"
                        : "border border-ink-200 bg-white/70 text-ink-300 hover:border-success-300 hover:text-success-600")
                    }
                  >
                    <CheckCircle2
                      className={"h-3.5 w-3.5 " + (isResolved ? "fill-current/0" : "")}
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
