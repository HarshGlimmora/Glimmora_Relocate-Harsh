"use client";

/**
 * Interactive Next Actions card for the Finance page.
 *
 * A vertical step-timeline with:
 *   • a connector rail that "fills" as you tick steps off
 *   • numbered step badges that flip to a green check when completed
 *   • per-step urgency chip + supporting "why" text
 *   • a tiny inferred icon hinting at the kind of action
 *   • a progress strip at the top: X of Y done · NN%
 *
 * The check state is local to the session (no backend call). This
 * matches the spec — light interaction, no new functionality.
 */

import * as React from "react";
import type { NextAction } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

// ---- Urgency tone palette (mirrors the rest of the page's style) -----

const URGENCY_TONE: Record<
  string,
  { chip: string; ring: string; rail: string; cardBorder: string }
> = {
  now: {
    chip: "bg-danger-100 text-danger-800",
    ring: "ring-danger-300",
    rail: "bg-danger-500",
    cardBorder: "border-danger-200",
  },
  high: {
    chip: "bg-danger-100 text-danger-800",
    ring: "ring-danger-300",
    rail: "bg-danger-500",
    cardBorder: "border-danger-200",
  },
  soon: {
    chip: "bg-gilt-100 text-gilt-800",
    ring: "ring-gilt-300",
    rail: "bg-gilt-500",
    cardBorder: "border-gilt-200",
  },
  medium: {
    chip: "bg-gilt-100 text-gilt-800",
    ring: "ring-gilt-300",
    rail: "bg-gilt-500",
    cardBorder: "border-gilt-200",
  },
  later: {
    chip: "bg-ink-100 text-ink-700",
    ring: "ring-ink-200",
    rail: "bg-ink-300",
    cardBorder: "border-ink-200",
  },
  low: {
    chip: "bg-ink-100 text-ink-700",
    ring: "ring-ink-200",
    rail: "bg-ink-300",
    cardBorder: "border-ink-200",
  },
};

// ---- Lightweight icon inference based on the action label -------------

function iconFor(label: string): string {
  const l = label.toLowerCase();
  if (/(visa|permit|residence)/.test(l)) return "🛂";
  if (/(housing|rent|apartment|home)/.test(l)) return "🏠";
  if (/(saving|budget|fund|money|finance|tax|salary|cost)/.test(l)) return "💰";
  if (/(document|paperwork|certificate|passport)/.test(l)) return "📄";
  if (/(school|childcare|kid|family)/.test(l)) return "👨‍👩‍👧";
  if (/(insurance|health|medical)/.test(l)) return "🩺";
  if (/(language|culture)/.test(l)) return "🗣";
  if (/(employer|job|offer|interview)/.test(l)) return "💼";
  if (/(flight|travel|move|ship)/.test(l)) return "✈";
  return "→";
}

// ---- Main component --------------------------------------------------

export function NextActionsCard({
  actions,
  label = "Next actions · the path forward, in order",
}: {
  actions: NextAction[];
  label?: string;
}) {
  const [done, setDone] = React.useState<Set<number>>(() => new Set());

  if (!actions.length) return null;

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function reset() {
    setDone(new Set());
  }

  const total = actions.length;
  const completed = done.size;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section data-next-actions-card>
      <SectionLabel>{label}</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {/* ============ Top progress strip ============ */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                Roadmap progress
              </p>
              <p className="font-mono text-[11px] tabular-nums text-ink-700">
                {completed} of {total} · {pct}%
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className={
                  "h-full rounded-full transition-[width] duration-300 " +
                  (pct === 100 ? "bg-success-500" : "bg-ink-900")
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {completed > 0 ? (
            <button
              type="button"
              onClick={reset}
              data-action-reset
              className="rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
            >
              Reset
            </button>
          ) : null}
        </div>

        {/* ============ Vertical timeline ============ */}
        <ol className="relative mt-6 pl-0" data-action-timeline>
          {actions.map((a, i) => {
            const isDone = done.has(i);
            const tone = URGENCY_TONE[a.urgency.toLowerCase()] ?? URGENCY_TONE.later;
            const isLast = i === actions.length - 1;
            const railFilled = isDone || done.has(i + 1);
            return (
              <li
                key={i}
                data-next-action={i}
                data-urgency={a.urgency}
                data-action-done={isDone ? "true" : "false"}
                className="relative flex gap-4 pb-4 last:pb-0"
              >
                {/* Connector rail down through the badge */}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className={
                      "absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 transition-colors " +
                      (railFilled ? "bg-success-300" : "bg-ink-200")
                    }
                  />
                ) : null}

                {/* Numbered / completed badge */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  data-action-toggle={i}
                  aria-pressed={isDone}
                  aria-label={`Mark step ${i + 1} ${isDone ? "incomplete" : "done"}: ${a.label}`}
                  className={
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold tabular-nums ring-4 transition-all " +
                    (isDone
                      ? "bg-success-500 text-white ring-success-100 hover:bg-success-600"
                      : `bg-ink-900 text-parchment ${tone.ring} hover:scale-105`)
                  }
                >
                  {isDone ? (
                    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                      <path
                        d="M3.5 8.5l3 3 6-6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>

                {/* Step card */}
                <div
                  className={
                    "min-w-0 flex-1 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm " +
                    (isDone ? "border-success-200 bg-success-50/30" : tone.cardBorder)
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span aria-hidden="true" className="text-[15px] leading-none">
                      {iconFor(a.label)}
                    </span>
                    <p
                      className={
                        "text-[13.5px] font-semibold tracking-[-0.005em] " +
                        (isDone ? "text-ink-500 line-through" : "text-ink-900")
                      }
                    >
                      Step {i + 1} — {a.label}
                    </p>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                        (isDone
                          ? "bg-success-100 text-success-800"
                          : tone.chip)
                      }
                    >
                      {isDone ? "done" : a.urgency}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      data-action-mark={i}
                      className="ml-auto rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
                    >
                      {isDone ? "Undo" : "Mark done"}
                    </button>
                  </div>
                  <p
                    className={
                      "mt-2 text-[12.5px] leading-[1.5] " +
                      (isDone ? "text-ink-500" : "text-ink-700")
                    }
                  >
                    {a.why}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ============ Completion footer ============ */}
        {completed === total ? (
          <p
            data-action-complete
            className="mt-4 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-success-800"
          >
            ✓ All steps checked off · roadmap complete
          </p>
        ) : null}
      </div>
    </section>
  );
}
