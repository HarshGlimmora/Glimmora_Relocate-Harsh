import type { Metadata } from "next";
import Link from "next/link";
import { visa } from "@/lib/backend/client";
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
import { VisaPreferencesPanel } from "./visa-panel";
import {
  AlternativeRoutesPanel,
  BlockersPanel,
  DependenciesPanel,
  ProcessingGauge,
  RequirementMatchPanel,
  SectionLabel,
  VisaHeroCard,
} from "./visual-cards";
// Reuse generic finance card primitives — they're label-driven and the
// risk / next-action / assumption shapes are identical across modules.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

export const metadata: Metadata = { title: "Visa direction" };
export const dynamic = "force-dynamic";

const DIFFICULTY_EMPHASIS: Record<string, "good" | "warn" | "bad"> = {
  low: "good",
  medium: "warn",
  high: "bad",
  very_high: "bad",
};

export default async function VisaPage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await visa.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const route = ready?.detail.primary_route ?? null;
  const blockers = ready?.detail.blockers ?? [];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="03 · Visa direction"
          title="The most likely route — and what blocks it."
          description="Direction only — not legal advice. Confirm with a licensed adviser."
          intentFraming={framingFor("visa", intent)}
        />
        <Link
          href="/app/finance"
          className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
        >
          Next: Finance →
        </Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready && route ? (
          <ValueLead
            label="Your strongest route"
            headline={`${route.name}${route.code ? ` · ${route.code}` : ""}`}
            detail={
              blockers.length
                ? `Difficulty ${route.difficulty}. Top blocker: ${blockers[0].label}.`
                : `Difficulty ${route.difficulty}. ${ready.summary}`
            }
            emphasis={DIFFICULTY_EMPHASIS[route.difficulty] ?? "neutral"}
            cta={{ href: "/app/finance", text: "How affordable is it" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <VisaPreferencesPanel
          initialNationality={profile.nationality ?? ""}
          initialCurrentVisaStatus={profile.current_visa_status ?? ""}
          initialSponsorRequired={profile.needs_visa_sponsorship ?? true}
          initialFamilyRelocation={false}
          initialEmployment={"employed"}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            {/* ============ Hero · the AI's verdict at a glance ============ */}
            <VisaHeroCard route={row.envelope.detail.primary_route} />

            {/* ============ Processing window gauge ============ */}
            <ProcessingGauge
              minWeeks={row.envelope.detail.primary_route.typical_processing_weeks_min}
              maxWeeks={row.envelope.detail.primary_route.typical_processing_weeks_max}
              label={row.envelope.detail.typical_processing_time_label}
            />

            {/* ============ Requirements · donut + per-row visual ============ */}
            <section>
              <SectionLabel>
                Requirements · what the AI thinks you already meet
              </SectionLabel>
              <RequirementMatchPanel
                requirements={row.envelope.detail.primary_route.requirements}
              />
            </section>

            {/* ============ Blockers · severity bars ============ */}
            <BlockersPanel blockers={row.envelope.detail.blockers} />

            {/* ============ Dependencies · stacked status bar ============ */}
            <DependenciesPanel deps={row.envelope.detail.dependencies} />

            {/* ============ Alternative routes ============ */}
            <AlternativeRoutesPanel
              alternatives={row.envelope.detail.alternative_routes}
            />

            {/* ============ Standard envelope cards ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · the AI's headwinds for this route"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · what to do this week"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions · how the AI framed the route"
            />

            {/* ============ Legal disclaimer · always last, always verbatim ============ */}
            <section className="rounded-2xl border border-gilt-200 bg-gilt-50 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800">
                Legal disclaimer
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-gilt-900">
                {row.envelope.detail.legal_disclaimer}
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
