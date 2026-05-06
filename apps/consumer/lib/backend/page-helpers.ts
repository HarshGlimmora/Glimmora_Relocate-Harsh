/**
 * Server-side helpers for backend-driven analysis pages.
 *
 * Every analysis route reads the current backend profile + case_id, then
 * fetches the latest analysis (running it if missing). If the profile
 * lacks `target_country`, the page is blocked and the user is redirected
 * to onboarding.
 */

import "server-only";
import { redirect } from "next/navigation";
import { ensureBackendSession } from "./session";
import { getProfile } from "./client";
import type { BackendProfile } from "./types";
import { getIntent, type IntentMeta } from "@/lib/intent";
import { evaluateOnboarding } from "@/lib/onboarding";

export interface PrereqContext {
  caseId: string;
  profile: BackendProfile;
  intent: IntentMeta | null;
}

/**
 * Loads case + profile + intent.
 *
 * Gating policy: onboarding is a strict 8-step intake. The user is
 * redirected to the first step whose required fields aren't filled.
 * Analysis pages only render once every gate-required field is set.
 *
 * `target_country` (the previous single-field gate) is still required;
 * it now lives inside the destination step.
 */
export async function requirePrereqs(): Promise<PrereqContext> {
  const sess = await ensureBackendSession();
  const intent = await getIntent();
  const profile = await getProfile();

  const status = evaluateOnboarding({
    profile,
    hasIntent: !!intent,
    // We can't cheaply detect a prior resume parse from this seat, so
    // treat manual identity completion as the proxy. The resume step
    // satisfies itself either way.
    resumeUploaded: !!(profile.full_name && profile.current_role),
  });
  if (status.nextStep) {
    redirect(status.nextStep.href);
  }

  return { caseId: sess.caseId, profile, intent };
}
