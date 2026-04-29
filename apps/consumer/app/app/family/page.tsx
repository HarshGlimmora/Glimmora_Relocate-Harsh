import type { Metadata } from "next";
import Link from "next/link";
import { family } from "@/lib/backend/client";
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

export const metadata: Metadata = { title: "Family relocation" };
export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const { caseId } = await requirePrereqs();
  const row = await family.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="04 · Family relocation"
          title="For everyone moving with you."
          description="Spouse, children, parents, housing fit — what changes for the household."
        />
        <Link href="/app/finance" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Finance →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Mode</p>
                <p className="mt-2 font-sans text-[20px] font-semibold text-ink-900">{row.envelope.detail.mode === "with_family" ? "With family" : "Solo"}</p>
              </div>
              <ScoreCard label="Household complexity" value={row.envelope.detail.household_complexity_score} />
              <ScoreCard label="Family-fit score" value={row.envelope.score} />
            </section>

            {row.envelope.detail.spouse_outlook ? (
              <SubCard title="Spouse outlook">
                <KV k="Work authorisation" v={row.envelope.detail.spouse_outlook.work_authorisation} />
                <KV k="Career continuity" v={row.envelope.detail.spouse_outlook.career_continuity} />
                <p className="mt-2 text-[12.5px] text-ink-600">{row.envelope.detail.spouse_outlook.note}</p>
              </SubCard>
            ) : null}

            {row.envelope.detail.child_outlooks?.length ? (
              <SubCard title="Children outlook">
                <ul className="space-y-2">
                  {row.envelope.detail.child_outlooks.map((c, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-parchment/40 p-3 text-[13px]">
                      <p className="font-semibold text-ink-900">Age {c.age} · {c.schooling_recommendation}</p>
                      <p className="mt-1 text-[12.5px] text-ink-600">{c.adaptation_note}</p>
                    </li>
                  ))}
                </ul>
              </SubCard>
            ) : null}

            {row.envelope.detail.parents_outlook ? (
              <SubCard title="Parents outlook">
                <KV k="Healthcare sensitivity" v={row.envelope.detail.parents_outlook.healthcare_sensitivity} />
                <KV k="Visa path" v={row.envelope.detail.parents_outlook.visa_path} />
                <p className="mt-2 text-[12.5px] text-ink-600">{row.envelope.detail.parents_outlook.note}</p>
              </SubCard>
            ) : null}

            {row.envelope.detail.housing_fit ? (
              <SubCard title="Housing fit">
                <KV k="Fit" v={row.envelope.detail.housing_fit.fit} />
                <p className="mt-2 text-[12.5px] text-ink-600">{row.envelope.detail.housing_fit.note}</p>
              </SubCard>
            ) : null}

            {row.envelope.detail.family_warnings?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Warnings</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.family_warnings.map((w, i) => (
                    <li key={i} className="rounded-xl border border-gilt-200 bg-gilt-50 p-3">
                      <p className="text-[13px] font-semibold text-gilt-900">{w.label}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-700">affects: {w.affects}</p>
                      <p className="mt-1 text-[12.5px] text-gilt-900/80">{w.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {row.envelope.detail.family_suggestions?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Suggestions</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.family_suggestions.map((s, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[13.5px] font-semibold text-ink-900">{s.label}</p>
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">{s.urgency}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-600">{s.detail}</p>
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

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{title}</p>
      <div className="mt-3 space-y-1.5">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-500">{k}</span>
      <span className="font-semibold text-ink-900">{v}</span>
    </div>
  );
}
