import type { Metadata } from "next";
import Link from "next/link";
import { finance } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  PageHeader,
  ValueLead,
  FailedValueLead,
  readyOrNull,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { FinanceSensitivityPanel } from "./finance-panel";
import { AssumptionsCard } from "./assumptions-card";
import { NextActionsCard } from "./next-actions-card";
import {
  AffordabilityScoreCard,
  CostBreakdownCard,
  FXNoteCard,
  KeyMetricCard,
  MoneyFlowCard,
  ReasoningCard,
  RiskFlagCard,
  RisksCard,
  SectionLabel,
} from "./visual-cards";

export const metadata: Metadata = { title: "Financial feasibility" };
export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await finance.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const surplus = ready?.detail.surplus_or_deficit_monthly ?? 0;
  const ccy = ready?.detail.monthly_net.currency ?? "EUR";
  const aff = ready?.detail.affordability_score ?? 0;
  const runway = ready?.detail.savings_runway_months ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="04 · Financial feasibility"
          title="Affordable comfortably, or only on paper?"
          description="Take-home, monthly cost, surplus, runway — derived from your salary + destination."
          intentFraming={framingFor("finance", intent)}
        />
        <Link href="/app/documents" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Documents →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="Monthly stress test"
            headline={
              <>
                {surplus >= 0 ? "+" : ""}
                {surplus.toLocaleString()} {ccy}
                <span className="ml-3 text-[15px] font-mono opacity-70">
                  · {runway} mo runway · score {aff}/100
                </span>
              </>
            }
            detail={ready.summary}
            emphasis={surplus < 0 ? "bad" : aff >= 65 ? "good" : "warn"}
            cta={{ href: "/app/documents", text: "What you'll need on paper" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <FinanceSensitivityPanel
          initialMonthlyBudget=""
          initialSavings={profile.relocation_budget?.toString() ?? ""}
          initialRent=""
          initialFamilySize=""
          initialSensitivity="medium"
          initialCurrency={profile.salary_currency ?? "EUR"}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* Headline metrics — visual score plus the three numerical anchors */}
            <section>
              <SectionLabel>The four numbers that matter</SectionLabel>
              <div className="grid gap-3 md:grid-cols-4">
                <AffordabilityScoreCard value={row.envelope.detail.affordability_score} />
                <KeyMetricCard
                  label="Surplus / month"
                  value={`${row.envelope.detail.surplus_or_deficit_monthly >= 0 ? "+" : ""}${row.envelope.detail.surplus_or_deficit_monthly.toLocaleString()}`}
                  unit={row.envelope.detail.monthly_net.currency}
                  tone={row.envelope.detail.surplus_or_deficit_monthly < 0 ? "bad" : row.envelope.detail.surplus_or_deficit_monthly < 200 ? "warn" : "good"}
                  hint={row.envelope.detail.surplus_or_deficit_monthly < 0 ? "Cash burn — costs exceed take-home" : "Buffer left over after monthly costs"}
                />
                <KeyMetricCard
                  label="Salary / expense"
                  value={row.envelope.detail.salary_to_expense_ratio.toFixed(2)}
                  unit="×"
                  tone={row.envelope.detail.salary_to_expense_ratio >= 1.5 ? "good" : row.envelope.detail.salary_to_expense_ratio >= 1.1 ? "warn" : "bad"}
                  hint="Pay covers costs this many times over"
                />
                <KeyMetricCard
                  label="Savings runway"
                  value={row.envelope.detail.savings_runway_months.toString()}
                  unit="mo"
                  tone={row.envelope.detail.savings_runway_months >= 6 ? "good" : row.envelope.detail.savings_runway_months >= 3 ? "warn" : "bad"}
                  hint="Months you could float with zero income"
                />
              </div>
            </section>

            <ReasoningCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              detail={row.envelope.detail}
            />

            {/* Visual money-flow + cost breakdown */}
            <section className="grid gap-4 md:grid-cols-2">
              <MoneyFlowCard net={row.envelope.detail.monthly_net} />
              <CostBreakdownCard cost={row.envelope.detail.monthly_cost} />
            </section>

            {row.envelope.detail.fx_notes?.length ? (
              <section>
                <SectionLabel>FX notes · how currencies move on this route</SectionLabel>
                <div className="grid gap-2 md:grid-cols-2">
                  {row.envelope.detail.fx_notes.map((f, i) => (
                    <FXNoteCard
                      key={i}
                      from={f.from}
                      to={f.to}
                      direction={f.direction}
                      note={f.note}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {row.envelope.detail.risk_flags?.length ? (
              <section>
                <SectionLabel>Risk flags · what could undo the math</SectionLabel>
                <ul className="grid gap-2 md:grid-cols-2">
                  {row.envelope.detail.risk_flags.map((r, i) => (
                    <RiskFlagCard
                      key={i}
                      severity={r.severity}
                      label={r.label}
                      detail={r.detail}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            <RisksCard risks={row.envelope.risks} />
            <NextActionsCard actions={row.envelope.next_actions} />
            <AssumptionsCard items={row.envelope.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}
