import type { Metadata } from "next";
import Link from "next/link";
import { timeline } from "@/lib/backend/client";
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
import { TimelinePreferencesPanel } from "./timeline-panel";
import { TimelineHero, TimelineKpiRow } from "./visual-cards";
import { TimelineInsightCard } from "./timeline-insight-card";
import { GanttChart } from "./gantt-chart";
import { MilestonePinBoard } from "./milestone-pin-board";
import { BlockersBoard } from "./blockers-board";
// Reuse generic shared cards.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

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
            {/* ============ Hero · earliest start countdown + runway range ============ */}
            <TimelineHero detail={row.envelope.detail} />

            {/* ============ KPI tiles ============ */}
            <TimelineKpiRow detail={row.envelope.detail} />

            {/* ============ Insight: the reading ============ */}
            <TimelineInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              headline={row.envelope.detail.headline_finding}
            />

            {/* ============ Gantt chart of phases ============ */}
            <GanttChart
              phases={row.envelope.detail.phases}
              milestones={row.envelope.detail.milestones}
              criticalMilestoneIds={row.envelope.detail.critical_milestones}
              totalWeeksMax={row.envelope.detail.estimated_total_weeks_max}
            />

            {/* ============ Milestone pin board ============ */}
            <MilestonePinBoard
              milestones={row.envelope.detail.milestones}
              criticalMilestoneIds={row.envelope.detail.critical_milestones}
              phases={row.envelope.detail.phases}
              totalWeeksMax={row.envelope.detail.estimated_total_weeks_max}
            />

            {/* ============ Blockers ============ */}
            <BlockersBoard blockers={row.envelope.detail.blockers} />

            {/* ============ Risks / actions / assumptions ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · what could push the runway"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · close the timeline gaps"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we framed the runway"
            />
          </>
        )}
      </div>
    </div>
  );
}
