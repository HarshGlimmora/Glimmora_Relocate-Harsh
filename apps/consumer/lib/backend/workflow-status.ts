/**
 * Server-side helper that fans out to every workflow module's `latest()`
 * endpoint and assembles a `WorkflowCompletion` map for the sidebar +
 * dashboard auto-skip CTA.
 *
 * Uses existing backend endpoints only — no new server work, just a
 * read-only fan-out of the same calls the dashboard already makes.
 */

import "server-only";
import {
  country,
  culture,
  documents,
  family,
  finance,
  getProfile,
  jobfit,
  visa,
} from "@/lib/backend/client";
import { ensureBackendSession } from "@/lib/backend/session";
import type { BackendProfile, ModuleResponse } from "@/lib/backend/types";
import {
  computeCompletion,
  type WorkflowCompletion,
} from "@/lib/workflow";

async function safe<T>(p: Promise<T>): Promise<T | null> {
  return p.catch(() => null);
}

export interface WorkflowStatus {
  completion: WorkflowCompletion;
  profile: BackendProfile | null;
}

/**
 * Best-effort: never throws. Any individual backend hiccup is silently
 * coerced to a "not completed" signal so the sidebar still renders.
 */
export async function getWorkflowStatus(): Promise<WorkflowStatus> {
  const sess = await safe(ensureBackendSession());
  if (!sess) {
    return { completion: computeCompletion({ profile: null, modules: {} }), profile: null };
  }
  const caseId = sess.caseId;

  const [profile, c, j, v, fin, d, f, cu] = await Promise.all([
    safe(getProfile()),
    safe(country.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(jobfit.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(visa.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(finance.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(documents.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(family.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
    safe(culture.latest(caseId)) as Promise<ModuleResponse<unknown> | null>,
  ]);

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

  return { completion, profile };
}
