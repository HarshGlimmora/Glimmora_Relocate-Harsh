import type { Metadata } from "next";
import Link from "next/link";
import { synthesis } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  AssumptionsList,
  BlockedState,
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  NextActionsList,
  PageHeader,
  RisksList,
} from "@/components/backend/envelope-shell";
import { BackendApiError } from "@/lib/backend/client";

export const metadata: Metadata = { title: "Final synthesis" };
export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<string, string> = {
  go: "Go",
  go_with_conditions: "Go with conditions",
  wait: "Wait",
  reconsider: "Reconsider",
  blocked: "Blocked",
};

const VERDICT_TONE: Record<string, string> = {
  go: "bg-success-50 text-success-800 border-success-200",
  go_with_conditions: "bg-gilt-50 text-gilt-900 border-gilt-200",
  wait: "bg-ink-50 text-ink-800 border-ink-200",
  reconsider: "bg-danger-50 text-danger-800 border-danger-200",
  blocked: "bg-danger-100 text-danger-900 border-danger-300",
};

export default async function SynthesisPage() {
  const { caseId } = await requirePrereqs();

  let row;
  try {
    row = await synthesis.ensure(caseId);
  } catch (e) {
    if (e instanceof BackendApiError && e.status === 400) {
      return (
        <div className="mx-auto max-w-[860px] px-6 py-12">
          <PageHeader
            eyebrow="10 · Final synthesis"
            title="Run the upstream modules first."
          />
          <BlockedState
            message="Synthesis fuses the upstream analyses. Visit the modules above (country → job → visa → finance → documents) so synthesis has something to consume."
            actionHref="/app/country"
            actionLabel="Start at country comparison"
          />
        </div>
      );
    }
    throw e;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="10 · Final synthesis"
          title="Should you move?"
          description="Verdict, feasibility, recommended destination + job, top blockers, next best actions."
        />
        <Link href="/app" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">← Dashboard</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <section className={"rounded-2xl border p-6 " + (VERDICT_TONE[row.envelope.detail.verdict] ?? "")}>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em]">Verdict</p>
                  <h2 className="mt-2 font-sans text-[40px] font-semibold leading-none tracking-[-0.02em]">{VERDICT_LABEL[row.envelope.detail.verdict] ?? row.envelope.detail.verdict}</h2>
                  <p className="mt-2 text-[13.5px]">{row.envelope.detail.one_line_reasoning}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em]">Feasibility</p>
                  <p className="mt-2 font-sans text-[60px] font-semibold leading-none tracking-[-0.03em]">{row.envelope.detail.feasibility_score}<span className="text-[18px]">/100</span></p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Recommended destination</p>
                <p className="mt-2 text-[18px] font-semibold text-ink-900">{row.envelope.detail.recommended_destination.country}{row.envelope.detail.recommended_destination.city ? ` · ${row.envelope.detail.recommended_destination.city}` : ""}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">conf {Math.round(row.envelope.detail.recommended_destination.confidence * 100)}%</p>
                <p className="mt-2 text-[12.5px] text-ink-600">{row.envelope.detail.recommended_destination.rationale}</p>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Recommended job path</p>
                <p className="mt-2 text-[18px] font-semibold text-ink-900">{row.envelope.detail.recommended_job_path.title}{row.envelope.detail.recommended_job_path.industry ? ` · ${row.envelope.detail.recommended_job_path.industry}` : ""}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">conf {Math.round(row.envelope.detail.recommended_job_path.confidence * 100)}%</p>
                <p className="mt-2 text-[12.5px] text-ink-600">{row.envelope.detail.recommended_job_path.rationale}</p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Module scoreboard</h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {row.envelope.detail.module_scores.map((m) => (
                  <div key={m.kind} className={"rounded-xl border bg-white p-4 " + (m.available ? "border-ink-200" : "border-dashed border-ink-300 opacity-70")}>
                    <div className="flex items-center justify-between">
                      <p className="text-[13.5px] font-semibold text-ink-900">{m.label}</p>
                      <span className="font-mono text-[12px] text-ink-700">{m.score}/100</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-600">{m.summary}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">conf {Math.round(m.confidence * 100)}% {m.available ? "" : "· not run"}</p>
                  </div>
                ))}
              </div>
            </section>

            {row.envelope.detail.top_blockers.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Top blockers</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.top_blockers.map((b, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-ink-900">{b.label}</p>
                        <span className={"rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                          (b.severity === "high" ? "bg-danger-50 text-danger-700" : b.severity === "medium" ? "bg-gilt-50 text-gilt-700" : "bg-ink-50 text-ink-700")}>
                          {b.severity} · {b.source_module}
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-600">{b.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Next best actions</h2>
              <ol className="space-y-2">
                {row.envelope.detail.next_best_actions.map((a, i) => (
                  <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[13.5px] font-semibold text-ink-900">{a.label}</p>
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">{a.urgency} · {a.effort_hours}h</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-600">{a.why}</p>
                  </li>
                ))}
              </ol>
            </section>

            <details className="rounded-2xl border border-ink-200 bg-white p-5">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Show explanation</summary>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-[1.6] text-ink-700">{row.envelope.detail.explanation}</p>
            </details>

            <RisksList risks={row.envelope.risks} />
            <AssumptionsList items={row.envelope.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}
