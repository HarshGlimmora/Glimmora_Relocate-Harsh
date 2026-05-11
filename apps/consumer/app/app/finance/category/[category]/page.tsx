import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { financeCategory } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  EnvelopeMeta,
  FailedEnvelopeView,
  FailedValueLead,
  PageHeader,
  ValueLead,
  readyOrNull,
} from "@/components/backend/envelope-shell";
import { AssumptionsCard } from "../../assumptions-card";
import { NextActionsCard } from "../../next-actions-card";
import { RisksCard } from "../../visual-cards";
import type { FailedEnvelope } from "@/lib/backend/types";
import {
  CostBreakdownDonut,
  KeyStatCard,
  LifestyleImpactCard,
  MarketComparisonBar,
  OptimizationTipCard,
  ProjectionChart,
  RiskIndicatorBadge,
  SectionLabel,
} from "./visual-cards";
import type { FinanceCategoryKey } from "@/lib/backend/types";

// The five categories that have an AI deep-dive page. Anything else 404s
// so we don't accidentally serve a half-broken page for a typo'd slug.
const CATEGORY_KEYS = [
  "housing",
  "utilities",
  "food",
  "transport",
  "healthcare",
] as const satisfies readonly FinanceCategoryKey[];

const CATEGORY_LABELS: Record<FinanceCategoryKey, string> = {
  housing: "Housing",
  utilities: "Utilities",
  food: "Food",
  transport: "Transport",
  healthcare: "Healthcare",
};

const CATEGORY_DESCRIPTIONS: Record<FinanceCategoryKey, string> = {
  housing: "Rent, deposits, agency fees, household setup — the biggest line on most expat budgets.",
  utilities: "Electricity, gas, water, internet, mobile — the recurring infrastructure of daily life.",
  food: "Groceries, eating out, coffee, alcohol — the spend that adapts fastest to lifestyle choices.",
  transport: "Public transit, fuel, ride-share, the occasional inter-city — your mobility budget.",
  healthcare: "Insurance premiums, co-pays, dental, vision — what you pay to stay covered.",
};

function isCategoryKey(s: string): s is FinanceCategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(s);
}

interface PageProps {
  params: { category: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const cat = params.category;
  if (!isCategoryKey(cat)) return { title: "Cost detail" };
  return { title: `${CATEGORY_LABELS[cat]} — financial deep-dive` };
}

export const dynamic = "force-dynamic";

export default async function FinanceCategoryDetailPage({ params }: PageProps) {
  const { category } = params;
  if (!isCategoryKey(category)) {
    notFound();
  }
  const { caseId, intent } = await requirePrereqs();
  const row = await financeCategory.ensure(caseId, category);
  const ready = readyOrNull(row.envelope);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      {/* Breadcrumb + header */}
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
        <Link href="/app/finance" className="hover:text-ink-900">
          Finance
        </Link>
        <span aria-hidden>·</span>
        <span className="text-ink-700">{CATEGORY_LABELS[category]}</span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow={`04 · Finance · ${CATEGORY_LABELS[category]}`}
          title={`Where your ${CATEGORY_LABELS[category].toLowerCase()} money goes.`}
          description={CATEGORY_DESCRIPTIONS[category]}
        />
        <Link
          href="/app/finance"
          className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
        >
          ← Back to finance
        </Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label={`${CATEGORY_LABELS[category]} stress-test`}
            headline={
              <>
                {ready.detail.monthly_total.toLocaleString()} {ready.detail.currency}
                <span className="ml-3 text-[15px] font-mono opacity-70">
                  · {ready.detail.lifestyle_impact.share_of_take_home_pct.toFixed(1)}% of take-home · P{ready.detail.market_comparison.percentile}
                </span>
              </>
            }
            detail={ready.summary}
            emphasis={
              ready.detail.risk_indicator.level === "high"
                ? "bad"
                : ready.detail.risk_indicator.level === "medium"
                ? "warn"
                : "good"
            }
          />
        ) : (
          <FailedValueLead
            envelope={row.envelope}
            retryHref="/app/finance"
            retryLabel="Re-run the finance analysis"
          />
        )}

        {!ready ? (
          <FailedEnvelopeView envelope={row.envelope as FailedEnvelope} />
        ) : (
          <>
            {/* Infographic-style headline stats */}
            <section>
              <SectionLabel>The numbers</SectionLabel>
              <div className="grid gap-3 md:grid-cols-4">
                <KeyStatCard
                  label="Monthly"
                  value={ready.detail.monthly_total.toLocaleString()}
                  unit={ready.detail.currency}
                  tone="neutral"
                  hint="Total for this category"
                />
                <KeyStatCard
                  label="% of take-home"
                  value={ready.detail.lifestyle_impact.share_of_take_home_pct.toFixed(1)}
                  unit="%"
                  tone={
                    ready.detail.lifestyle_impact.share_of_take_home_pct >= 40
                      ? "bad"
                      : ready.detail.lifestyle_impact.share_of_take_home_pct >= 25
                      ? "warn"
                      : "good"
                  }
                  hint="Share of your monthly net"
                />
                <KeyStatCard
                  label="Market percentile"
                  value={`P${ready.detail.market_comparison.percentile}`}
                  tone={
                    ready.detail.market_comparison.percentile >= 75
                      ? "bad"
                      : ready.detail.market_comparison.percentile >= 50
                      ? "warn"
                      : "good"
                  }
                  hint="0 = cheap end, 100 = top of market"
                />
                <KeyStatCard
                  label="Annual"
                  value={ready.detail.lifestyle_impact.annual_total.toLocaleString()}
                  unit={ready.detail.currency}
                  tone="neutral"
                  hint="What this costs you per year"
                />
              </div>
            </section>

            {/* Cost breakdown — donut + legend */}
            <section>
              <SectionLabel>1 · Cost breakdown</SectionLabel>
              <CostBreakdownDonut
                items={ready.detail.cost_breakdown}
                currency={ready.detail.currency}
                total={ready.detail.monthly_total}
              />
            </section>

            {/* Market comparison + risk badge side-by-side */}
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <SectionLabel>2 · Market comparison</SectionLabel>
                <MarketComparisonBar data={ready.detail.market_comparison} />
              </div>
              <div>
                <SectionLabel>4 · Risk indicator</SectionLabel>
                <RiskIndicatorBadge risk={ready.detail.risk_indicator} />
              </div>
            </section>

            {/* Optimisation tips grid */}
            <section>
              <SectionLabel>3 · Optimisation suggestions</SectionLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {ready.detail.optimization_tips.map((t, i) => (
                  <OptimizationTipCard
                    key={t.label + i}
                    tip={t}
                    currency={ready.detail.currency}
                  />
                ))}
              </div>
            </section>

            {/* Lifestyle impact narrative */}
            <section>
              <SectionLabel>5 · Lifestyle impact</SectionLabel>
              <LifestyleImpactCard
                impact={ready.detail.lifestyle_impact}
                currency={ready.detail.currency}
              />
            </section>

            {/* Projection chart */}
            <section>
              <SectionLabel>Projection · savings if optimised</SectionLabel>
              <ProjectionChart
                points={ready.detail.projection}
                currency={ready.detail.currency}
              />
            </section>

            <RisksCard risks={ready.risks} />
            <NextActionsCard actions={ready.next_actions} />
            <AssumptionsCard items={ready.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}
