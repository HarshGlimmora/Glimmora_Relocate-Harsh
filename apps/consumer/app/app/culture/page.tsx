import type { Metadata } from "next";
import Link from "next/link";
import { culture } from "@/lib/backend/client";
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
import { CulturePreferencesPanel } from "./culture-panel";
import {
  DosAndDontsCard,
  FamilyAdaptationCard,
  FirstWeekKanban,
  LanguageCard,
} from "./visual-cards";
import { CultureInsightCard } from "./culture-insight-card";
import { WorkplaceNormsCard } from "./workplace-norms-card";
import { DailyLifeGrid } from "./daily-life-grid";
import { PhraseFlashcards } from "./phrase-flashcards";
// Reuse generic shared cards.
import { RisksCard } from "../finance/visual-cards";
import { NextActionsCard } from "../finance/next-actions-card";
import { AssumptionsCard } from "../finance/assumptions-card";

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
            {/* ============ Insight: cultural read ============ */}
            <CultureInsightCard
              summary={row.envelope.summary}
              reasoning={row.envelope.reasoning}
              confidence={row.envelope.confidence}
              headline={row.envelope.detail.headline_finding}
            />

            {/* ============ Workplace norms · axis-pill cards ============ */}
            <WorkplaceNormsCard norms={row.envelope.detail.workplace_norms} />

            {/* ============ Language · semicircular gauge + CEFR ladder ============ */}
            <LanguageCard language={row.envelope.detail.language} />

            {/* ============ Phrase flashcards · interactive flip ============ */}
            <PhraseFlashcards phrases={row.envelope.detail.language.basic_phrases ?? []} />

            {/* ============ Daily life topic grid ============ */}
            <DailyLifeGrid items={row.envelope.detail.daily_life ?? []} />

            {/* ============ First-week kit · priority kanban ============ */}
            <FirstWeekKanban items={row.envelope.detail.first_week_kit ?? []} />

            {/* ============ Do · Don't ============ */}
            <DosAndDontsCard pairs={row.envelope.detail.dos_and_donts ?? []} />

            {/* ============ Family adaptation notes ============ */}
            <FamilyAdaptationCard notes={row.envelope.detail.family_adaptation_notes ?? []} />

            {/* ============ Risks / actions / assumptions ============ */}
            <RisksCard
              risks={row.envelope.risks}
              label="Risks · what could trip you up early"
            />
            <NextActionsCard
              actions={row.envelope.next_actions}
              label="Next actions · land softly, in order"
            />
            <AssumptionsCard
              items={row.envelope.assumptions}
              label="Assumptions used · how we framed the cultural read"
            />
          </>
        )}
      </div>
    </div>
  );
}
