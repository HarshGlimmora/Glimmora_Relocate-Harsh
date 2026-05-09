import type { Metadata } from "next";
import Link from "next/link";
import { workflow } from "@/lib/backend/client";
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
import { WorkflowPriorityPanel } from "./workflow-panel";
import {
  CriticalPathFlow,
  DependenciesCard,
  WorkflowInsightCard,
  WorkflowKpiRow,
  WorkflowStatusHero,
} from "./visual-cards";
import { NodesExplorer } from "./nodes-explorer";
// Reuse generic shared cards.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

export const metadata: Metadata = { title: "Workflow & dependencies" };
export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await workflow.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const blocked = ready?.detail.blocked_node_ids.length ?? 0;
  const minDays = ready?.detail.total_estimated_days_min ?? 0;
  const maxDays = ready?.detail.total_estimated_days_max ?? 0;
  const critical = ready?.detail.critical_path?.[0] ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="07 · Workflow & dependencies"
          title="The critical path — and where it stalls."
          description="Nodes, edges, blockers, and the order things have to clear."
          intentFraming={framingFor("workflow", intent)}
        />
        <Link href="/app/culture" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Culture →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="Critical path"
            headline={`~${minDays}–${maxDays} days end to end`}
            detail={
              blocked > 0
                ? `${blocked} step${blocked === 1 ? "" : "s"} currently blocked${critical ? ` · first to unblock: ${critical}` : ""}.`
                : ready.summary
            }
            emphasis={blocked > 2 ? "bad" : blocked > 0 ? "warn" : "good"}
            cta={{ href: "/app/timeline", text: "Translate to dates" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <WorkflowPriorityPanel
          initialPriorities={(profile.priority_ranking ?? []) as ("career" | "family" | "cost" | "lifestyle" | "speed")[]}
          initialFirst={null}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* ============ Status hero · ring + composition strip ============ */}
            <WorkflowStatusHero detail={row.envelope.detail} />

            {/* ============ KPI tiles ============ */}
            <WorkflowKpiRow detail={row.envelope.detail} />

            {/* ============ Insight: the reading ============ */}
            <WorkflowInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              headline={row.envelope.detail.headline_finding}
            />

            {/* ============ Critical-path flow diagram ============ */}
            <CriticalPathFlow detail={row.envelope.detail} />

            {/* ============ Nodes explorer · interactive ============ */}
            <NodesExplorer
              nodes={row.envelope.detail.nodes}
              currentStageNodeId={row.envelope.detail.current_stage_node_id}
            />

            {/* ============ Dependencies ============ */}
            <DependenciesCard
              edges={row.envelope.detail.edges}
              nodes={row.envelope.detail.nodes}
            />

            {/* ============ Risks / actions / assumptions ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · what could stall the path"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · clear the path, in order"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we wired the workflow"
            />
          </>
        )}
      </div>
    </div>
  );
}
