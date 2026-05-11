/**
 * Visualisation primitives for the finance category deep-dive.
 *
 * All components are pure / data-in-data-out — no fetching here. They
 * follow the existing finance / country page conventions: inline SVG,
 * the project's tone palette (success / gilt / danger / lagoon /
 * caramel), monospace eyebrows, soft-shadow rounded-2xl cards.
 */

import * as React from "react";
import { AlertTriangle, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import type {
  FinanceCategoryCostItem,
  FinanceCategoryLifestyleImpact,
  FinanceCategoryMarketComparison,
  FinanceCategoryOptimizationTip,
  FinanceCategoryProjectionPoint,
  FinanceCategoryRiskIndicator,
} from "@/lib/backend/types";

// ---- Section eyebrow ----------------------------------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Donut / pie chart for cost breakdown --------------------------------

const PIE_TONES = [
  "#5E3613", // caramel-700
  "#1C7063", // lagoon-600
  "#A87B17", // gilt-600
  "#0A8F64", // success-600
  "#B71D30", // danger-600
  "#967948", // ink-400
  "#7B4719", // caramel-600
  "#39A896", // lagoon-400
];

export function CostBreakdownDonut({
  items,
  currency,
  total,
}: {
  items: FinanceCategoryCostItem[];
  currency: string;
  total: number;
}) {
  const radius = 78;
  const inner = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Where this category goes
      </p>

      <div className="mt-4 flex flex-col items-center gap-5 md:flex-row md:items-center md:gap-8">
        {/* SVG donut */}
        <div className="relative h-[200px] w-[200px] shrink-0">
          <svg
            viewBox="-100 -100 200 200"
            className="h-full w-full -rotate-90"
            aria-hidden
          >
            <circle
              r={radius}
              fill="none"
              stroke="#F2E5C9"
              strokeWidth={radius - inner}
            />
            {items.map((it, i) => {
              const pct = Math.max(0, Math.min(100, it.share_pct)) / 100;
              const dash = circumference * pct;
              const gap = circumference - dash;
              const seg = (
                <circle
                  key={it.label + i}
                  r={radius}
                  fill="none"
                  stroke={PIE_TONES[i % PIE_TONES.length]}
                  strokeWidth={radius - inner}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return seg;
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Monthly
            </span>
            <span className="font-sans text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink-900">
              {total.toLocaleString()}
            </span>
            <span className="mt-0.5 font-mono text-[11px] text-ink-500">{currency}</span>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex-1 space-y-2 self-stretch">
          {items.map((it, i) => (
            <li
              key={it.label + i}
              className="flex items-baseline gap-2 text-[12.5px]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_TONES[i % PIE_TONES.length] }}
              />
              <span className="flex-1 truncate text-ink-800">{it.label}</span>
              <span className="font-mono text-[11px] tabular-nums text-ink-700">
                {it.amount.toLocaleString()}
              </span>
              <span className="w-9 text-right font-mono text-[10px] tabular-nums text-ink-500">
                {it.share_pct.toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- Market comparison bar chart -----------------------------------------

export function MarketComparisonBar({
  data,
}: {
  data: FinanceCategoryMarketComparison;
}) {
  const { currency, user_cost, market_low, market_avg, market_high, percentile, note } =
    data;
  // Max width anchor: the larger of user and high, padded a bit so the bars
  // never touch the right edge.
  const max = Math.max(user_cost, market_high) * 1.08 || 1;

  const Row = ({
    label,
    value,
    tone,
    emphasis,
  }: {
    label: string;
    value: number;
    tone: string;
    emphasis?: boolean;
  }) => (
    <div className="grid grid-cols-[120px_1fr_84px] items-center gap-3 text-[12.5px]">
      <span className={emphasis ? "font-semibold text-ink-900" : "text-ink-700"}>
        {label}
      </span>
      <div className="relative h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${tone}`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
      <span
        className={`text-right font-mono tabular-nums ${
          emphasis ? "text-ink-900 font-semibold" : "text-ink-700"
        }`}
      >
        {value.toLocaleString()} {currency}
      </span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Versus the local market
        </p>
        <p className="font-mono text-[11px] text-ink-700">
          P{percentile} percentile
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        <Row label="You pay" value={user_cost} tone="bg-caramel-700" emphasis />
        <Row label="Top quartile" value={market_high} tone="bg-danger-300" />
        <Row label="Local typical" value={market_avg} tone="bg-ink-500" />
        <Row label="Bottom quartile" value={market_low} tone="bg-success-500" />
      </div>

      <p className="mt-4 text-[12.5px] leading-[1.55] text-ink-700">{note}</p>
    </div>
  );
}

// ---- Optimization tip cards ----------------------------------------------

const EFFORT_TONE: Record<string, string> = {
  low: "bg-success-50 text-success-700 border-success-200",
  medium: "bg-gilt-50 text-gilt-700 border-gilt-200",
  high: "bg-danger-50 text-danger-700 border-danger-200",
};

export function OptimizationTipCard({
  tip,
  currency,
}: {
  tip: FinanceCategoryOptimizationTip;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-semibold leading-snug text-ink-900">
          {tip.label}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${
            EFFORT_TONE[tip.effort] ?? EFFORT_TONE.medium
          }`}
        >
          {tip.effort} effort
        </span>
      </div>
      <p className="text-[12.5px] leading-[1.55] text-ink-700">{tip.detail}</p>
      {tip.monthly_savings_estimate != null && tip.monthly_savings_estimate > 0 ? (
        <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-success-700">
          <TrendingDown className="h-3.5 w-3.5" />
          ≈ {tip.monthly_savings_estimate.toLocaleString()} {currency} / mo saved
        </p>
      ) : null}
    </div>
  );
}

// ---- Risk indicator badge ------------------------------------------------

const RISK_TONE: Record<string, { ring: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { ring: "border-success-200", bg: "bg-success-50", text: "text-success-700", icon: ShieldCheck },
  medium: { ring: "border-gilt-300", bg: "bg-gilt-50", text: "text-gilt-700", icon: AlertTriangle },
  high: { ring: "border-danger-300", bg: "bg-danger-50", text: "text-danger-700", icon: AlertTriangle },
};

export function RiskIndicatorBadge({
  risk,
}: {
  risk: FinanceCategoryRiskIndicator;
}) {
  const tone = RISK_TONE[risk.level] ?? RISK_TONE.medium;
  const Icon = tone.icon;
  return (
    <div className={`rounded-2xl border ${tone.ring} ${tone.bg} p-5`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg} ring-1 ring-inset ${tone.ring}`}>
          <Icon className={`h-4 w-4 ${tone.text}`} />
        </span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tone.text}`}>
              {risk.level} risk
            </span>
          </div>
          <p className="mt-1 text-[14px] font-semibold leading-snug text-ink-900">
            {risk.label}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-700">
            {risk.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Infographic-style key stat cards -----------------------------------

export function KeyStatCard({
  label,
  value,
  unit,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
  hint?: string;
}) {
  const toneCls =
    tone === "good"
      ? "text-success-700"
      : tone === "warn"
      ? "text-gilt-700"
      : tone === "bad"
      ? "text-danger-700"
      : "text-ink-900";
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </p>
      <p className={`mt-2 font-sans text-[26px] font-semibold leading-none tracking-[-0.02em] ${toneCls}`}>
        {value}
        {unit ? (
          <span className="ml-1 font-mono text-[12px] text-ink-500">{unit}</span>
        ) : null}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11.5px] leading-[1.45] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

// ---- Lifestyle impact card -----------------------------------------------

export function LifestyleImpactCard({
  impact,
  currency,
}: {
  impact: FinanceCategoryLifestyleImpact;
  currency: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Lifestyle impact
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Mini label="Of take-home" value={`${impact.share_of_take_home_pct.toFixed(1)}%`} />
        <Mini label="Yearly" value={`${impact.annual_total.toLocaleString()} ${currency}`} />
        <Mini
          label="Runway if dropped"
          value={`+${impact.runway_months_if_eliminated.toFixed(1)} mo`}
        />
      </div>

      <p className="mt-4 text-[13px] leading-[1.6] text-ink-800">
        {impact.narrative}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </p>
      <p className="mt-1 font-sans text-[16px] font-semibold leading-none tracking-[-0.01em] text-ink-900">
        {value}
      </p>
    </div>
  );
}

// ---- Projection bars (baseline vs optimized) -----------------------------

export function ProjectionChart({
  points,
  currency,
}: {
  points: FinanceCategoryProjectionPoint[];
  currency: string;
}) {
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => Math.max(p.baseline, p.optimized))) || 1;
  const totalBaseline = points.reduce((s, p) => s + p.baseline, 0);
  const totalOptimized = points.reduce((s, p) => s + p.optimized, 0);
  const savings = Math.max(0, totalBaseline - totalOptimized);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Projection · baseline vs optimised
        </p>
        {savings > 0 ? (
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-success-700">
            <TrendingUp className="h-3.5 w-3.5" />
            ≈ {savings.toLocaleString()} {currency} saved over the run
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex h-44 items-end gap-3 overflow-x-auto pb-1">
        {points.map((p, i) => {
          const baselineH = Math.max(6, (p.baseline / max) * 100);
          const optimizedH = Math.max(6, (p.optimized / max) * 100);
          return (
            <div
              key={p.label + i}
              className="flex min-w-[60px] flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-36 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t bg-ink-300"
                  style={{ height: `${baselineH}%` }}
                  title={`Baseline: ${p.baseline.toLocaleString()} ${currency}`}
                />
                <div
                  className="w-1/2 rounded-t bg-success-500"
                  style={{ height: `${optimizedH}%` }}
                  title={`Optimised: ${p.optimized.toLocaleString()} ${currency}`}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink-300" /> Baseline
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success-500" /> Optimised
        </span>
      </div>
    </div>
  );
}
