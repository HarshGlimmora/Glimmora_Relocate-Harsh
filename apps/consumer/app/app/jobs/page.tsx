import type { Metadata } from "next";
import Link from "next/link";
import { jobfit } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  PageHeader,
  ValueLead,
  readyOrNull,
  FailedValueLead,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { JobsPreferencesPanel } from "./jobs-panel";
import {
  AlternateRolesGrid,
  FitMetricCard,
  JobFitScoreCard,
  JobInsightCard,
  KeyGapsCard,
  MarketDemandCard,
  padRisksToFour,
  RoleMatchCard,
  SalaryComparisonCard,
  SectionLabel,
  SkillChipGroup,
  VisaEmployabilityCard,
} from "./visual-cards";
import { JobPathwaysCard } from "./job-pathways-card";
// Reuse generic finance card primitives (label-driven, not finance-specific).
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

export const metadata: Metadata = { title: "Job fit" };
export const dynamic = "force-dynamic";

export default async function JobFitPage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await jobfit.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const score = ready?.detail.overall_job_fit_score ?? 0;
  const target = ready?.detail.role_match.target_role_inferred ?? null;
  const fastestPath = ready?.detail.job_pathways?.[0] ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="02 · Job fit"
          title="Is your career path realistic here?"
          description="Role match, salary realism, sponsor employability, skill gaps — one direction, not a long list."
          intentFraming={framingFor("jobs", intent)}
        />
        <Link href="/app/visa" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Visa →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="Direction we'd back"
            headline={target ?? `Job-fit ${score}/100`}
            detail={
              fastestPath
                ? `Fastest path: ${fastestPath.name} · ~${fastestPath.time_to_offer_weeks}w to offer · fit ${score}/100`
                : ready.summary
            }
            emphasis={score >= 70 ? "good" : score >= 50 ? "warn" : "bad"}
            cta={{ href: "/app/visa", text: "What visa unlocks this" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <JobsPreferencesPanel
          initialTargetRole={ready?.detail.role_match.target_role_inferred ?? profile.current_role ?? ""}
          initialIndustry={profile.industry ?? ""}
          initialWorkMode={(profile.work_preference ?? "hybrid") as "onsite" | "hybrid" | "remote"}
          initialNeedsSponsorship={profile.needs_visa_sponsorship ?? true}
          initialOpenToChange={false}
          initialFocus={(profile.priority_ranking ?? []) as ("career" | "family" | "cost" | "lifestyle" | "speed")[]}
          initialSalaryMin={profile.current_salary?.toString() ?? ""}
          initialSalaryMax={profile.expected_salary?.toString() ?? ""}
          initialCurrency={profile.salary_currency ?? "EUR"}
          recommendations={ready?.detail.career_angle_recommendations ?? []}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* ============ Role match (narrative-style, sets context) ============ */}
            <RoleMatchCard data={row.envelope.detail.role_match} />

            {/* ============ Compatibility dashboard ============ */}
            <section>
              <SectionLabel>Compatibility dashboard</SectionLabel>
              {/* Hero score on its own row, then 4 evenly-spaced tiles */}
              <div className="space-y-3">
                <JobFitScoreCard
                  value={row.envelope.detail.overall_job_fit_score}
                  targetRole={row.envelope.detail.role_match.target_role_inferred}
                  rationale={row.envelope.detail.role_match.rationale}
                />
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <FitMetricCard
                    label="Role match"
                    value={row.envelope.detail.role_match.score}
                    hint={row.envelope.detail.role_match.target_role_inferred}
                    tone={row.envelope.detail.role_match.score >= 70 ? "good" : row.envelope.detail.role_match.score >= 50 ? "warn" : "bad"}
                  />
                  <FitMetricCard
                    label="Salary realism"
                    value={row.envelope.detail.salary_realism.score}
                    hint={`gap ${row.envelope.detail.salary_realism.gap_pct >= 0 ? "+" : ""}${row.envelope.detail.salary_realism.gap_pct}%`}
                    tone={row.envelope.detail.salary_realism.score >= 70 ? "good" : row.envelope.detail.salary_realism.score >= 50 ? "warn" : "bad"}
                  />
                  <FitMetricCard
                    label="Visa employability"
                    value={row.envelope.detail.visa_employability.score}
                    hint={row.envelope.detail.visa_employability.sponsor_friendly_employer_density}
                    tone={row.envelope.detail.visa_employability.score >= 70 ? "good" : row.envelope.detail.visa_employability.score >= 50 ? "warn" : "bad"}
                  />
                  {row.envelope.detail.market_demand ? (
                    <MarketDemandCard data={row.envelope.detail.market_demand} />
                  ) : (
                    <FitMetricCard
                      label="Market demand"
                      value="—"
                      hint="Pending AI analysis"
                      tone="neutral"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* ============ AI insight · the conviction read ============ */}
            <JobInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              detail={row.envelope.detail}
            />

            {/* ============ Salary realism + Visa employability ============ */}
            <section className="grid gap-4 md:grid-cols-2">
              <SalaryComparisonCard data={row.envelope.detail.salary_realism} />
              <VisaEmployabilityCard data={row.envelope.detail.visa_employability} />
            </section>

            {/* ============ Skills · aligned / missing / transferable ============ */}
            <section>
              <SectionLabel>Skill compatibility · what aligns, what's missing, what transfers</SectionLabel>
              <div className="grid gap-3 md:grid-cols-3">
                <SkillChipGroup
                  kind="aligned"
                  title="Aligned"
                  items={(row.envelope.detail.aligned_skills ?? []).map((s) => ({ name: s.name, why: s.why }))}
                />
                <SkillChipGroup
                  kind="missing"
                  title="Missing"
                  items={(row.envelope.detail.missing_skills ?? []).map((s) => ({ name: s.name, why: s.why }))}
                />
                <SkillChipGroup
                  kind="transferable"
                  title="Transferable"
                  items={(row.envelope.detail.transferable_skills ?? []).map((s) => ({ name: s.name, why: s.note }))}
                />
              </div>
            </section>

            {/* ============ Key gaps ============ */}
            <KeyGapsCard gaps={row.envelope.detail.key_gaps ?? []} />

            {/* ============ Job pathways ============ */}
            <JobPathwaysCard pathways={row.envelope.detail.job_pathways ?? []} />

            {/* ============ Alternate roles ============ */}
            <AlternateRolesGrid roles={row.envelope.detail.alternate_roles ?? []} />

            {/* ============ Risks / actions / assumptions (shared cards) ============
                If the AI returned fewer than 4 risks for this case, pad
                the list with risks derived from the analysis itself
                (visa score, salary gap, missing skills, market demand,
                etc.) so the grid stays full. Every padded risk is
                grounded in real backend data — no hardcoded copy. */}
            <RisksCard
              risks={padRisksToFour(row.envelope.detail, row.envelope.risks, 4)}
              label="Risks · what could derail this path"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · land an offer, in order"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we framed the fit"
            />
          </>
        )}
      </div>
    </div>
  );
}
