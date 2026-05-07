/**
 * Single source of truth for the consumer-facing workflow order.
 *
 * Approved sequence (sidebar + Continue/Next buttons + auto-skip):
 *   Dashboard → Resume → Profile → Country → Job fit → Visa →
 *   Finance → Documents → Family → Culture
 *
 * The backend pipeline is unchanged — modules still run in their own
 * dependency order on the server. This file only governs *which page
 * the UI takes the user to next*.
 */

import type { BackendProfile, ModuleResponse } from "@/lib/backend/types";

export type WorkflowStepId =
  | "dashboard"
  | "resume"
  | "profile"
  | "country"
  | "jobs"
  | "visa"
  | "finance"
  | "documents"
  | "family"
  | "culture";

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  href: string;
}

export const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  { id: "dashboard", label: "Dashboard", href: "/app" },
  { id: "resume",    label: "Resume",    href: "/app/onboarding/resume" },
  { id: "profile",   label: "Profile",   href: "/app/onboarding/profile" },
  { id: "country",   label: "Country",   href: "/app/country" },
  { id: "jobs",      label: "Job fit",   href: "/app/jobs" },
  { id: "visa",      label: "Visa",      href: "/app/visa" },
  { id: "finance",   label: "Finance",   href: "/app/finance" },
  { id: "documents", label: "Documents", href: "/app/documents" },
  { id: "family",    label: "Family",    href: "/app/family" },
  { id: "culture",   label: "Culture",   href: "/app/culture" },
];

export type WorkflowCompletion = Partial<Record<WorkflowStepId, boolean>>;

export interface CompletionInputs {
  profile: BackendProfile | null;
  modules: Partial<Record<WorkflowStepId, ModuleResponse<unknown> | null>>;
}

function isModuleComplete(row: ModuleResponse<unknown> | null | undefined): boolean {
  return !!row && row.status === "ready" && row.envelope.status === "ready" && !row.stale;
}

/**
 * Derives a "this step is done" flag for every workflow id from the
 * existing backend payloads:
 *   - resume / profile come from `BackendProfile` (no new endpoint),
 *   - the analysis steps from each module's `latest()` response.
 */
export function computeCompletion({ profile, modules }: CompletionInputs): WorkflowCompletion {
  const resumeDone = !!(profile?.full_name && profile?.current_role);
  const profileDone =
    resumeDone &&
    !!profile?.target_country &&
    profile?.years_experience != null &&
    !!profile?.seniority;

  return {
    // Dashboard is the entry surface, never gated.
    dashboard: true,
    resume:    resumeDone,
    profile:   profileDone,
    country:   isModuleComplete(modules.country),
    jobs:      isModuleComplete(modules.jobs),
    visa:      isModuleComplete(modules.visa),
    finance:   isModuleComplete(modules.finance),
    documents: isModuleComplete(modules.documents),
    family:    isModuleComplete(modules.family),
    culture:   isModuleComplete(modules.culture),
  };
}

/**
 * First workflow step (skipping `dashboard`) that the user has not yet
 * completed. If everything is complete, returns the final step.
 */
export function firstIncompleteStep(c: WorkflowCompletion): WorkflowStep {
  for (const step of WORKFLOW_STEPS) {
    if (step.id === "dashboard") continue;
    if (!c[step.id]) return step;
  }
  return WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1];
}

/** Step that immediately follows `id` in the new workflow, or `null`. */
export function nextStepAfter(id: WorkflowStepId): WorkflowStep | null {
  const i = WORKFLOW_STEPS.findIndex((s) => s.id === id);
  if (i < 0 || i === WORKFLOW_STEPS.length - 1) return null;
  return WORKFLOW_STEPS[i + 1];
}
