/**
 * Backend-driven dashboard.
 *
 * Reads the FastAPI profile + every module's latest envelope and renders
 * a minimal status grid that mirrors the approved consumer workflow:
 *
 *   Dashboard → Resume → Profile → Country → Job fit → Visa →
 *   Finance → Documents → Family → Culture
 *
 * The dashboard is also the **auto-skip entry point**: a "Continue your
 * journey" CTA jumps the user straight to the first step they haven't
 * completed yet (or the synthesis verdict once everything is done).
 */

import Link from "next/link";
import {
  country,
  culture,
  documents,
  family,
  finance,
  getProfile,
  jobfit,
  synthesis,
  visa,
} from "@/lib/backend/client";
import { ensureBackendSession } from "@/lib/backend/session";
import type { ModuleResponse } from "@/lib/backend/types";
import {
  WORKFLOW_STEPS,
  computeCompletion,
  firstIncompleteStep,
  type WorkflowStepId,
} from "@/lib/workflow";
import { WorkflowJourney } from "./_workflow-journey";

export const dynamic = "force-dynamic";

interface ModuleRow {
  stepId: WorkflowStepId;
  label: string;
  href: string;
  row: ModuleResponse<unknown> | null;
}

export default async function DashboardPage() {
  // Backend session can fail (FastAPI down, network blocked, etc.). Treat that
  // as "no modules run yet" so the dashboard still renders post-login — the
  // payment gate has already passed at this point.
  const sess = await ensureBackendSession().catch(() => null);
  const profile = sess ? await getProfile().catch(() => null) : null;
  const caseId = sess?.caseId ?? "";

  // Fan out to every module's latest. Missing → null. Failures swallowed.
  async function safe<T>(p: Promise<ModuleResponse<T> | null>): Promise<ModuleResponse<T> | null> {
    return p.catch(() => null);
  }

  const [c, j, v, f, fin, d, cu, syn] = sess
    ? await Promise.all([
        safe(country.latest(caseId)),
        safe(jobfit.latest(caseId)),
        safe(visa.latest(caseId)),
        safe(family.latest(caseId)),
        safe(finance.latest(caseId)),
        safe(documents.latest(caseId)),
        safe(culture.latest(caseId)),
        safe(synthesis.latest(caseId)),
      ])
    : [null, null, null, null, null, null, null, null];

  // Workflow ordering: Country → Job fit → Visa → Finance → Documents → Family → Culture.
  const modules: ModuleRow[] = [
    { stepId: "country",   label: "Country",   href: "/app/country",   row: c },
    { stepId: "jobs",      label: "Job fit",   href: "/app/jobs",      row: j },
    { stepId: "visa",      label: "Visa",      href: "/app/visa",      row: v },
    { stepId: "finance",   label: "Finance",   href: "/app/finance",   row: fin },
    { stepId: "documents", label: "Documents", href: "/app/documents", row: d },
    { stepId: "family",    label: "Family",    href: "/app/family",    row: f },
    { stepId: "culture",   label: "Culture",   href: "/app/culture",   row: cu },
  ];

  const completion = computeCompletion({
    profile,
    modules: {
      country: c,
      jobs: j,
      visa: v,
      finance: fin,
      documents: d,
      family: f,
      culture: cu,
    },
  });
  const nextStep = firstIncompleteStep(completion);
  const allComplete = WORKFLOW_STEPS.every(
    (s) => s.id === "dashboard" || completion[s.id],
  );

  const profileReady = !!profile?.target_country;
  const ranCount = modules.filter((m) => m.row).length;
  const totalCount = modules.length;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <header className="mb-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">Dashboard</p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
          {syn?.status === "ready"
            ? "Your verdict is ready."
            : profileReady
            ? "Run your analyses."
            : "Let's get started."}
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-ink-600">
          Work the journey in order — each step unlocks the next.
        </p>
      </header>

      {/* Visual workflow journey — replaces the plain-text "order" line. */}
      <div className="mb-8">
        <WorkflowJourney completion={completion} activeId={nextStep.id} />
      </div>

      {/* Auto-skip CTA: jumps straight to the first incomplete step. */}
      {!allComplete ? (
        <div className="mb-8 rounded-2xl border border-ink-200 bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
            Continue your journey
          </p>
          <p className="mt-1 text-[14px] font-semibold text-ink-900">
            Pick up at <span className="text-ink-900">{nextStep.label}</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ink-600">
            We'll skip the steps you've already completed and take you straight there.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href={nextStep.href}
              className="rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800"
            >
              Continue → {nextStep.label}
            </Link>
            {!profileReady ? (
              <Link
                href="/app/onboarding/profile"
                className="rounded-full border border-ink-300 bg-white px-4 py-2 text-[13px] font-medium text-ink-800 hover:bg-ink-50"
              >
                Skip — fill profile manually
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {syn?.status === "ready" && syn.envelope.status === "ready" ? (
        <div className="mb-8 rounded-2xl border border-ink-200 bg-ink-900 p-6 text-parchment">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-300">Verdict</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-sans text-[42px] font-semibold leading-none tracking-[-0.02em]">
              {(() => {
                const det = syn.envelope.detail as { verdict: string; feasibility_score: number; one_line_reasoning: string };
                return det.verdict.replace(/_/g, " ");
              })()}
            </span>
            <span className="font-mono text-[12px] text-white/60">
              · feasibility {(syn.envelope.detail as { feasibility_score: number }).feasibility_score}/100
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.6] text-white/80">
            {(syn.envelope.detail as { one_line_reasoning: string }).one_line_reasoning}
          </p>
          <Link href="/app/synthesis" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gilt-500 px-4 py-2 text-[13px] font-semibold text-ink-900 hover:bg-gilt-400">
            Open synthesis →
          </Link>
        </div>
      ) : null}

      <section className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Modules · {ranCount}/{totalCount} run
        </h2>
        {profileReady && !allComplete ? (
          <Link href={nextStep.href} className="text-[13px] text-ink-600 underline-offset-4 hover:underline">
            Run next →
          </Link>
        ) : null}
      </section>

      <ul className="grid gap-2 md:grid-cols-2">
        {modules.map((m) => {
          const done = !!completion[m.stepId];
          return (
            <li key={m.stepId}>
              <Link
                href={m.href}
                className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 hover:bg-ink-50/60"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink-900">
                    {m.label}
                    {done ? (
                      <span className="ml-2 rounded-full bg-success-100 px-2 py-0.5 align-middle font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-700">
                        done
                      </span>
                    ) : null}
                  </p>
                  {m.row ? (
                    <p className="mt-0.5 truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
                      v{m.row.analysis_version} ·
                      {m.row.stale ? " stale" : " current"}
                      {/* Use the row-level status (always populated) instead of
                          digging into envelope.status — envelope can be null
                          for rows that crashed mid-generation. */}
                      {m.row.status !== "ready" ? " · failed" : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400">not run yet</p>
                  )}
                </div>
                <div className="ml-3 text-right">
                  {m.row && m.row.status === "ready" && m.row.envelope && "score" in m.row.envelope ? (
                    <p className="font-sans text-[20px] font-semibold leading-none text-ink-900">
                      {m.row.envelope.score ?? "—"}
                    </p>
                  ) : (
                    <p className="text-[12px] text-ink-400">→</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex gap-3">
        <Link
          href="/app/synthesis"
          className="rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-parchment hover:bg-ink-800"
        >
          {syn ? "View synthesis" : "Generate synthesis →"}
        </Link>
        <Link
          href="/app/onboarding/profile"
          className="rounded-full border border-ink-300 bg-white px-5 py-2.5 text-[13.5px] font-medium text-ink-800 hover:bg-ink-50"
        >
          Edit profile
        </Link>
      </div>
    </div>
  );
}
