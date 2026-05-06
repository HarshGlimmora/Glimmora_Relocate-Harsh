/**
 * Visual primitives for the country decision board.
 *
 * Lean SVG / divs only — no chart library. Each component is small
 * enough to read in one glance and exposes `data-*` hooks for tests.
 */

import * as React from "react";

// ---- Score strip: horizontal bar of all metrics for one country ----

const METRIC_LABELS: { key: string; short: string }[] = [
  { key: "job_market", short: "Jobs" },
  { key: "salary_power", short: "Pay" },
  { key: "employer_sponsor_density", short: "Sponsors" },
  { key: "visa_friction", short: "Visa" },
  { key: "speed_to_land", short: "Speed" },
  { key: "cost_of_living", short: "Cost" },
  { key: "housing_pressure", short: "Housing" },
  { key: "quality_of_life", short: "QoL" },
  { key: "family_fit", short: "Family" },
  { key: "language_fit", short: "Lang" },
];

export function ScoreStrip({
  breakdown,
  testid,
}: {
  breakdown: Record<string, number>;
  testid?: string;
}) {
  return (
    <div
      data-score-strip={testid}
      className="grid grid-cols-10 gap-1"
    >
      {METRIC_LABELS.map(({ key, short }) => {
        const v = Math.max(0, Math.min(100, breakdown[key] ?? 0));
        const tone =
          v >= 70 ? "bg-success-500" : v >= 50 ? "bg-gilt-500" : "bg-danger-500";
        return (
          <div
            key={key}
            title={`${short}: ${v}/100`}
            className="flex flex-col items-center gap-0.5"
            data-metric={key}
          >
            <div className="relative h-12 w-full overflow-hidden rounded-sm bg-ink-100">
              <div
                className={`absolute bottom-0 left-0 right-0 ${tone}`}
                style={{ height: `${v}%` }}
              />
            </div>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-500">
              {short}
            </span>
            <span className="font-mono text-[9px] tabular-nums text-ink-700">
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Score bar (single thin row, e.g. for transition deltas) ----

export function ScoreBar({
  value,
  label,
  width = 100,
  testid,
}: {
  value: number;
  label?: string;
  width?: number;
  testid?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v >= 70 ? "bg-success-500" : v >= 50 ? "bg-gilt-500" : "bg-danger-500";
  return (
    <div
      data-score-bar={testid}
      className="flex items-center gap-2 text-[12px]"
      style={{ width }}
    >
      {label ? <span className="text-ink-600 w-20 truncate">{label}</span> : null}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className={`absolute inset-y-0 left-0 ${tone}`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[11px] tabular-nums text-ink-700">
        {v}
      </span>
    </div>
  );
}

// ---- Delta pill (transition strip) ----

export function DeltaPill({
  delta,
  metric,
}: {
  delta: number;
  metric: string;
}) {
  const tone =
    delta > 4
      ? "border-success-300 bg-success-50 text-success-800"
      : delta < -4
      ? "border-danger-300 bg-danger-50 text-danger-800"
      : "border-ink-200 bg-white text-ink-600";
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      data-delta-pill
      data-delta-direction={delta > 4 ? "gain" : delta < -4 ? "loss" : "same"}
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px] " +
        tone
      }
    >
      <span className="font-semibold tabular-nums">
        {sign}
        {delta}
      </span>
      <span className="text-[10px] uppercase tracking-[0.16em]">{metric}</span>
    </span>
  );
}

// ---- Rank badge ----

export function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-ink-900 text-parchment border-ink-900"
      : rank === 2
      ? "bg-white text-ink-900 border-ink-900"
      : "bg-white text-ink-600 border-ink-300";
  return (
    <span
      data-rank={rank}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold tabular-nums " +
        tone
      }
    >
      {rank}
    </span>
  );
}

// ---- Confidence dot ----

export function ConfidenceDot({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.75
      ? "bg-success-500"
      : value >= 0.55
      ? "bg-gilt-500"
      : "bg-danger-500";
  return (
    <span
      data-confidence={pct}
      title={`Confidence ${pct}%`}
      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500"
    >
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      conf {pct}%
    </span>
  );
}

// ---- Weight slider (1–5 rating) ----

export function WeightSlider({
  label,
  value,
  onChange,
  testid,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  testid: string;
}) {
  return (
    <div data-weight={testid} className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-800">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-ink-700">{value}/5</span>
      </div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              data-weight-step={n}
              data-weight-active={active ? "true" : "false"}
              className={
                "h-2 flex-1 rounded-full transition-colors " +
                (active ? "bg-ink-900" : "bg-ink-100 hover:bg-ink-200")
              }
              aria-label={`${label} weight ${n}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---- Fingerprint badge ----

const STYLE_TONES: Record<string, string> = {
  career_first: "border-lagoon-300 bg-lagoon-50 text-lagoon-900",
  cost_sensitive: "border-gilt-300 bg-gilt-50 text-gilt-900",
  family_heavy: "border-success-300 bg-success-50 text-success-900",
  speed_driven: "border-danger-300 bg-danger-50 text-danger-900",
  visa_risk_averse: "border-ink-300 bg-ink-50 text-ink-900",
  lifestyle_focused: "border-success-300 bg-success-50 text-success-900",
  balanced: "border-ink-200 bg-white text-ink-700",
};

export function FingerprintBadge({
  style,
  label,
  oneLine,
  weights,
}: {
  style: string;
  label: string;
  oneLine: string;
  weights: Record<string, number>;
}) {
  const tone = STYLE_TONES[style] ?? STYLE_TONES.balanced;
  return (
    <section
      data-decision-fingerprint
      data-fingerprint-style={style}
      className={"rounded-2xl border-2 px-4 py-3 " + tone}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            Your decision fingerprint
          </p>
          <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em]">
            {label}
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.4] opacity-80">{oneLine}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {Object.entries(weights)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k, v]) => (
              <span
                key={k}
                data-fp-weight={k}
                className="rounded-full bg-white/60 px-2 py-0.5 font-mono text-[10px] tabular-nums"
              >
                {k}: {Math.round(v * 100)}%
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
