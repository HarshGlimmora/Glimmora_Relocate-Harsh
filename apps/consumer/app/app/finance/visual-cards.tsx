/**
 * Visual cards for the Finance page.
 *
 * These mirror the Country page's pattern: SVG/div-based primitives,
 * tone palette of success / gilt / danger, monospace eyebrows, and
 * `rounded-2xl` info cards. No new chart library — same approach as
 * @/components/country/visual.tsx.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  FinanceCategoryKey,
  FinanceDetail,
  MonthlyCost,
  MonthlyNet,
  Risk,
} from "@/lib/backend/types";

// Categories that have an AI deep-dive detail page wired up. Click-through
// is enabled only for these keys; childcare/discretionary stay informational.
const DEEP_DIVE_CATEGORIES = new Set<string>([
  "housing",
  "utilities",
  "food",
  "transport",
  "healthcare",
]);

// ---- Section label (eyebrow above each grouped section) ----------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Affordability score card (the visual hero of the metric row) -----

export function AffordabilityScoreCard({ value }: { value: number }) {
  const tone =
    value >= 70
      ? { ring: "stroke-success-500", text: "text-success-700", bg: "bg-success-50", border: "border-success-300", verdict: "Comfortably affordable" }
      : value >= 50
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", bg: "bg-gilt-50", border: "border-gilt-300", verdict: "Tight but workable" }
      : { ring: "stroke-danger-500", text: "text-danger-700", bg: "bg-danger-50", border: "border-danger-300", verdict: "Stretched on paper" };

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div
      data-affordability-score={value}
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-4`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Affordability
      </p>
      <div className="mt-2 flex items-center gap-3">
        <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="fill-none stroke-white"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`fill-none ${tone.ring}`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div>
          <p className={`font-sans text-[28px] font-semibold leading-none ${tone.text}`}>
            {value}
            <span className="text-[12px] text-ink-400">/100</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-600">{tone.verdict}</p>
        </div>
      </div>
    </div>
  );
}

// ---- Generic key-metric card with tone-driven emphasis ----------------

type Tone = "good" | "warn" | "bad" | "neutral";

const TONE_PALETTE: Record<Tone, { border: string; bg: string; text: string; dot: string }> = {
  good: { border: "border-success-300", bg: "bg-success-50", text: "text-success-800", dot: "bg-success-500" },
  warn: { border: "border-gilt-300", bg: "bg-gilt-50", text: "text-gilt-800", dot: "bg-gilt-500" },
  bad: { border: "border-danger-300", bg: "bg-danger-50", text: "text-danger-800", dot: "bg-danger-500" },
  neutral: { border: "border-ink-200", bg: "bg-white", text: "text-ink-900", dot: "bg-ink-400" },
};

export function KeyMetricCard({
  label,
  value,
  unit,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
  hint?: string;
}) {
  const p = TONE_PALETTE[tone];
  return (
    <div
      data-key-metric={label}
      data-metric-tone={tone}
      className={`rounded-2xl border-2 ${p.border} ${p.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
      </div>
      <p className={`mt-2 font-sans text-[24px] font-semibold tracking-tight ${p.text}`}>
        {value}
        {unit ? <span className="ml-1 text-[13px] text-ink-500">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-600">{hint}</p> : null}
    </div>
  );
}

// ---- Money flow card: Gross → Tax → Take-home as a stacked bar -------

export function MoneyFlowCard({ net }: { net: MonthlyNet }) {
  const gross = Math.max(0, net.gross_monthly);
  const tax = Math.max(0, net.estimated_tax_monthly);
  const take = Math.max(0, net.take_home_monthly);
  const taxPct = gross > 0 ? Math.min(100, (tax / gross) * 100) : 0;
  const takePct = gross > 0 ? Math.min(100, (take / gross) * 100) : 0;

  return (
    <div
      data-money-flow
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Monthly net · how gross becomes take-home
      </p>

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Gross
          </p>
          <p className="mt-1 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
            {gross.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] text-ink-500">{net.currency}</p>
        </div>
        <span className="pb-2 text-ink-300">→</span>
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700">
            Tax
          </p>
          <p className="mt-1 font-sans text-[20px] font-semibold tracking-tight text-danger-700">
            −{tax.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] text-ink-500">
            {net.effective_tax_rate_pct}% rate
          </p>
        </div>
        <span className="pb-2 text-ink-300">→</span>
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-success-700">
            Take-home
          </p>
          <p className="mt-1 font-sans text-[20px] font-semibold tracking-tight text-success-700">
            {take.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] text-ink-500">{net.currency}</p>
        </div>
      </div>

      {/* Stacked composition bar */}
      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="absolute inset-y-0 left-0 bg-success-500"
            style={{ width: `${takePct}%` }}
            title={`Take-home ${takePct.toFixed(0)}%`}
          />
          <div
            className="absolute inset-y-0 bg-danger-400"
            style={{ left: `${takePct}%`, width: `${taxPct}%` }}
            title={`Tax ${taxPct.toFixed(0)}%`}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Take-home {takePct.toFixed(0)}%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger-400" />
            Tax {taxPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- Cost breakdown card: bar chart of categories --------------------

const COST_KEYS: { key: keyof MonthlyCost; label: string; tone: string }[] = [
  { key: "housing", label: "Housing", tone: "bg-lagoon-500" },
  { key: "utilities", label: "Utilities", tone: "bg-ink-500" },
  { key: "food", label: "Food", tone: "bg-success-500" },
  { key: "transport", label: "Transport", tone: "bg-gilt-500" },
  { key: "healthcare", label: "Healthcare", tone: "bg-danger-400" },
  { key: "childcare", label: "Childcare", tone: "bg-lagoon-400" },
  { key: "discretionary", label: "Discretionary", tone: "bg-ink-300" },
];

export function CostBreakdownCard({ cost }: { cost: MonthlyCost }) {
  const total = cost.total_monthly || 1;
  const ccy = cost.currency;

  type CostLineRow = {
    key: string;
    label: string;
    tone: string;
    amount: number;
    pct: number;
    note?: string;
  };
  const lines: CostLineRow[] = [];
  for (const { key, label, tone } of COST_KEYS) {
    const line = cost[key] as { amount: number; currency: string; note?: string } | undefined;
    if (!line || typeof line !== "object" || line.amount == null) continue;
    const pct = (line.amount / total) * 100;
    lines.push({ key: String(key), label, tone, amount: line.amount, pct, note: line.note });
  }

  return (
    <div
      data-cost-breakdown
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Monthly cost · where it goes
        </p>
        <p className="font-mono text-[11px] tabular-nums text-ink-700">
          {cost.total_monthly.toLocaleString()} {ccy}
        </p>
      </div>

      {/* Composite stacked bar — at-a-glance share */}
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-ink-100">
        {lines.map((l) => (
          <div
            key={l.key}
            className={l.tone}
            style={{ width: `${l.pct}%` }}
            title={`${l.label}: ${l.amount.toLocaleString()} ${ccy} (${l.pct.toFixed(0)}%)`}
            data-cost-segment={l.key}
          />
        ))}
      </div>

      {/* Per-category rows — clickable for categories with an AI deep-dive page */}
      <ul className="mt-4 space-y-1">
        {lines.map((l) => {
          const clickable = DEEP_DIVE_CATEGORIES.has(l.key);
          const rowInner = (
            <>
              <span className={`h-2.5 w-2.5 rounded-full ${l.tone}`} />
              <span className="w-24 truncate text-ink-700 group-hover:text-ink-900">
                {l.label}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={`absolute inset-y-0 left-0 ${l.tone}`}
                  style={{ width: `${l.pct}%` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-[11px] tabular-nums text-ink-700">
                {l.amount.toLocaleString()}
              </span>
              <span className="w-10 text-right font-mono text-[10px] tabular-nums text-ink-500">
                {l.pct.toFixed(0)}%
              </span>
              {clickable ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-ink-700"
                  aria-hidden
                />
              ) : (
                <span className="w-3.5" aria-hidden />
              )}
            </>
          );
          return (
            <li key={l.key} data-cost-row={l.key}>
              {clickable ? (
                <Link
                  href={`/app/finance/category/${l.key as FinanceCategoryKey}`}
                  className="group flex items-center gap-2 rounded-lg px-1.5 py-1 text-[12.5px] transition-colors hover:bg-ink-50"
                  aria-label={`Open ${l.label} cost deep-dive`}
                >
                  {rowInner}
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-1.5 py-1 text-[12.5px]">
                  {rowInner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
        Click any category for an AI deep-dive →
      </p>
    </div>
  );
}

// ---- FX note card -----------------------------------------------------

export function FXNoteCard({
  from,
  to,
  direction,
  note,
}: {
  from: string;
  to: string;
  direction: string;
  note: string;
}) {
  const dirLower = direction.toLowerCase();
  const tone =
    dirLower.includes("strength") || dirLower.includes("gain") || dirLower.includes("up")
      ? { border: "border-success-200", bg: "bg-success-50", chip: "bg-success-100 text-success-800", arrow: "text-success-600" }
      : dirLower.includes("weak") || dirLower.includes("loss") || dirLower.includes("down")
      ? { border: "border-danger-200", bg: "bg-danger-50", chip: "bg-danger-100 text-danger-800", arrow: "text-danger-600" }
      : { border: "border-ink-200", bg: "bg-white", chip: "bg-ink-100 text-ink-700", arrow: "text-ink-500" };

  return (
    <div
      data-fx-note
      data-fx-direction={direction}
      className={`rounded-2xl border ${tone.border} ${tone.bg} p-3.5`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-900">
          {from}
        </span>
        <span className={`font-mono text-[14px] ${tone.arrow}`}>→</span>
        <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-900">
          {to}
        </span>
        <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
          {direction}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.45] text-ink-700">{note}</p>
    </div>
  );
}

// ---- Risk flag card with severity-graded visual --------------------

export function RiskFlagCard({
  severity,
  label,
  detail,
}: {
  severity: string;
  label: string;
  detail: string;
}) {
  const sev = severity.toLowerCase();
  const tone =
    sev === "high"
      ? { border: "border-danger-300", bg: "bg-danger-50", chip: "bg-danger-100 text-danger-800", icon: "text-danger-600", icons: "!" }
      : sev === "medium"
      ? { border: "border-gilt-300", bg: "bg-gilt-50", chip: "bg-gilt-100 text-gilt-800", icon: "text-gilt-600", icons: "△" }
      : { border: "border-ink-200", bg: "bg-white", chip: "bg-ink-100 text-ink-700", icon: "text-ink-500", icons: "·" };

  return (
    <li
      data-risk-flag={sev}
      className={`rounded-2xl border ${tone.border} ${tone.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-sans text-[14px] font-bold ${tone.icon}`}
          aria-hidden="true"
        >
          {tone.icons}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
              {sev}
            </span>
            <p className="text-[13.5px] font-semibold text-ink-900">{label}</p>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-700">{detail}</p>
        </div>
      </div>
    </li>
  );
}

// ---- Risks card grid (severity-graded) -----------------------------

export function RisksCard({
  risks,
  label = "Risks · what could undo the plan",
}: {
  risks: Risk[];
  label?: string;
}) {
  if (!risks.length) return null;

  const severityCounts = risks.reduce(
    (acc, r) => {
      acc[r.severity] = (acc[r.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <section data-risks-card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>{label}</SectionLabel>
        <div className="flex items-center gap-1.5">
          {severityCounts.high ? (
            <span className="rounded-full bg-danger-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-danger-800">
              {severityCounts.high} high
            </span>
          ) : null}
          {severityCounts.medium ? (
            <span className="rounded-full bg-gilt-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
              {severityCounts.medium} med
            </span>
          ) : null}
          {severityCounts.low ? (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
              {severityCounts.low} low
            </span>
          ) : null}
        </div>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {risks.map((r, i) => (
          <RiskFlagCard key={i} severity={r.severity} label={r.label} detail={r.detail} />
        ))}
      </ul>
    </section>
  );
}

// ---- Next actions moved to ./next-actions-card.tsx (interactive timeline) ----

// ---- Reasoning card with collapsible long-form text ----------------

type FactorTone = "neutral" | "good" | "warn" | "bad" | "info";

const FACTOR_TONE: Record<FactorTone, { card: string; chip: string; value: string; iconWrap: string; iconColor: string }> = {
  neutral: { card: "border-ink-200 bg-white", chip: "bg-ink-100 text-ink-700", value: "text-ink-900", iconWrap: "bg-ink-50", iconColor: "text-ink-700" },
  good: { card: "border-success-200 bg-success-50/40", chip: "bg-success-100 text-success-800", value: "text-success-700", iconWrap: "bg-success-100", iconColor: "text-success-700" },
  warn: { card: "border-gilt-200 bg-gilt-50/40", chip: "bg-gilt-100 text-gilt-800", value: "text-gilt-700", iconWrap: "bg-gilt-100", iconColor: "text-gilt-700" },
  bad: { card: "border-danger-200 bg-danger-50/40", chip: "bg-danger-100 text-danger-800", value: "text-danger-700", iconWrap: "bg-danger-100", iconColor: "text-danger-700" },
  info: { card: "border-lagoon-200 bg-lagoon-50/40", chip: "bg-lagoon-100 text-lagoon-800", value: "text-lagoon-700", iconWrap: "bg-lagoon-100", iconColor: "text-lagoon-700" },
};

interface BreakdownFactor {
  key: string;
  icon: string;
  title: string;
  value: string;
  unit?: string;
  caption: string;
  tone: FactorTone;
}

function buildFactors(detail: FinanceDetail): BreakdownFactor[] {
  const ccy = detail.monthly_net.currency;
  const factors: BreakdownFactor[] = [
    {
      key: "salary",
      icon: "💼",
      title: "Salary estimate",
      value: detail.monthly_net.gross_monthly.toLocaleString(),
      unit: ccy + " / mo",
      caption: "Gross monthly pay used as the starting point",
      tone: "info",
    },
    {
      key: "tax",
      icon: "🧾",
      title: "Tax adjustment",
      value: `−${detail.monthly_net.estimated_tax_monthly.toLocaleString()}`,
      unit: `${ccy} · ${detail.monthly_net.effective_tax_rate_pct}% rate`,
      caption: "Tax pulled out of gross to get to take-home",
      tone: "bad",
    },
    {
      key: "takehome",
      icon: "💵",
      title: "Take-home",
      value: detail.monthly_net.take_home_monthly.toLocaleString(),
      unit: ccy + " / mo",
      caption: "What actually lands in your account each month",
      tone: "good",
    },
    {
      key: "cost",
      icon: "🛒",
      title: "Cost of living",
      value: detail.monthly_cost.total_monthly.toLocaleString(),
      unit: detail.monthly_cost.currency + " / mo",
      caption: "Total monthly outlay across housing, food, transport, etc.",
      tone: "warn",
    },
    {
      key: "savings",
      icon: "📈",
      title: "Monthly savings potential",
      value: `${detail.surplus_or_deficit_monthly >= 0 ? "+" : ""}${detail.surplus_or_deficit_monthly.toLocaleString()}`,
      unit: ccy + " / mo",
      caption: detail.surplus_or_deficit_monthly < 0
        ? "Negative — costs exceed take-home each month"
        : "Surplus left after covering monthly costs",
      tone: detail.surplus_or_deficit_monthly < 0 ? "bad" : detail.surplus_or_deficit_monthly < 200 ? "warn" : "good",
    },
  ];
  if (detail.fx_notes && detail.fx_notes.length > 0) {
    const top = detail.fx_notes[0];
    factors.push({
      key: "fx",
      icon: "💱",
      title: "Currency conversion",
      value: `${top.from} → ${top.to}`,
      unit: top.direction,
      caption: "FX context applied to bridge home currency to destination",
      tone: "info",
    });
  }
  return factors;
}

export function ReasoningCard({
  summary,
  reasoning,
  confidence,
  detail,
}: {
  summary: string;
  reasoning: string;
  confidence: number;
  detail?: FinanceDetail;
}) {
  const pct = Math.round(confidence * 100);
  const confTone =
    confidence >= 0.75 ? "bg-success-500" : confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";

  const factors = detail ? buildFactors(detail) : [];

  return (
    <section data-reasoning-card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>The story behind your number</SectionLabel>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${pct}%`}
        >
          <span className={`h-2 w-2 rounded-full ${confTone}`} />
          conf {pct}%
        </span>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {/* Headline summary */}
        <p
          data-reasoning-summary
          className="text-[14px] leading-[1.6] text-ink-800"
        >
          {summary}
        </p>

        {/* ============ Financial breakdown stack ============ */}
        {factors.length > 0 ? (
          <>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              How we got there · the moving pieces
            </p>

            {/* Horizontal scroll on small screens, responsive grid on larger */}
            <div
              data-breakdown-stack
              className="mt-3 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:px-0"
            >
              {factors.map((f) => {
                const tone = FACTOR_TONE[f.tone];
                return (
                  <div
                    key={f.key}
                    data-breakdown-factor={f.key}
                    className={`group min-w-[220px] shrink-0 snap-start rounded-2xl border ${tone.card} p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm md:min-w-0`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} text-[15px] ${tone.iconColor}`}
                      >
                        {f.icon}
                      </span>
                      <p className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink-900">
                        {f.title}
                      </p>
                    </div>
                    <p className={`mt-3 font-sans text-[18px] font-semibold leading-none ${tone.value}`}>
                      {f.value}
                      {f.unit ? (
                        <span className="ml-1.5 font-mono text-[10.5px] font-normal text-ink-500">
                          {f.unit}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 text-[11.5px] leading-[1.45] text-ink-600">
                      {f.caption}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {/* Collapsible long-form reasoning */}
        {reasoning ? (
          <details className="group mt-5">
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
