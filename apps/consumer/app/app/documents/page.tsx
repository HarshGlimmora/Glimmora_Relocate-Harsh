import type { Metadata } from "next";
import Link from "next/link";
import { documents } from "@/lib/backend/client";
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
import { DocumentsStatusPanel } from "./documents-panel";
import {
  DocStatRow,
  DocumentsInsightCard,
  NextToHandleCard,
  ReadinessHeroCard,
  RequiredForGrid,
} from "./visual-cards";
import { ChecklistGrid } from "./checklist-grid";
// Reuse generic finance card primitives.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { caseId, intent } = await requirePrereqs();
  const row = await documents.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const pct = ready?.detail.readiness_percentage ?? 0;
  const need = ready?.detail.need_count ?? 0;
  const next = ready?.detail.next_to_handle ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="05 · Documents"
          title="What's missing — and what blocks the route."
          description="Generated from your destination + visa route + family shape."
          intentFraming={framingFor("documents", intent)}
        />
        <Link href="/app/family" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Family →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label="Document readiness"
            headline={`${pct}% ready · ${need} item${need === 1 ? "" : "s"} to gather`}
            detail={
              next
                ? `Next: ${next.label}. ${next.why ?? ""}`
                : ready.summary
            }
            emphasis={pct >= 75 ? "good" : pct >= 40 ? "warn" : "bad"}
            cta={{ href: "/app/family", text: "Who's coming with you" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <DocumentsStatusPanel
          initialItems={(ready?.detail.items ?? []).map((it) => ({
            kind: it.kind,
            label: it.label,
            status: it.status,
          }))}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* ============ Readiness hero · circular gauge + composition strip ============ */}
            <ReadinessHeroCard detail={row.envelope.detail} />

            {/* ============ Four counts that matter ============ */}
            <DocStatRow detail={row.envelope.detail} />

            {/* ============ Next to handle ============ */}
            <NextToHandleCard next={row.envelope.detail.next_to_handle} />

            {/* ============ Insight card · summary + collapsible reasoning ============ */}
            <DocumentsInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              headline={row.envelope.detail.headline_finding}
            />

            {/* ============ Document checklist · interactive grid ============ */}
            <ChecklistGrid items={row.envelope.detail.items} />

            {/* ============ Required-for · which docs unlock which step ============ */}
            <RequiredForGrid summary={row.envelope.detail.required_for_summary} />

            {/* ============ Risks / actions / assumptions (shared cards) ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · what could block the file"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · gather, in order"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we built this checklist"
            />
          </>
        )}
      </div>
    </div>
  );
}
