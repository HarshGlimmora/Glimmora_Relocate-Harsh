"use client";

/**
 * Interactive Timeline-Read insight card.
 *
 * Adds a segmented "view mode" control (TL;DR · Detail · Reasoning)
 * matching the Culture page pattern, plus a "Pin for later" toggle.
 */

import * as React from "react";
import { Bookmark, BookmarkCheck, Flag } from "lucide-react";
import { SectionLabel } from "./visual-cards";

type ViewMode = "tldr" | "detail" | "reasoning";

const MODES: { id: ViewMode; label: string; readtime: string }[] = [
  { id: "tldr", label: "TL;DR", readtime: "10s" },
  { id: "detail", label: "Detail", readtime: "30s" },
  { id: "reasoning", label: "Full reasoning", readtime: "1m" },
];

function tldrFrom(summary: string): string {
  const text = (summary ?? "").trim();
  if (!text) return "";
  const m = text.match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text.slice(0, 140)).trim();
}

export function TimelineInsightCard({
  summary,
  reasoning,
  confidence,
  headline,
}: {
  summary: string;
  reasoning: string;
  confidence: number;
  headline?: string;
}) {
  const [mode, setMode] = React.useState<ViewMode>("detail");
  const [pinned, setPinned] = React.useState(false);

  const pct = Math.round(confidence * 100);
  const confTone =
    confidence >= 0.75 ? "bg-success-500" : confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";

  const tldr = React.useMemo(() => tldrFrom(summary), [summary]);

  return (
    <section data-timeline-insight>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>The reading · why this runway</SectionLabel>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${pct}%`}
        >
          <span className={`h-2 w-2 rounded-full ${confTone}`} />
          conf {pct}%
        </span>
      </div>

      <div
        className={
          "rounded-2xl border bg-white p-5 transition-all " +
          (pinned ? "border-gilt-300 shadow-sm" : "border-ink-200")
        }
      >
        {/* Top bar: segmented control + pin */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Reading depth"
            data-view-mode-segmented
            className="inline-flex rounded-full border border-ink-200 bg-ink-50/60 p-0.5"
          >
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  data-view-mode={m.id}
                  data-view-mode-active={active ? "true" : "false"}
                  onClick={() => setMode(m.id)}
                  className={
                    "rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all " +
                    (active
                      ? "bg-ink-900 text-parchment shadow-sm"
                      : "text-ink-700 hover:text-ink-900")
                  }
                >
                  {m.label}
                  <span className="ml-1.5 opacity-60">· {m.readtime}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            aria-pressed={pinned}
            data-timeline-pin={pinned ? "true" : "false"}
            className={
              "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
              (pinned
                ? "border-gilt-300 bg-gilt-50 text-gilt-800"
                : "border-ink-200 text-ink-700 hover:border-ink-400")
            }
          >
            {pinned ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5" /> Pinned
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" /> Pin for later
              </>
            )}
          </button>
        </div>

        {/* Headline pill */}
        {headline ? (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-lagoon-50 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
            <Flag className="h-3 w-3" /> {headline}
          </p>
        ) : null}

        {/* Body — switches by view mode */}
        {mode === "tldr" ? (
          <div data-mode-body="tldr" className="mt-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
              The one-liner
            </p>
            <p className="mt-1.5 text-[16px] leading-[1.55] font-medium text-ink-900">
              {tldr || summary}
            </p>
          </div>
        ) : mode === "detail" ? (
          <div data-mode-body="detail" className="mt-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
              Full read
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-800">{summary}</p>
          </div>
        ) : (
          <div data-mode-body="reasoning" className="mt-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
              Full read
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-800">{summary}</p>
            {reasoning ? (
              <>
                <p className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                  How we got there
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-[1.6] text-ink-700">
                  {reasoning}
                </p>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12px] text-ink-500">
                No reasoning trace was returned for this read.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
