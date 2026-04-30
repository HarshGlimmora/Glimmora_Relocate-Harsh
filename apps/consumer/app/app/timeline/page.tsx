import type { Metadata } from "next";
import Link from "next/link";
import { timeline } from "@/lib/backend/client";
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
  ValueLead,
  FailedValueLead,
  readyOrNull,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { TimelinePreferencesPanel } from "./timeline-panel";

export const metadata: Metadata = { title: "Timeline" };
export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await timeline.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const minWeeks = ready?.detail.estimated_total_weeks_min ?? 0;
  const maxWeeks = ready?.detail.estimated_total_weeks_max ?? 0;
  const start = ready?.detail.earliest_realistic_start_date ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="09 · Timeline"
          title="The earliest realistic start date."
          description="Phases, milestones, blockers, total weeks."
          intentFraming={framingFor("timeline", intent)}
        />
        <Link href="/app/synthesis" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Synthesis →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="Earliest realistic start"
            headline={
              start
                ? `${start} · ~${minWeeks}–${maxWeeks} weeks`
                : `${minWeeks}–${maxWeeks} weeks end to end`
            }
            detail={ready.summary}
            emphasis={maxWeeks <= 12 ? "good" : maxWeeks <= 24 ? "warn" : "bad"}
            cta={{ href: "/app/synthesis", text: "See the verdict" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <TimelinePreferencesPanel
          initialUrgency={(profile.move_urgency ?? "12m") as "asap" | "6m" | "12m" | "exploring"}
          initialStyle={
            (profile.priority_ranking ?? []).includes("speed" as never)
              ? "fast"
              : (profile.priority_ranking ?? []).includes("family" as never)
              ? "with_family"
              : "safe"
          }
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-3">
              <Tile label="Total weeks (min)" value={String(row.envelope.detail.estimated_total_weeks_min)} />
              <Tile label="Total weeks (max)" value={String(row.envelope.detail.estimated_total_weeks_max)} />
              <Tile label="Earliest start" value={row.envelope.detail.earliest_realistic_start_date} />
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Phases (start anchor: {row.envelope.detail.start_anchor})</h2>
              <ul className="space-y-2">
                {row.envelope.detail.phases.map((p) => (
                  <li key={p.id} className="rounded-xl border border-ink-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[13.5px] font-semibold text-ink-900">{p.label}</p>
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                        wk {p.start_week}–{p.end_week} · {p.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-600">{p.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Milestones</h2>
              <ul className="space-y-1.5">
                {row.envelope.detail.milestones.map((m) => {
                  const det = (row.envelope as { detail: typeof row.envelope.detail }).detail;
                  return (
                  <li key={m.id} className="flex items-start justify-between rounded-xl border border-ink-200 bg-white p-3">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-900">{m.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                        wk {m.target_week} · phase {m.phase_id}
                        {m.depends_on.length ? ` · depends on: ${m.depends_on.join(", ")}` : ""}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink-600">{m.why}</p>
                    </div>
                    {det.critical_milestones.includes(m.id) ? (
                      <span className="ml-3 rounded-full bg-gilt-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">critical</span>
                    ) : null}
                  </li>
                  );
                })}
              </ul>
            </section>

            {row.envelope.detail.blockers.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Blockers</h2>
                <ul className="space-y-1.5">
                  {row.envelope.detail.blockers.map((b, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-ink-900">{b.label}</p>
                        <span className={"rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                          (b.severity === "high" ? "bg-danger-50 text-danger-700"
                            : b.severity === "medium" ? "bg-gilt-50 text-gilt-700" : "bg-ink-50 text-ink-700")}>
                          {b.severity} · clear in ~{b.estimated_unblock_weeks}w
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-600">{b.detail}</p>
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-2 font-sans text-[24px] font-semibold tracking-tight text-ink-900">{value}</p>
    </div>
  );
}
