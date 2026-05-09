/**
 * Visual cards for the Timeline page.
 *
 * Introduces a *Gantt-style horizontal phase chart* and a *milestone
 * pin board* â€” neither pattern appears on any other page. The Gantt
 * is plain SVG (no chart library) so it renders during SSR.
 */

import * as React from "react";
import { Hourglass, Flag, Sparkles, Anchor } from "lucide-react";
import type { TimelineDetail } from "@/lib/backend/types";

// GanttChart moved → ./gantt-chart.tsx (interactive category filter + focus)
// MilestonePinBoard moved → ./milestone-pin-board.tsx (filters + mark-done)
// BlockersBoard moved → ./blockers-board.tsx (severity filter + sort + resolve)
// TimelineInsightCard moved → ./timeline-insight-card.tsx (view modes + pin)

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Hero card Â· earliest start countdown + total weeks -----------

export function TimelineHero({ detail }: { detail: TimelineDetail }) {
  const minWeeks = detail.estimated_total_weeks_min;
  const maxWeeks = detail.estimated_total_weeks_max;

  // Days until earliest realistic start.
  let startDate: Date | null = null;
  try {
    if (detail.earliest_realistic_start_date) {
      const d = new Date(detail.earliest_realistic_start_date);
      if (!isNaN(d.getTime())) startDate = d;
    }
  } catch {
    startDate = null;
  }
  const daysUntilStart =
    startDate == null
      ? null
      : Math.max(0, Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const tone =
    maxWeeks <= 12
      ? { ring: "stroke-success-500", text: "text-success-700", chip: "bg-success-100 text-success-800", verdict: "Tight runway", border: "border-success-200", bg: "bg-success-50/40" }
      : maxWeeks <= 24
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", chip: "bg-gilt-100 text-gilt-800", verdict: "Standard runway", border: "border-gilt-200", bg: "bg-gilt-50/40" }
      : { ring: "stroke-danger-500", text: "text-danger-700", chip: "bg-danger-100 text-danger-800", verdict: "Long runway", border: "border-danger-200", bg: "bg-danger-50/40" };

  // Anchor a 90-day horizon for the start countdown ring.
  const horizon = 90;
  const elapsed = daysUntilStart == null ? 0 : Math.min(horizon, Math.max(0, horizon - daysUntilStart));
  const ringPct = horizon > 0 ? (elapsed / horizon) * 100 : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ringPct / 100) * circumference;

  return (
    <section
      data-timeline-hero
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-5`}
    >
      <div className="grid items-center gap-5 md:grid-cols-[200px_1fr]">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 88 88" className="h-22 w-22 -rotate-90" aria-hidden="true">
            <circle cx="44" cy="44" r={radius} className="fill-none stroke-white" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              className={`fill-none ${tone.ring}`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Earliest start
            </p>
            <p className={`mt-0.5 font-sans text-[24px] font-semibold leading-none ${tone.text}`}>
              {detail.earliest_realistic_start_date}
            </p>
            <p className="mt-1 inline-block rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
              {daysUntilStart != null ? `in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"}` : "no anchor"}
            </p>
          </div>
        </div>

        <div data-timeline-runway>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Runway Â· {minWeeks}â€“{maxWeeks} weeks end to end
          </p>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="absolute inset-y-0 left-0 bg-success-400"
              style={{ width: `${(minWeeks / Math.max(1, maxWeeks)) * 100}%` }}
              title={`Min: ${minWeeks}w`}
            />
            <div
              className="absolute inset-y-0 bg-gilt-400 opacity-80"
              style={{
                left: `${(minWeeks / Math.max(1, maxWeeks)) * 100}%`,
                width: `${100 - (minWeeks / Math.max(1, maxWeeks)) * 100}%`,
              }}
              title={`Max: ${maxWeeks}w`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              {minWeeks}w (best)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gilt-500" />
              {maxWeeks}w (worst)
            </span>
            <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
              {tone.verdict}
            </span>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
            <Anchor className="h-3 w-3" /> Anchored to Â· {detail.start_anchor.replace(/_/g, " ")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---- KPI tiles ------------------------------------------------------

export function TimelineKpiRow({ detail }: { detail: TimelineDetail }) {
  return (
    <section>
      <SectionLabel>The numbers Â· how the runway breaks down</SectionLabel>
      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile icon={<Hourglass className="h-4 w-4" />} label="Total weeks Â· min" value={String(detail.estimated_total_weeks_min)} tone="info" />
        <KpiTile icon={<Hourglass className="h-4 w-4" />} label="Total weeks Â· max" value={String(detail.estimated_total_weeks_max)} tone="warn" />
        <KpiTile icon={<Flag className="h-4 w-4" />} label="Phases" value={String(detail.phases.length)} tone="neutral" />
        <KpiTile
          icon={<Sparkles className="h-4 w-4" />}
          label="Critical milestones"
          value={String(detail.critical_milestones.length)}
          tone={detail.critical_milestones.length > 0 ? "warn" : "neutral"}
          hint={detail.critical_milestones.length > 0 ? "These set the pace" : undefined}
        />
      </div>
    </section>
  );
}

const TILE_TONE: Record<string, { border: string; bg: string; iconWrap: string; iconColor: string; value: string }> = {
  good: { border: "border-success-200", bg: "bg-success-50/40", iconWrap: "bg-success-100", iconColor: "text-success-700", value: "text-success-800" },
  warn: { border: "border-gilt-200", bg: "bg-gilt-50/40", iconWrap: "bg-gilt-100", iconColor: "text-gilt-700", value: "text-gilt-800" },
  bad: { border: "border-danger-200", bg: "bg-danger-50/40", iconWrap: "bg-danger-100", iconColor: "text-danger-700", value: "text-danger-800" },
  info: { border: "border-lagoon-200", bg: "bg-lagoon-50/40", iconWrap: "bg-lagoon-100", iconColor: "text-lagoon-700", value: "text-lagoon-800" },
  neutral: { border: "border-ink-200", bg: "bg-white", iconWrap: "bg-ink-100", iconColor: "text-ink-700", value: "text-ink-900" },
};

function KpiTile({
  icon,
  label,
  value,
  tone = "neutral",
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: keyof typeof TILE_TONE;
  hint?: string;
}) {
  const p = TILE_TONE[tone];
  return (
    <div className={`rounded-2xl border ${p.border} ${p.bg} p-4 transition-shadow hover:shadow-sm`}>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${p.iconWrap} ${p.iconColor}`}
        >
          {icon}
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
      </div>
      <p className={`mt-3 font-sans text-[24px] font-semibold leading-none tracking-tight ${p.value}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-600">{hint}</p> : null}
    </div>
  );
}
