import type { Metadata } from "next";
import Link from "next/link";
import { visa } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  AssumptionsList,
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  NextActionsList,
  PageHeader,
  RisksList,
  SummaryReasoning,
} from "@/components/backend/envelope-shell";

export const metadata: Metadata = { title: "Visa direction" };
export const dynamic = "force-dynamic";

export default async function VisaPage() {
  const { caseId } = await requirePrereqs();
  const row = await visa.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="03 · Visa direction"
          title="The route to your destination."
          description="Direction only — not legal advice. Confirm with a licensed adviser."
        />
        <Link href="/app/family" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Family →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="rounded-2xl border border-ink-900 bg-ink-900 p-6 text-parchment">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-300">Primary route</p>
              <h2 className="mt-2 font-sans text-[24px] font-semibold tracking-tight">
                {row.envelope.detail.primary_route.name}
                {row.envelope.detail.primary_route.code ? <span className="ml-2 font-mono text-[12px] text-white/60">{row.envelope.detail.primary_route.code}</span> : null}
              </h2>
              <div className="mt-4 grid gap-3 text-[13px] md:grid-cols-4">
                <Stat label="Difficulty" value={row.envelope.detail.primary_route.difficulty} />
                <Stat
                  label="Processing"
                  value={`${row.envelope.detail.primary_route.typical_processing_weeks_min}–${row.envelope.detail.primary_route.typical_processing_weeks_max} wk`}
                />
                <Stat label="Sponsor required" value={row.envelope.detail.primary_route.sponsor_required ? "Yes" : "No"} />
                <Stat label="Family friendly" value={row.envelope.detail.primary_route.family_friendly ? "Yes" : "No"} />
              </div>
              <p className="mt-4 text-[13px] leading-[1.6] text-white/80">{row.envelope.detail.primary_route.rationale}</p>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Requirements</h2>
              <ul className="space-y-1.5">
                {row.envelope.detail.primary_route.requirements.map((r, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[13px]">
                    <span className="text-ink-800">{r.label}</span>
                    <span className={"font-mono text-[10px] uppercase tracking-[0.18em] " + (r.user_meets ? "text-success-700" : r.user_meets === false ? "text-danger-700" : "text-ink-500")}>
                      {r.user_meets == null ? "unknown" : r.user_meets ? "you meet" : "not yet"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {row.envelope.detail.alternative_routes?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Alternative routes</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.alternative_routes.map((a, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <p className="text-[13.5px] font-semibold text-ink-900">{a.name} {a.code ? <span className="ml-1 font-mono text-[10px] text-ink-500">{a.code}</span> : null}</p>
                      <p className="mt-1 text-[12.5px] text-ink-600">{a.note}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {row.envelope.detail.blockers?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Blockers</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.blockers.map((b, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[13.5px] font-semibold text-ink-900">{b.label}</p>
                        <span className={"rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " + (b.fixable ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700")}>
                          {b.fixable ? "fixable" : "blocking"}
                        </span>
                      </div>
                      {b.window ? <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">window: {b.window}</p> : null}
                      {b.detail ? <p className="mt-1 text-[12.5px] text-ink-600">{b.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {row.envelope.detail.dependencies?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Dependencies</h2>
                <ul className="space-y-1.5">
                  {row.envelope.detail.dependencies.map((d, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[13px]">
                      <span>{d.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{d.status}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <RisksList risks={row.envelope.risks} />
            <NextActionsList actions={row.envelope.next_actions} />
            <AssumptionsList items={row.envelope.assumptions} />

            <section className="rounded-2xl border border-gilt-200 bg-gilt-50 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800">Legal disclaimer</p>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-gilt-900">{row.envelope.detail.legal_disclaimer}</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-1 text-[14px] font-semibold">{value}</p>
    </div>
  );
}
