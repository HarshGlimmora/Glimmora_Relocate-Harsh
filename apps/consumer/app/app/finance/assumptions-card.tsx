"use client";

/**
 * Rich, interactive Assumptions card for the Finance page.
 *
 * Adds three things on top of a plain list:
 *   1. A "Trust composition" stacked bar — what fraction of this
 *      analysis is your data vs. inferred vs. defaults vs. model.
 *   2. A confidence gauge (donut) — average confidence across all
 *      assumptions, plus a min/max sparkline strip.
 *   3. Source filter chips + sort toggle — interactive trimming so
 *      power users can scrutinise just the weakest / model / inferred
 *      ones.
 *
 * Pure SVG/divs — no chart library — same approach as the rest of the
 * page's visual cards.
 */

import * as React from "react";
import type { Assumption, AssumptionSource } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

type SortDir = "high-to-low" | "low-to-high";

const SOURCE_META: Record<
  AssumptionSource,
  { label: string; chip: string; icon: string; iconColor: string; bar: string; description: string }
> = {
  user: {
    label: "From you",
    chip: "bg-success-100 text-success-800",
    icon: "✓",
    iconColor: "text-success-600",
    bar: "bg-success-500",
    description: "You provided this directly",
  },
  inferred: {
    label: "Inferred",
    chip: "bg-lagoon-100 text-lagoon-800",
    icon: "≈",
    iconColor: "text-lagoon-600",
    bar: "bg-lagoon-500",
    description: "Derived from your profile + public data",
  },
  default: {
    label: "Default",
    chip: "bg-ink-100 text-ink-700",
    icon: "·",
    iconColor: "text-ink-500",
    bar: "bg-ink-400",
    description: "Sensible fallback for missing inputs",
  },
  model: {
    label: "Model",
    chip: "bg-gilt-100 text-gilt-800",
    icon: "✦",
    iconColor: "text-gilt-600",
    bar: "bg-gilt-500",
    description: "Estimated by the analysis engine",
  },
};

const SOURCE_ORDER: AssumptionSource[] = ["user", "inferred", "model", "default"];

