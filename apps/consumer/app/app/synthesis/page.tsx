import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Compass,
  Flag,
  Layers,
  Route,
  ShieldAlert,
  Star,
} from "lucide-react";
import { synthesis } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  AssumptionsList,
  BlockedState,
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  PageHeader,
  ValueLead,
} from "@/components/backend/envelope-shell";
import { BackendApiError } from "@/lib/backend/client";
import { framingFor } from "@/lib/intent";
import { SynthesisFocusPanel } from "./synthesis-panel";
import {
  ModuleScoreGrid,
  NextActionsRoadmap,
  RisksOrbit,
  ShouldYouMoveCard,
  SynthesisSectionHeading,
  TopBlockersOrbit,
} from "./synthesis-visuals";

export const metadata: Metadata = { title: "Final synthesis" };
export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<string, string> = {
  go: "Go",
  go_with_conditions: "Go with conditions",
  wait: "Wait",
  reconsider: "Reconsider",
  blocked: "Blocked",
};

const VERDICT_EMPHASIS: Record<string, "neutral" | "good" | "warn" | "bad"> = {
  go: "good",
  go_with_conditions: "warn",
  wait: "neutral",
  reconsider: "bad",
  blocked: "bad",
};

export default async function SynthesisPage() {
  const { caseId, profile, intent } = await requirePrereqs();

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
          description={
            intent?.synthesisLead ??
            "Verdict, feasibility, recommended path, top blockers, next best actions."
          }
          intentFraming={framingFor("synthesis", intent)}
        />
        <Link
          href="/app"
          className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-10">
        {!isReadyEnvelope(row.envelope) ? (
          <>
            <ValueLead
              label="Verdict pending"
              headline="We couldn't compute the verdict yet."
              detail={row.envelope.user_message}
              emphasis="warn"
              cta={{ href: "/app/country", text: "Re-run upstream from country" }}
            />
            <FailedEnvelopeView envelope={row.envelope} />
          </>
        ) : (
          <>
            {/* ───────────────────── 1. Should You Move? ───────────────────── */}
            <section>
              <SynthesisSectionHeading
                number="01"
                title="Should you move?"
                description="A single yes / no call based on the overall feasibility score."
                icon={<Star className="h-4 w-4" />}
              />
              <ShouldYouMoveCard
                verdict={row.envelope.detail.verdict}
                feasibilityScore={row.envelope.detail.feasibility_score}
                oneLineReasoning={row.envelope.detail.one_line_reasoning}
                modelConfidence={row.envelope.confidence}
              />
            </section>

            {/* ───────────────────────── 2. The Verdict ───────────────────────── */}
            <section>
              <SynthesisSectionHeading
                number="02"
                title="The verdict"
                description="The AI's headline call, with recommended destination + role path."
                icon={<Flag className="h-4 w-4" />}
              />
              <ValueLead
                label="The verdict"
                headline={
                  <>
                    {VERDICT_LABEL[row.envelope.detail.verdict] ??
                      row.envelope.detail.verdict}
                    {" · "}
                    <span className="text-[16px] font-mono opacity-70">
                      feasibility {row.envelope.detail.feasibility_score}/100
                    </span>
                  </>
                }
                detail={row.envelope.detail.one_line_reasoning}
                emphasis={
                  VERDICT_EMPHASIS[row.envelope.detail.verdict] ?? "neutral"
                }
                cta={
                  row.envelope.detail.next_best_actions[0]
                    ? {
                        href: "#next-actions",
                        text: `Next: ${row.envelope.detail.next_best_actions[0].label}`,
                      }
                    : undefined
                }
              />

              {/* Recommended destination + job path — context for the verdict */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    Recommended destination
                  </p>
                  <p className="mt-2 text-[18px] font-semibold text-ink-900">
                    {row.envelope.detail.recommended_destination.country}
                    {row.envelope.detail.recommended_destination.city
                      ? ` · ${row.envelope.detail.recommended_destination.city}`
                      : ""}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    conf{" "}
                    {Math.round(
                      row.envelope.detail.recommended_destination.confidence * 100,
                    )}
                    %
                  </p>
                  <p className="mt-2 text-[12.5px] text-ink-600">
                    {row.envelope.detail.recommended_destination.rationale}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    Recommended job path
                  </p>
                  <p className="mt-2 text-[18px] font-semibold text-ink-900">
                    {row.envelope.detail.recommended_job_path.title}
                    {row.envelope.detail.recommended_job_path.industry
                      ? ` · ${row.envelope.detail.recommended_job_path.industry}`
                      : ""}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    conf{" "}
                    {Math.round(
                      row.envelope.detail.recommended_job_path.confidence * 100,
                    )}
                    %
                  </p>
                  <p className="mt-2 text-[12.5px] text-ink-600">
                    {row.envelope.detail.recommended_job_path.rationale}
                  </p>
                </div>
              </div>
            </section>

            {/* ───────────────── 3. Confirm what matters most ───────────────── */}
            <section>
              <SynthesisSectionHeading
                number="03"
                title="Confirm what matters most"
                description="Tighten the synthesis around the outcome you care about and the concern that worries you most."
                icon={<Compass className="h-4 w-4" />}
              />
              <SynthesisFocusPanel
                initialOutcome={
                  (profile.priority_ranking?.[0] ?? "career") as
                    | "career"
                    | "family"
                    | "cost"
                    | "lifestyle"
                    | "speed"
                }
                initialConcern="visa_blocks"
              />
            </section>

            {/* ─────────────────────── 4. Module Scoreboard ─────────────────── */}
            <section>
              <SynthesisSectionHeading
                number="04"
                title="Module scoreboard"
                description="Every upstream analysis, scored out of 100. Red ≤ 40, amber 41–70, green 71+."
                icon={<Layers className="h-4 w-4" />}
              />
              <ModuleScoreGrid scores={row.envelope.detail.module_scores} />
            </section>

            {/* ───────────────────────── 5. Top Blockers ───────────────────── */}
            {row.envelope.detail.top_blockers.length ? (
              <section>
                <SynthesisSectionHeading
                  number="05"
                  title="Top blockers"
                  description="What's most likely to stop the move — flagged across modules and surfaced here."
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                <TopBlockersOrbit blockers={row.envelope.detail.top_blockers} />
              </section>
            ) : null}

            {/* ─────────────────────────── 6. Risks ────────────────────────── */}
            <section>
              <SynthesisSectionHeading
                number="06"
                title="Risks"
                description="Uncertainty that could change the verdict if it materialises."
                icon={<ShieldAlert className="h-4 w-4" />}
              />
              <RisksOrbit risks={row.envelope.risks} />
            </section>

            {/* ─────────────────── 7. Next Best Actions ────────────────────── */}
            <section id="next-actions">
              <SynthesisSectionHeading
                number="07"
                title="Next best actions"
                description="Your sequenced roadmap — work top to bottom, highest priority first."
                icon={<Route className="h-4 w-4" />}
              />
              <NextActionsRoadmap actions={row.envelope.detail.next_best_actions} />
            </section>

            {/* Supporting detail — collapsed by default to keep the page scannable */}
            <details className="rounded-2xl border border-ink-200 bg-white p-5">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
                Show the full AI explanation
              </summary>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-[1.6] text-ink-700">
                {row.envelope.detail.explanation}
              </p>
            </details>

            <AssumptionsList items={row.envelope.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}
