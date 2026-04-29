import type { Metadata } from "next";
import Link from "next/link";
import { documents } from "@/lib/backend/client";
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

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { caseId } = await requirePrereqs();
  const row = await documents.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="06 · Documents"
          title="Your checklist."
          description="Generated from your destination + visa route + family shape."
        />
        <Link href="/app/workflow" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Workflow →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-4">
              <Tile label="Readiness" value={`${row.envelope.detail.readiness_percentage}%`} />
              <Tile label="Have" value={String(row.envelope.detail.have_count)} />
              <Tile label="Need" value={String(row.envelope.detail.need_count)} />
              <Tile label="Expiring" value={String(row.envelope.detail.expiring_count)} />
            </section>

            <section className="rounded-2xl border border-gilt-200 bg-gilt-50 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800">Next to handle</p>
              <p className="mt-1 text-[16px] font-semibold text-gilt-900">{row.envelope.detail.next_to_handle.label}</p>
              <p className="mt-1 text-[12.5px] text-gilt-900/80">{row.envelope.detail.next_to_handle.why}</p>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Checklist</h2>
              <ul className="space-y-1.5">
                {row.envelope.detail.items.map((it, i) => (
                  <li key={i} className="flex items-start justify-between rounded-xl border border-ink-200 bg-white p-3">
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink-900">{it.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                        {it.kind} · for: {it.required_for.join(", ") || "—"}
                      </p>
                      {it.notes ? <p className="mt-1 text-[12px] text-ink-600">{it.notes}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                          (it.status === "have"
                            ? "bg-success-50 text-success-700"
                            : it.status === "need"
                            ? "bg-danger-50 text-danger-700"
                            : it.status === "expiring"
                            ? "bg-gilt-50 text-gilt-800"
                            : "bg-ink-50 text-ink-600")
                        }
                      >
                        {it.status}
                      </span>
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">
                        {it.urgency}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {Object.keys(row.envelope.detail.required_for_summary).length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Required for</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(row.envelope.detail.required_for_summary).map(([k, kinds]) => (
                    <div key={k} className="rounded-xl border border-ink-200 bg-white p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">{k}</p>
                      <p className="mt-1 text-[12.5px] text-ink-700">{kinds.join(", ")}</p>
                    </div>
                  ))}
                </div>
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none text-ink-900">{value}</p>
    </div>
  );
}
