import type { Metadata } from "next";
import Link from "next/link";
import { workflow } from "@/lib/backend/client";
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

export const metadata: Metadata = { title: "Workflow & dependencies" };
export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const { caseId } = await requirePrereqs();
  const row = await workflow.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="07 · Workflow & dependencies"
          title="What depends on what."
          description="Nodes, edges, blockers, and the critical path through the move."
        />
        <Link href="/app/culture" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Culture →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-3">
              <Tile label="Total days (min)" value={String(row.envelope.detail.total_estimated_days_min)} />
              <Tile label="Total days (max)" value={String(row.envelope.detail.total_estimated_days_max)} />
              <Tile label="Blocked nodes" value={String(row.envelope.detail.blocked_node_ids.length)} tone={row.envelope.detail.blocked_node_ids.length ? "warn" : "ok"} />
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
                Critical path · current stage: <span className="text-ink-900">{row.envelope.detail.current_stage_node_id}</span>
              </h2>
              <ol className="flex flex-wrap items-center gap-2 text-[12.5px]">
                {row.envelope.detail.critical_path.map((nid, i) => {
                  const det = (row.envelope as { detail: typeof row.envelope.detail }).detail;
                  const n = det.nodes.find((x) => x.id === nid);
                  return (
                    <li key={nid} className="inline-flex items-center gap-2">
                      <span className={"rounded-full border px-2 py-0.5 " + (nid === det.current_stage_node_id ? "border-gilt-400 bg-gilt-50 text-gilt-900" : "border-ink-200 bg-white text-ink-700")}>
                        {n?.label ?? nid}
                      </span>
                      {i < det.critical_path.length - 1 ? <span className="text-ink-300">→</span> : null}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Nodes</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {row.envelope.detail.nodes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-ink-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-ink-900">{n.label}</p>
                      <span className={
                        "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                        (n.status === "blocked" ? "bg-danger-50 text-danger-700"
                          : n.status === "done" ? "bg-success-50 text-success-700"
                          : n.status === "in_progress" ? "bg-gilt-50 text-gilt-800"
                          : "bg-ink-50 text-ink-600")
                      }>{n.status}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {n.category} · {n.owner} · {n.estimated_duration_days_min}-{n.estimated_duration_days_max}d
                    </p>
                    {n.description ? <p className="mt-1 text-[12px] text-ink-600">{n.description}</p> : null}
                    {n.blocked_reason ? <p className="mt-1 text-[12px] text-danger-700">{n.blocked_reason}</p> : null}
                  </li>
                ))}
              </ul>
            </section>

            {row.envelope.detail.edges.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Dependencies</h2>
                <ul className="space-y-1.5 text-[12.5px]">
                  {row.envelope.detail.edges.map((e, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">
                      <p>
                        <span className="font-semibold">{e.from_node}</span>
                        <span className="mx-2 text-ink-400">→</span>
                        <span className="font-semibold">{e.to_node}</span>
                        {!e.hard ? <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">soft</span> : null}
                      </p>
                      <p className="mt-0.5 text-ink-600">{e.reason}</p>
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

function Tile({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className={"mt-2 font-sans text-[28px] font-semibold leading-none " + (tone === "warn" ? "text-danger-700" : "text-ink-900")}>{value}</p>
    </div>
  );
}