export function AssumptionsCard({
  items,
  label = "Assumptions used · what we filled in to run the math",
}: {
  items: Assumption[];
  label?: string;
}) {
  const [activeSource, setActiveSource] = React.useState<AssumptionSource | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("low-to-high");

  // ---- Composition + stats (memoised, recompute when items change) ----
  const stats = React.useMemo(() => {
    const counts: Record<AssumptionSource, number> = {
      user: 0,
      inferred: 0,
      default: 0,
      model: 0,
    };
    let confSum = 0;
    let confMin = 1;
    let confMax = 0;
    for (const a of items) {
      counts[a.source] = (counts[a.source] ?? 0) + 1;
      confSum += a.confidence;
      if (a.confidence < confMin) confMin = a.confidence;
      if (a.confidence > confMax) confMax = a.confidence;
    }
    const avg = items.length === 0 ? 0 : confSum / items.length;
    const trustPct = items.length === 0 ? 0 : (counts.user / items.length) * 100;
    return { counts, avg, confMin, confMax, trustPct };
  }, [items]);

  // ---- Filter + sort applied to the rendered list -------------------
  const visible = React.useMemo(() => {
    const base = activeSource
      ? items.filter((a) => a.source === activeSource)
      : items.slice();
    base.sort((a, b) =>
      sortDir === "low-to-high" ? a.confidence - b.confidence : b.confidence - a.confidence,
    );
    return base.map((a, i) => ({ a, originalIndex: items.indexOf(a), key: `${a.label}-${i}` }));
  }, [items, activeSource, sortDir]);

  if (!items.length) return null;

  return (
    <section data-assumptions-card>
      <SectionLabel>{label}</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {/* ============ Header: composition bar + confidence gauge ============ */}
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <CompositionBlock counts={stats.counts} total={items.length} trustPct={stats.trustPct} />
          <ConfidenceGauge avg={stats.avg} min={stats.confMin} max={stats.confMax} />
        </div>

        {/* ============ Source filter chips ============ */}
        <div
          data-assumption-filters
          className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-4"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Filter
          </span>
          <FilterChip
            active={activeSource === null}
            onClick={() => setActiveSource(null)}
            label={`All (${items.length})`}
          />
          {SOURCE_ORDER.map((source) => {
            const n = stats.counts[source];
            if (!n) return null;
            const meta = SOURCE_META[source];
            return (
              <FilterChip
                key={source}
                active={activeSource === source}
                onClick={() => setActiveSource(activeSource === source ? null : source)}
                label={`${meta.icon} ${meta.label} (${n})`}
                tone={meta.chip}
              />
            );
          })}

          <button
            type="button"
            data-assumption-sort={sortDir}
            onClick={() =>
              setSortDir((d) => (d === "high-to-low" ? "low-to-high" : "high-to-low"))
            }
            className="ml-auto rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            {sortDir === "low-to-high"
              ? "Sort · weakest first ↑"
              : "Sort · strongest first ↓"}
          </button>
        </div>

        {/* ============ Empty filter state ============ */}
        {visible.length === 0 ? (
          <p
            data-assumption-empty
            className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No assumptions of this source.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-100">
            {visible.map(({ a, originalIndex, key }) => (
              <AssumptionRow key={key} a={a} index={originalIndex} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---- Composition block (stacked horizontal bar + legend) -------------

function CompositionBlock({
  counts,
  total,
  trustPct,
}: {
  counts: Record<AssumptionSource, number>;
  total: number;
  trustPct: number;
}) {
  const segments = SOURCE_ORDER
    .map((s) => ({ source: s, n: counts[s] ?? 0 }))
    .filter((s) => s.n > 0);

  return (
    <div data-trust-composition>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Trust composition
        </p>
        <p
          className="font-mono text-[11px] tabular-nums text-ink-700"
          title="Share of assumptions you supplied directly"
        >
          {trustPct.toFixed(0)}% from you
        </p>
      </div>

      {/* Stacked composition bar — segments per source */}
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-ink-100">
        {segments.map((seg) => {
          const meta = SOURCE_META[seg.source];
          const pct = (seg.n / total) * 100;
          return (
            <div
              key={seg.source}
              data-composition-segment={seg.source}
              className={`${meta.bar} transition-[width] duration-300`}
              style={{ width: `${pct}%` }}
              title={`${meta.label}: ${seg.n} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-ink-700">
        {segments.map((seg) => {
          const meta = SOURCE_META[seg.source];
          const pct = (seg.n / total) * 100;
          return (
            <li
              key={seg.source}
              className="flex items-center gap-2"
              data-legend-source={seg.source}
            >
              <span className={`h-2 w-2 rounded-full ${meta.bar}`} />
              <span className="text-ink-700">{meta.label}</span>
              <span className="font-mono text-[10.5px] tabular-nums text-ink-500">
                {seg.n} · {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Confidence gauge (SVG donut) ------------------------------------

function ConfidenceGauge({
  avg,
  min,
  max,
}: {
  avg: number;
  min: number;
  max: number;
}) {
  const pct = Math.round(avg * 100);
  const tone =
    avg >= 0.75
      ? { ring: "stroke-success-500", text: "text-success-700", verdict: "Strong basis" }
      : avg >= 0.55
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", verdict: "Mixed basis" }
      : { ring: "stroke-danger-500", text: "text-danger-700", verdict: "Soft basis" };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.max(0, Math.min(1, avg)) * circumference;

  return (
    <div data-confidence-gauge className="flex items-center gap-3">
      <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} className="fill-none stroke-ink-100" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className={`fill-none ${tone.ring} transition-[stroke-dashoffset] duration-300`}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Avg confidence
        </p>
        <p className={`mt-0.5 font-sans text-[22px] font-semibold leading-none ${tone.text}`}>
          {pct}
          <span className="text-[12px] text-ink-400">%</span>
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
          {tone.verdict} · range {Math.round(min * 100)}–{Math.round(max * 100)}%
        </p>
      </div>
    </div>
  );
}

// ---- Filter chip ------------------------------------------------------

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
          : (tone ?? "bg-white text-ink-700") +
            " border-ink-200 hover:border-ink-400")
      }
    >
      {label}
    </button>
  );
}

// ---- Per-row layout with confidence bar -------------------------------

function AssumptionRow({ a, index }: { a: Assumption; index: number }) {
  const meta = SOURCE_META[a.source] ?? SOURCE_META.default;
  const conf = Math.round(a.confidence * 100);
  const confTone =
    a.confidence >= 0.75
      ? "bg-success-500"
      : a.confidence >= 0.55
      ? "bg-gilt-500"
      : "bg-danger-500";

  return (
    <li
      data-assumption={index}
      data-assumption-source={a.source}
      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
    >
      <span
        aria-hidden="true"
        title={meta.description}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 font-sans text-[13px] font-semibold ${meta.iconColor}`}
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-[13px] font-medium text-ink-900">{a.label}</p>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${meta.chip}`}
          >
            {meta.label}
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-ink-500">
            conf {conf}%
          </span>
        </div>

        {/* Confidence bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`absolute inset-y-0 left-0 ${confTone} transition-[width] duration-300`}
              style={{ width: `${conf}%` }}
            />
          </div>
        </div>

        {a.detail ? (
          <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-600">{a.detail}</p>
        ) : null}
      </div>
    </li>
  );
}
