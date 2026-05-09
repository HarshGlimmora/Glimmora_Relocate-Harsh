/**
 * Visual cards for the Documents page.
 *
 * Same design language as Finance / Job Fit:
 *   • rounded-2xl panels
 *   • mono uppercase eyebrow labels
 *   • tone palette of success / gilt / danger / lagoon / ink
 *   • SVG / div primitives only — no chart library
 */

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Layers,
  FileWarning,
  Sparkles,
} from "lucide-react";
import type { ChecklistItem, DocumentChecklistDetail } from "@/lib/backend/types";

// ---- Section eyebrow label -------------------------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Readiness hero · circular gauge + verdict + counts -------------

export function ReadinessHeroCard({
  detail,
}: {
  detail: DocumentChecklistDetail;
}) {
  const v = Math.max(0, Math.min(100, detail.readiness_percentage));
  const tone =
    v >= 75
      ? { ring: "stroke-success-500", text: "text-success-700", chip: "bg-success-100 text-success-800", verdict: "Ready to file", border: "border-success-200", bg: "bg-success-50/40" }
      : v >= 40
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", chip: "bg-gilt-100 text-gilt-800", verdict: "Half-packed", border: "border-gilt-200", bg: "bg-gilt-50/40" }
      : { ring: "stroke-danger-500", text: "text-danger-700", chip: "bg-danger-100 text-danger-800", verdict: "Needs gathering", border: "border-danger-200", bg: "bg-danger-50/40" };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;

  return (
    <section
      data-readiness-hero
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-5`}
    >
      <div className="grid items-center gap-5 md:grid-cols-[200px_1fr]">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
            <circle cx="48" cy="48" r={radius} className="fill-none stroke-white" strokeWidth="9" />
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
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Document readiness
            </p>
            <p className={`mt-0.5 font-sans text-[34px] font-semibold leading-none ${tone.text}`}>
              {v}
              <span className="text-[14px] text-ink-400">%</span>
            </p>
            <p className={`mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
              {tone.verdict}
            </p>
          </div>
        </div>

        {/* Composition strip — visualise have/need/expiring/unknown shares */}
        <ReadinessStrip detail={detail} />
      </div>
    </section>
  );
}

