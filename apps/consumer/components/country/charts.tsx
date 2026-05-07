/**
 * Chart primitives for the country decision board.
 *
 * Pure SVG, no chart library, no client-only deps so these can render
 * during SSR and in tests. Each chart takes typed numeric data — none
 * of them ever fall back to placeholder values. If the data is empty
 * we render a small "no data" stub instead of a fake chart.
 */

import * as React from "react";

const PALETTE = ["#0F172A", "#0E7490", "#B45309", "#9D174D"] as const;

export interface LineSeries {
  /** Display label, shown in the legend. */
  label: string;
  /** y-values, one per x-tick. Must match `xLabels.length`. */
  values: number[];
  /** Optional override colour. Defaults to PALETTE rotation. */
  color?: string;
  /** Optional crossover x-index — vertical guide line. */
  highlightX?: number | null;
}

interface LineChartProps {
  xLabels: string[];
  series: LineSeries[];
  yMax?: number;
  yMin?: number;
  height?: number;
  caption?: string;
  testid?: string;
  /** Optional vertical-axis label shown rotated on the left margin. */
  yAxisLabel?: string;
  /** Optional X axis label centred under the chart. */
  xAxisLabel?: string;
}

/** Multi-series line chart. Real values only. */
export function LineChart({
  xLabels,
  series,
  yMin = 0,
  yMax = 100,
  height = 180,
  caption,
  testid,
  yAxisLabel,
  xAxisLabel,
}: LineChartProps) {
  if (xLabels.length === 0 || series.every((s) => s.values.length === 0)) {
    return (
      <div
        data-line-chart={testid}
        data-empty="true"
        className="rounded-xl border border-dashed border-ink-200 p-3 text-[12px] text-ink-500"
      >
        No data for this view.
      </div>
    );
  }
  const W = 600;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = height - padT - padB;
  const stepX = xLabels.length > 1 ? innerW / (xLabels.length - 1) : innerW;
  const yScale = (v: number) => {
    const r = (v - yMin) / Math.max(1, yMax - yMin);
    return padT + innerH - r * innerH;
  };
  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];
  return (
    <figure
      data-line-chart={testid}
      className="overflow-hidden rounded-xl border border-ink-200 bg-white p-3"
    >
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={caption ?? "line chart"}
        className="block w-full"
      >
        {/* axes */}
        <line
          x1={padL}
          y1={padT + innerH}
          x2={W - padR}
          y2={padT + innerH}
          stroke="#CBD5E1"
        />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#CBD5E1" />
        {/* y ticks */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={yScale(t)}
              x2={W - padR}
              y2={yScale(t)}
              stroke="#E5E7EB"
              strokeDasharray="2 4"
            />
            <text
              x={padL - 6}
              y={yScale(t) + 3}
              textAnchor="end"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill="#64748B"
            >
              {t}
            </text>
          </g>
        ))}
        {/* x labels */}
        {xLabels.map((lbl, i) => (
          <text
            key={i}
            x={padL + i * stepX}
            y={padT + innerH + 14}
            textAnchor={
              i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"
            }
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="#64748B"
          >
            {lbl}
          </text>
        ))}
        {/* series */}
        {series.map((s, sIdx) => {
          const color = s.color ?? PALETTE[sIdx % PALETTE.length];
          const points = s.values
            .map((v, i) => `${padL + i * stepX},${yScale(v)}`)
            .join(" ");
          return (
            <g key={s.label} data-line-series={s.label}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                points={points}
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={padL + i * stepX}
                  cy={yScale(v)}
                  r={2.5}
                  fill={color}
                />
              ))}
              {s.highlightX != null && s.highlightX >= 0 ? (
                <line
                  x1={padL + s.highlightX * stepX}
                  y1={padT}
                  x2={padL + s.highlightX * stepX}
                  y2={padT + innerH}
                  stroke={color}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  opacity={0.6}
                />
              ) : null}
            </g>
          );
        })}
        {/* axis labels */}
        {yAxisLabel ? (
          <text
            x={10}
            y={padT + innerH / 2}
            transform={`rotate(-90 10 ${padT + innerH / 2})`}
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="#64748B"
            textAnchor="middle"
          >
            {yAxisLabel}
          </text>
        ) : null}
        {xAxisLabel ? (
          <text
            x={padL + innerW / 2}
            y={height - 4}
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fill="#64748B"
            textAnchor="middle"
          >
            {xAxisLabel}
          </text>
        ) : null}
      </svg>
      <figcaption
        data-line-chart-legend
        className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-ink-700"
      >
        {series.map((s, i) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ backgroundColor: s.color ?? PALETTE[i % PALETTE.length] }}
            />
            {s.label}
          </span>
        ))}
        {caption ? (
          <span className="ml-auto text-ink-500">{caption}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}

// ---- Radar chart for lever composition --------------------------------

interface RadarChartProps {
  axes: string[];
  values: number[];
  max?: number;
  size?: number;
  caption?: string;
  testid?: string;
}

/** Simple radar chart for one country across N lever axes. */
export function RadarChart({
  axes,
  values,
  max = 100,
  size = 220,
  caption,
  testid,
}: RadarChartProps) {
  if (axes.length === 0 || values.length === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 24;
  const points = axes.map((_, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const v = Math.max(0, Math.min(max, values[i] ?? 0));
    const r = (v / max) * radius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      lblX: cx + Math.cos(angle) * (radius + 14),
      lblY: cy + Math.sin(angle) * (radius + 14),
      label: axes[i],
      value: v,
    };
  });
  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];
  return (
    <figure
      data-radar-chart={testid}
      className="rounded-xl border border-ink-200 bg-white p-3"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={caption ?? "radar chart"}
        className="block w-full"
      >
        {rings.map((r) => (
          <polygon
            key={r}
            fill="none"
            stroke="#E5E7EB"
            strokeDasharray="2 3"
            points={axes
              .map((_, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const x = cx + Math.cos(angle) * radius * r;
                const y = cy + Math.sin(angle) * radius * r;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ")}
          />
        ))}
        <polygon
          fill="rgba(15,23,42,0.10)"
          stroke="#0F172A"
          strokeWidth={1.5}
          points={polygon}
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={2.5} fill="#0F172A" />
        ))}
        {points.map((p) => (
          <text
            key={p.label}
            x={p.lblX}
            y={p.lblY}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="ui-monospace, monospace"
            fill="#334155"
          >
            {p.label}
            <tspan x={p.lblX} dy="11" fill="#64748B">
              {p.value}
            </tspan>
          </text>
        ))}
      </svg>
      {caption ? (
        <figcaption className="mt-1 text-center font-mono text-[10.5px] text-ink-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// ---- Multi-bar row (for dimension-winner reasoning) ------------------

interface MultiBarRowProps {
  rows: { label: string; value: number; highlighted?: boolean }[];
  max?: number;
  testid?: string;
}

/** Horizontal bar comparison — one row per country on a single dimension. */
export function MultiBarRow({ rows, max = 100, testid }: MultiBarRowProps) {
  return (
    <div data-multi-bar={testid} className="space-y-1">
      {rows.map((r) => {
        const pct = Math.max(0, Math.min(100, (r.value / max) * 100));
        return (
          <div
            key={r.label}
            data-bar-row={r.label}
            className="flex items-center gap-2 text-[12px]"
          >
            <span className="w-32 truncate text-ink-700" title={r.label}>
              {r.label}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className={
                  "absolute inset-y-0 left-0 " +
                  (r.highlighted ? "bg-ink-900" : "bg-ink-500")
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-ink-700">
              {r.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Threshold bar (for switchability matrix) ------------------------

interface ThresholdBarProps {
  threshold_pct: number | null;
  direction: "increase" | "decrease";
  /** Maximum % anchor for the bar width — typically 200. */
  max?: number;
}

export function ThresholdBar({
  threshold_pct,
  direction,
  max = 200,
}: ThresholdBarProps) {
  if (threshold_pct == null) {
    return (
      <div
        data-threshold-bar
        data-threshold-reachable="false"
        className="flex items-center gap-2 font-mono text-[10.5px] text-ink-500"
      >
        <span className="rounded-full border border-dashed border-ink-300 px-2 py-0.5">
          not reachable
        </span>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, (threshold_pct / max) * 100));
  const tone =
    threshold_pct <= 30
      ? "bg-success-500"
      : threshold_pct <= 80
      ? "bg-gilt-500"
      : "bg-danger-500";
  return (
    <div
      data-threshold-bar
      data-threshold-reachable="true"
      data-threshold-direction={direction}
      data-threshold-pct={threshold_pct}
      className="flex items-center gap-2"
    >
      <div className="relative h-2 w-32 overflow-hidden rounded-full bg-ink-100">
        <div className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-ink-700">
        {direction === "increase" ? "+" : "−"}
        {threshold_pct}%
      </span>
    </div>
  );
}
