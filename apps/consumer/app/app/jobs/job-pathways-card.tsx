"use client";

/**
 * Interactive Job Pathways card.
 *
 * Multiple pathways (e.g. "Direct sponsor track" / "Local hire pivot")
 * shown as collapsible cards with:
 *   • headline · time-to-offer chip · confidence dot
 *   • a vertical mini-stepper for the steps
 *   • only one expanded at a time
 */

import * as React from "react";
import type { JobFitDetail } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

type Pathway = JobFitDetail["job_pathways"][number];

export function JobPathwaysCard({ pathways }: { pathways: Pathway[] }) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  if (!pathways?.length) return null;

  return (
    <section data-job-pathways>
      <SectionLabel>Job pathways · routes from where you are to a signed offer</SectionLabel>
      <ul className="space-y-2">
        {pathways.map((p, i) => {
          const open = openIdx === i;
          const conf = Math.round(p.confidence * 100);
          const confTone =
            p.confidence >= 0.75 ? "bg-success-500" : p.confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";
          const speedTone =
            p.time_to_offer_weeks <= 8
              ? "bg-success-100 text-success-800"
              : p.time_to_offer_weeks <= 16
              ? "bg-gilt-100 text-gilt-800"
              : "bg-ink-100 text-ink-700";
          return (
            <li
              key={i}
              data-pathway={i}
              data-pathway-open={open ? "true" : "false"}
              className={
                "rounded-2xl border-2 transition-all " +
                (i === 0
                  ? "border-ink-900 bg-parchment/40"
                  : "border-ink-200 bg-white")
              }
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                data-pathway-toggle={i}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <span
                  aria-hidden="true"
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold tabular-nums " +
                    (i === 0
                      ? "bg-ink-900 text-parchment"
                      : "border-2 border-ink-300 bg-white text-ink-700")
                  }
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-[14.5px] font-semibold tracking-[-0.005em] text-ink-900">
                      {p.name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${speedTone}`}
                    >
                      ~{p.time_to_offer_weeks}w to offer
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
                      title={`Confidence ${conf}%`}
                    >
                      <span className={`h-2 w-2 rounded-full ${confTone}`} />
                      conf {conf}%
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {open ? "Hide steps ↑" : `${p.steps.length} steps ↓`}
                    </span>
                  </div>
                </div>
              </button>

              {open ? (
                <ol
                  data-pathway-steps={i}
                  className="relative space-y-2 border-t border-ink-200 px-4 pb-4 pt-3"
                >
                  {p.steps.map((s, k) => (
                    <li
                      key={k}
                      data-pathway-step={k}
                      className="relative flex gap-3 pl-0"
                    >
                      {k < p.steps.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-[15px] top-7 h-[calc(100%-1.5rem)] w-0.5 bg-ink-200"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[11px] font-semibold tabular-nums text-ink-700 ring-2 ring-ink-200"
                      >
                        {k + 1}
                      </span>
                      <p className="flex-1 self-center text-[12.5px] leading-[1.55] text-ink-700">
                        {s}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
