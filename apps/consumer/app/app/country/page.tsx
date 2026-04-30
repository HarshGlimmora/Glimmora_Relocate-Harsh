import type { Metadata } from "next";
import Link from "next/link";
import { country } from "@/lib/backend/client";
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
  ValueLead,
  FailedValueLead,
  readyOrNull,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { DestinationSwitcher } from "./destination-switcher";
import { CountryPreferencesPanel } from "./preferences-panel";

export const metadata: Metadata = { title: "Country comparison" };
export const dynamic = "force-dynamic";

function leadEmphasis(score: number): "good" | "warn" | "bad" {
  if (score >= 70) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export default async function CountryPage() {
  const { caseId, profile, intent } = await requirePrereqs();
  const row = await country.ensure(caseId);
  const ready = readyOrNull(row.envelope);
  const score = ready?.detail.overall_comparison_score ?? 0;
  const summary = ready?.summary ?? "";

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="01 · Country comparison"
          title="Why this country, and why now?"
          description="Paired scores for the dimensions that matter most for a relocation decision."
          intentFraming={framingFor("country", intent)}
        />
        <Link href="/app/jobs" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">Next: Job fit →</Link>
      </div>
      <EnvelopeMeta row={row} />

      <div className="mt-6 space-y-6">
        {ready ? (
          <ValueLead
            label={`Match for ${profile.target_country}`}
            headline={`${score}/100 · ${score >= 70 ? "Strong fit" : score >= 50 ? "Workable with trade-offs" : "Tough match"}`}
            detail={summary || undefined}
            emphasis={leadEmphasis(score)}
            cta={{ href: "/app/jobs", text: "See your career angle" }}
          />
        ) : (
          <FailedValueLead envelope={row.envelope} />
        )}

        <DestinationSwitcher
          current={profile.target_country ?? ""}
          alternates={["DE", "NL", "IE", "GB", "CA", "AU", "AE", "SG"]}
        />

        <CountryPreferencesPanel
          initialPriorities={(profile.priority_ranking ?? []) as ("career" | "family" | "cost" | "lifestyle" | "speed")[]}
          initialReason={null}
          initialAlternatives={[]}
        />

        {!isReadyEnvelope(row.envelope) ? (
          <FailedEnvelopeView envelope={row.envelope} />
        ) : (
          <>
            <SummaryReasoning envelope={row.envelope} />

            <section className="grid gap-4 md:grid-cols-3">
              <ScoreCard label="Overall comparison" value={row.envelope.detail.overall_comparison_score} />
              <ScoreCard label="Destination suitability" value={row.envelope.detail.destination_suitability_score} />
              <ScoreCard label="Origin pressure" value={row.envelope.detail.origin_pressure_score} />
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Access points (origin → destination)</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(row.envelope.detail.access_points).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-ink-200 bg-white p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{k.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-[14.5px] text-ink-900">
                      <span>{v.origin}</span>
                      <span className="mx-2 text-ink-400">→</span>
                      <span className="font-semibold">{v.destination}</span>
                      <span className={"ml-2 text-[12px] " + (v.delta >= 0 ? "text-success-700" : "text-danger-700")}>
                        {v.delta >= 0 ? "+" : ""}{v.delta}
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-ink-600">{v.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Strengths</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.strengths.map((s, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <p className="text-[13.5px] font-semibold text-ink-900">{s.title}</p>
                      <p className="mt-1 text-[12.5px] text-ink-600">{s.detail}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{s.side}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Blockers</h2>
                <ul className="space-y-2">
                  {row.envelope.detail.blockers.map((s, i) => (
                    <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
                      <p className="text-[13.5px] font-semibold text-ink-900">{s.title}</p>
                      <p className="mt-1 text-[12.5px] text-ink-600">{s.detail}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{s.side}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <RisksList risks={row.envelope.risks} />
            <NextActionsList actions={row.envelope.next_actions} />
            <AssumptionsList items={row.envelope.assumptions} />
          </>
        )}
      </div>
    </div>
  );
}