function ReadinessStrip({ detail }: { detail: DocumentChecklistDetail }) {
  const total = detail.total_count || 1;
  const have = detail.have_count;
  const need = detail.need_count;
  const expiring = detail.expiring_count;
  const unknown = Math.max(0, total - have - need - expiring);

  const segments: { label: string; n: number; color: string; chip: string }[] = [
    { label: "Have", n: have, color: "bg-success-500", chip: "bg-success-100 text-success-800" },
    { label: "Need", n: need, color: "bg-danger-500", chip: "bg-danger-100 text-danger-800" },
    { label: "Expiring", n: expiring, color: "bg-gilt-500", chip: "bg-gilt-100 text-gilt-800" },
    { label: "Unknown", n: unknown, color: "bg-ink-300", chip: "bg-ink-100 text-ink-700" },
  ].filter((s) => s.n > 0);

  return (
    <div data-readiness-strip>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Composition · {total} document{total === 1 ? "" : "s"} on the route
        </p>
      </div>

      {/* Stacked bar */}
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/70">
        {segments.map((s) => (
          <div
            key={s.label}
            data-strip-segment={s.label}
            className={s.color}
            style={{ width: `${(s.n / total) * 100}%` }}
            title={`${s.label}: ${s.n}`}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-ink-700 sm:grid-cols-4">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            <span className="text-ink-700">{s.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${s.chip}`}>
              {s.n}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Document stat tile -----------------------------------------------

type StatTone = "good" | "warn" | "bad" | "neutral";

const STAT_TONE: Record<StatTone, { border: string; bg: string; iconWrap: string; iconColor: string; value: string }> = {
  good: { border: "border-success-200", bg: "bg-success-50/40", iconWrap: "bg-success-100", iconColor: "text-success-700", value: "text-success-800" },
  warn: { border: "border-gilt-200", bg: "bg-gilt-50/40", iconWrap: "bg-gilt-100", iconColor: "text-gilt-700", value: "text-gilt-800" },
  bad: { border: "border-danger-200", bg: "bg-danger-50/40", iconWrap: "bg-danger-100", iconColor: "text-danger-700", value: "text-danger-800" },
  neutral: { border: "border-ink-200", bg: "bg-white", iconWrap: "bg-ink-100", iconColor: "text-ink-700", value: "text-ink-900" },
};

export function DocStatTile({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: StatTone;
  hint?: string;
}) {
  const p = STAT_TONE[tone];
  return (
    <div
      data-doc-stat={label}
      data-stat-tone={tone}
      className={`rounded-2xl border ${p.border} ${p.bg} p-4 transition-shadow hover:shadow-sm`}
    >
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
      <p className={`mt-3 font-sans text-[26px] font-semibold leading-none tracking-tight ${p.value}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-600">{hint}</p> : null}
    </div>
  );
}

export function DocStatRow({ detail }: { detail: DocumentChecklistDetail }) {
  return (
    <section data-doc-stats>
      <SectionLabel>The four counts that matter</SectionLabel>
      <div className="grid gap-3 md:grid-cols-4">
        <DocStatTile
          icon={<Layers className="h-4 w-4" />}
          label="Total on route"
          value={String(detail.total_count)}
          tone="neutral"
          hint="Documents the destination + visa + family shape requires"
        />
        <DocStatTile
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Have"
          value={String(detail.have_count)}
          tone="good"
          hint="Already in your possession"
        />
        <DocStatTile
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Need"
          value={String(detail.need_count)}
          tone="bad"
          hint="Still to gather or apply for"
        />
        <DocStatTile
          icon={<FileWarning className="h-4 w-4" />}
          label="Expiring"
          value={String(detail.expiring_count)}
          tone="warn"
          hint="Have it, but it'll lapse before you need it"
        />
      </div>
    </section>
  );
}

// ---- Next to handle · the prominent action card ----------------------

export function NextToHandleCard({
  next,
}: {
  next: { kind: string; label: string; why: string };
}) {
  return (
    <section
      data-next-to-handle
      className="overflow-hidden rounded-2xl border-2 border-gilt-300 bg-gradient-to-br from-gilt-50 to-white p-5"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gilt-100 text-gilt-800"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800">
            Up next · the single thing to handle
          </p>
          <p className="mt-1.5 font-sans text-[20px] font-semibold tracking-[-0.01em] text-ink-900">
            {next.label}
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-700">{next.why}</p>
          <span className="mt-3 inline-block rounded-full border border-gilt-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-800">
            {next.kind.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </section>
  );
}

// ---- Documents insight card · summary + collapsible reasoning -------

export function DocumentsInsightCard({
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
  const pct = Math.round(confidence * 100);
  const confTone =
    confidence >= 0.75 ? "bg-success-500" : confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";

  return (
    <section data-documents-insight>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>Why this checklist · what shaped it</SectionLabel>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${pct}%`}
        >
          <span className={`h-2 w-2 rounded-full ${confTone}`} />
          conf {pct}%
        </span>
      </div>
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {headline ? (
          <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-700">
            ✦ {headline}
          </p>
        ) : null}
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

// ---- Required-for grid · each visa/route as a card -------------------

export function RequiredForGrid({
  summary,
}: {
  summary: Record<string, string[]>;
}) {
  const entries = Object.entries(summary);
  if (!entries.length) return null;
  return (
    <section data-required-for>
      <SectionLabel>Required for · which docs unlock which step</SectionLabel>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([route, kinds]) => (
          <div
            key={route}
            data-required-for-route={route}
            className="group rounded-2xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ink-400 hover:shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lagoon-800">
                {route.replace(/_/g, " ")}
              </p>
              <span className="rounded-full bg-lagoon-50 px-2 py-0.5 font-mono text-[10px] tabular-nums text-lagoon-700">
                {kinds.length} doc{kinds.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {kinds.map((k) => (
                <span
                  key={k}
                  data-required-doc={k}
                  className="rounded-full border border-lagoon-200 bg-lagoon-50/60 px-2.5 py-0.5 font-mono text-[11px] text-lagoon-800"
                >
                  {k.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Document checklist row (used by client checklist grid) ----------

export const STATUS_META: Record<
  ChecklistItem["status"],
  { label: string; chip: string; iconWrap: string; iconColor: string; icon: React.ReactNode; border: string; bg: string }
> = {
  have: {
    label: "Have",
    chip: "bg-success-100 text-success-800",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
    border: "border-success-200",
    bg: "bg-success-50/40",
  },
  need: {
    label: "Need",
    chip: "bg-danger-100 text-danger-800",
    iconWrap: "bg-danger-100",
    iconColor: "text-danger-700",
    icon: <AlertTriangle className="h-4 w-4" />,
    border: "border-danger-200",
    bg: "bg-danger-50/40",
  },
  expiring: {
    label: "Expiring",
    chip: "bg-gilt-100 text-gilt-800",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    icon: <FileWarning className="h-4 w-4" />,
    border: "border-gilt-200",
    bg: "bg-gilt-50/40",
  },
  unknown: {
    label: "Unknown",
    chip: "bg-ink-100 text-ink-700",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-500",
    icon: <Clock3 className="h-4 w-4" />,
    border: "border-ink-200",
    bg: "bg-white",
  },
};

export const URGENCY_META: Record<
  ChecklistItem["urgency"],
  { chip: string; rank: number; short: string }
> = {
  now: { chip: "bg-danger-100 text-danger-800", rank: 1, short: "Now" },
  "30d": { chip: "bg-gilt-100 text-gilt-800", rank: 2, short: "30d" },
  "90d": { chip: "bg-gilt-50 text-gilt-700 border border-gilt-200", rank: 3, short: "90d" },
  "6m": { chip: "bg-lagoon-50 text-lagoon-800 border border-lagoon-200", rank: 4, short: "6m" },
  later: { chip: "bg-ink-50 text-ink-700 border border-ink-200", rank: 5, short: "Later" },
};
