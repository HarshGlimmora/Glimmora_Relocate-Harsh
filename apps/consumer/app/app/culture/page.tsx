import type { Metadata } from "next";
import Link from "next/link";
import { culture } from "@/lib/backend/client";
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
import { CulturePreferencesPanel } from "./culture-panel";

export const metadata: Metadata = { title: "Culture & language" };
export const dynamic = "force-dynamic";

export default async function CulturePage() {
  const { caseId, intent } = await requirePrereqs();
  const row = await culture.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const langReq = ready?.detail.language?.proficiency_target ?? null;
  const firstDo = ready?.detail.first_week_kit?.[0]?.label ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="07 · Culture & language"
          title="What to nail in your first week."
          description="Workplace norms, daily life, language basics, dos and don'ts."
          intentFraming={framingFor("culture", intent)}
        />
        <Link href="/app" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Back to dashboard →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="First-week priority"
            headline={firstDo ? firstDo : "Cultural fit guidance"}
            detail={
              langReq && langReq !== "none"
                ? `Language target: ${langReq}. ${ready.summary}`
                : ready.summary
            }
            emphasis="neutral"
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <CulturePreferencesPanel
          initialConcern={(langReq && langReq !== "none") ? "language" : "workplace"}
          initialLangConfidence={(langReq ?? "none") as "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2"}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Workplace norms</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3 text-[13px]">
                <KV k="Communication style" v={row.envelope.detail.workplace_norms.communication_style} />
                <KV k="Hierarchy" v={row.envelope.detail.workplace_norms.hierarchy_note} />
                <KV k="Meeting etiquette" v={row.envelope.detail.workplace_norms.meeting_etiquette} />
                {row.envelope.detail.workplace_norms.dress_code ? <KV k="Dress code" v={row.envelope.detail.workplace_norms.dress_code} /> : null}
                {row.envelope.detail.workplace_norms.punctuality ? <KV k="Punctuality" v={row.envelope.detail.workplace_norms.punctuality} /> : null}
                {row.envelope.detail.workplace_norms.feedback_culture ? <KV k="Feedback culture" v={row.envelope.detail.workplace_norms.feedback_culture} /> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
                Language: {row.envelope.detail.language.primary_language} · target {row.envelope.detail.language.proficiency_target} · English usability {row.envelope.detail.language.english_usability_score}/100
              </p>
              <p className="mt-2 text-[13px] text-ink-700">{row.envelope.detail.language.rationale}</p>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {row.envelope.detail.language.basic_phrases.map((p, i) => (
                  <li key={i} className="rounded-xl border border-ink-200 bg-parchment/40 p-3 text-[13px]">
                    <p className="font-semibold text-ink-900">{p.phrase}</p>
                    <p className="mt-0.5 text-ink-600">{p.translation}</p>
                    {p.usage ? <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{p.usage}</p> : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Daily life</p>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {row.envelope.detail.daily_life.map((d, i) => (
                    <li key={i}><span className="font-semibold text-ink-900">{d.topic}:</span> <span className="text-ink-700">{d.note}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">First-week kit</p>
                <ul className="mt-2 space-y-2 text-[13px]">
                  {row.envelope.detail.first_week_kit.map((k, i) => (
                    <li key={i} className="rounded-lg border border-ink-100 bg-parchment/40 p-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-ink-900">{k.label}</p>
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">{k.priority} · {k.effort_hours}h</span>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-600">{k.why}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Do · Don't</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {row.envelope.detail.dos_and_donts.map((d, i) => (
                  <li key={i} className="rounded-xl border border-ink-200 bg-white p-3 text-[13px]">
                    <p><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success-700">do:</span> <span className="text-ink-800">{d.do}</span></p>
                    <p className="mt-1"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700">don't:</span> <span className="text-ink-800">{d.dont}</span></p>
                  </li>
                ))}
              </ul>
            </section>

            {row.envelope.detail.family_adaptation_notes?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Family adaptation notes</h2>
                <ul className="space-y-1 text-[13px]">
                  {row.envelope.detail.family_adaptation_notes.map((n, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">{n}</li>
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

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-parchment/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{k}</p>
      <p className="mt-1 text-ink-800">{v}</p>
    </div>
  );
}
