import type { Metadata } from "next";
import Link from "next/link";
import { family } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  EnvelopeMeta,
  FailedEnvelopeView,
  isReadyEnvelope,
  PageHeader,
  ValueLead,
  FailedValueLead,
  readyOrNull,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { FamilyShapePanel } from "./family-panel";
import {
  ChildrenTimelineCard,
  ComplexityScale,
  FamilyInsightCard,
  HouseholdSnapshotCard,
  HousingFitCard,
  ParentsOutlookCard,
  SpouseOutlookCard,
  SuggestionsBoard,
  WarningsBoard,
} from "./visual-cards";
// Reuse generic shared cards.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

export const metadata: Metadata = { title: "Family relocation" };
export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const { caseId, intent } = await requirePrereqs();
  const row = await family.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  // household_complexity_score: low score = simpler. Invert for fit display.
  const complexity = ready?.detail.household_complexity_score ?? 0;
  const score = Math.max(0, 100 - complexity);
  const mode = ready?.detail.mode ?? "solo";

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="06 · Family relocation"
          title="How the move changes for everyone with you."
          description="Spouse, children, parents, housing fit — what shifts at the household level."
          intentFraming={framingFor("family", intent)}
        />
        <Link href="/app/culture" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Culture →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label={mode === "solo" ? "Solo move" : "Household move"}
            headline={`Family-fit ${score}/100`}
            detail={ready.summary}
            emphasis={score >= 70 ? "good" : score >= 50 ? "warn" : "bad"}
            cta={{ href: "/app/culture", text: "What to nail in your first week" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <FamilyShapePanel
          initialMode={(ready?.detail.mode ?? "solo") as "solo" | "with_family"}
          initialSpouseMoving={!!ready?.detail.spouse_outlook}
          initialSpouseHasCareer={false}
          initialSpouseProfession=""
          initialSpouseVisaRequired={true}
          initialChildren={(ready?.detail.child_outlooks ?? []).map((c) => ({
            age: String(c.age),
            schooling_need: "primary" as const,
          }))}
          initialParentsMoving={!!ready?.detail.parents_outlook}
          initialParentsDependency="none"
          initialParentsSensitivity="low"
          initialHousing=""
          initialBudgetImpact="medium"
          initialPriority={
            ready?.detail.mode === "solo"
              ? "speed"
              : "schooling"
          }
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* ============ Household roster pictograph ============ */}
            <HouseholdSnapshotCard detail={row.envelope.detail} />

            {/* ============ Horizontal complexity scale + family-fit ============ */}
            <ComplexityScale
              complexity={row.envelope.detail.household_complexity_score}
              familyFit={score}
            />

            {/* ============ Insight: why this read ============ */}
            <FamilyInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
            />

            {/* ============ Spouse + Parents (side-by-side when both exist) ============ */}
            {(row.envelope.detail.spouse_outlook || row.envelope.detail.parents_outlook) ? (
              <section className="grid gap-3 md:grid-cols-2">
                {row.envelope.detail.spouse_outlook ? (
                  <SpouseOutlookCard outlook={row.envelope.detail.spouse_outlook} />
                ) : null}
                {row.envelope.detail.parents_outlook ? (
                  <ParentsOutlookCard outlook={row.envelope.detail.parents_outlook} />
                ) : null}
              </section>
            ) : null}

            {/* ============ Children timeline ============ */}
            {row.envelope.detail.child_outlooks?.length ? (
              <ChildrenTimelineCard outlooks={row.envelope.detail.child_outlooks} />
            ) : null}

            {/* ============ Housing fit ============ */}
            {row.envelope.detail.housing_fit ? (
              <HousingFitCard fit={row.envelope.detail.housing_fit} />
            ) : null}

            {/* ============ Warnings ============ */}
            <WarningsBoard warnings={row.envelope.detail.family_warnings ?? []} />

            {/* ============ Suggestions kanban ============ */}
            <SuggestionsBoard suggestions={row.envelope.detail.family_suggestions ?? []} />

            {/* ============ Risks / actions / assumptions (shared cards) ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · what could destabilise the household"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · settle the household, in order"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we modelled your household"
            />
          </>
        )}
      </div>
    </div>
  );
}
