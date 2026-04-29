import type { Metadata } from "next";
import Link from "next/link";
import { jobfit } from "@/lib/backend/client";
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

export const metadata: Metadata = { title: "Job fit" };
export const dynamic = "force-dynamic";

export default async function JobFitPage() {
  const { caseId } = await requirePrereqs();
  const row = await jobfit.ensure(caseId);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="02 · Job fit"
          title="Where your career lands."
          description="Role match, salary realism, sponsor employability, skill gaps."
        />
        <Link href="/app/visa" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Visa →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-4">
              <ScoreCard label="Overall fit" value={row.envelope.detail.overall_job_fit_score} />
              <ScoreCard label="Role match" value={row.envelope.detail.role_match.score} hint={row.envelope.detail.role_match.target_role_inferred} />
              <ScoreCard label="Salary realism" value={row.envelope.detail.salary_realism.score} hint={`gap ${row.envelope.detail.salary_realism.gap_pct}%`} />
              <ScoreCard label="Visa employability" value={row.envelope.detail.visa_employability.score} hint={row.envelope.detail.visa_employability.sponsor_friendly_employer_density} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Salary realism</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <p className="text-ink-500">Your expectation</p>
                    <p className="font-semibold text-ink-900">
                      {row.envelope.detail.salary_realism.user_expectation.min.toLocaleString()}–{row.envelope.detail.salary_realism.user_expectation.max.toLocaleString()} {row.envelope.detail.salary_realism.user_expectation.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-500">Market estimate</p>
                    <p className="font-semibold text-ink-900">
                      {row.envelope.detail.salary_realism.market_estimate.min.toLocaleString()}–{row.envelope.detail.salary_realism.market_estimate.max.toLocaleString()} {row.envelope.detail.salary_realism.market_estimate.currency}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] text-ink-600">{row.envelope.detail.salary_realism.note}</p>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Visa employability</p>
                <p className="mt-2 text-[14px] text-ink-800">{row.envelope.detail.visa_employability.note}</p>
                {row.envelope.detail.visa_employability.typical_sponsor_titles?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.envelope.detail.visa_employability.typical_sponsor_titles.map((t) => (
                      <span key={t} className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] text-ink-700">{t}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <SkillList title="Aligned skills" items={(row.envelope.detail.aligned_skills ?? []).map(s => ({ name: s.name, why: s.why }))} />
              <SkillList title="Missing skills" items={(row.envelope.detail.missing_skills ?? []).map(s => ({ name: s.name, why: s.why }))} />
              <SkillList title="Transferable skills" items={(row.envelope.detail.transferable_skills ?? []).map(s => ({ name: s.name, why: s.note }))} />
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Job pathways</h2>
              <ul className="space-y-2">
                {(row.envelope.detail.job_pathways ?? []).map((p, i) => (
                  <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13.5px] font-semibold text-ink-900">{p.name}</p>
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                        ~{p.time_to_offer_weeks}w · conf {Math.round(p.confidence * 100)}%
                      </span>
                    </div>
                    <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[12.5px] text-ink-600">
                      {p.steps.map((s, k) => <li key={k}>{s}</li>)}
                    </ol>
                  </li>
                ))}
              </ul>
            </section>

            {row.envelope.detail.alternate_roles?.length ? (
              <section>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Alternate roles</h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {row.envelope.detail.alternate_roles.map((r, i) => (
                    <div key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13.5px] font-semibold text-ink-900">{r.role}</p>
                        <span className="font-mono text-[10px] text-ink-700">fit {r.fit_score}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-600">{r.why}</p>
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

function SkillList({ title, items }: { title: string; items: { name: string; why: string }[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">
            <p className="text-[13px] font-semibold text-ink-900">{s.name}</p>
            <p className="mt-0.5 text-[12px] text-ink-600">{s.why}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
