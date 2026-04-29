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

export interface PrereqContext {
  caseId: string;
  profile: BackendProfile;
}

/**
 * Loads the case + profile, redirecting to onboarding if the profile is
 * missing `target_country` (every analysis module needs this).
 */
export async function requirePrereqs(): Promise<PrereqContext> {
  const sess = await ensureBackendSession();
  const profile = await getProfile();
  if (!profile.target_country) {
    redirect("/app/onboarding/profile?missing=target_country");
  }
  return { caseId: sess.caseId, profile };
}
