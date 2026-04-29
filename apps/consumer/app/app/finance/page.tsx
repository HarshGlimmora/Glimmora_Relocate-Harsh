import type { Metadata } from "next";
import Link from "next/link";
import { finance } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  AssumptionsList,
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  NextActionsList,
  PageHeader,
  RisksList,
  ScoreCard,
  SummaryReasoning,
} from "@/components/backend/envelope-shell";

export const metadata: Metadata = { title: "Financial feasibility" };
export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const { caseId } = await requirePrereqs();
  const row = await finance.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="05 · Financial feasibility"
          title="The numbers, honestly."
          description="Take-home, monthly cost, surplus, runway — derived from your salary + destination."
        />
        <Link href="/app/documents" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Documents →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-4">
              <ScoreCard label="Affordability" value={row.envelope.detail.affordability_score} />
              <Stat label="Surplus / month" value={`${row.envelope.detail.surplus_or_deficit_monthly.toLocaleString()} ${row.envelope.detail.monthly_net.currency}`} />
              <Stat label="Salary / expense" value={row.envelope.detail.salary_to_expense_ratio.toFixed(2) + "×"} />
              <Stat label="Savings runway" value={`${row.envelope.detail.savings_runway_months} mo`} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Monthly net</p>
                <ul className="mt-3 space-y-1 text-[13px]">
                  <Row label="Gross" value={`${row.envelope.detail.monthly_net.gross_monthly.toLocaleString()} ${row.envelope.detail.monthly_net.currency}`} />
                  <Row label="Estimated tax" value={`${row.envelope.detail.monthly_net.estimated_tax_monthly.toLocaleString()} ${row.envelope.detail.monthly_net.currency}`} />
                  <Row label="Effective tax rate" value={`${row.envelope.detail.monthly_net.effective_tax_rate_pct}%`} />
                  <Row label="Take-home" value={`${row.envelope.detail.monthly_net.take_home_monthly.toLocaleString()} ${row.envelope.detail.monthly_net.currency}`} bold />
                </ul>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Monthly cost</p>
                <ul className="mt-3 space-y-1 text-[13px]">
                  {Object.entries(row.envelope.detail.monthly_cost)
                    .filter(([k, v]) => typeof v === "object" && v != null && "amount" in (v as object))
                    .map(([k, v]) => {
                      const c = v as { amount: number; currency: string; note?: string };
                      return <Row key={k} label={k} value={`${c.amount.toLocaleString()} ${c.currency}`} />;
                    })}
                  <Row
                    label="Total"
                    value={`${row.envelope.detail.monthly_cost.total_monthly.toLocaleString()} ${row.envelope.detail.monthly_cost.currency}`}
                    bold
                  />
                </ul>
              </div>
            </section>

            {row.envelope.detail.fx_notes?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">FX notes</h2>
                <ul className="space-y-1.5">
                  {row.envelope.detail.fx_notes.map((f, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3 text-[13px]">
                      <span className="font-semibold">{f.from} → {f.to}</span>{" "}
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{f.direction}</span>
                      <p className="mt-0.5 text-[12.5px] text-ink-600">{f.note}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {row.envelope.detail.risk_flags?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Risk flags</h2>
                <ul className="space-y-1.5">
                  {row.envelope.detail.risk_flags.map((r, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3 text-[13px]">
                      <span className={"rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " + (r.severity === "high" ? "bg-danger-50 text-danger-700" : "bg-gilt-50 text-gilt-700")}>{r.severity}</span>{" "}
                      <span className="font-semibold ml-1">{r.label}</span>
                      <p className="mt-0.5 text-[12.5px] text-ink-600">{r.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <RisksList risks={row.envelope.risks} />
            <NextActionsList actions={row.envelope.next_actions} />
            <AssumptionsList items={row.envelope.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <li className="flex items-center justify-between border-b border-ink-100 pb-1 last:border-0">
      <span className="text-ink-500 capitalize">{label.replace(/_/g, " ")}</span>
      <span className={bold ? "font-semibold text-ink-900" : "text-ink-800"}>{value}</span>
    </li>
  );
}
