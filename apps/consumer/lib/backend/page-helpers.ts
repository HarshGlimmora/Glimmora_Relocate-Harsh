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

export interface PrereqContext {
  caseId: string;
  profile: BackendProfile;
  intent: IntentMeta | null;
}

/**
 * Loads case + profile + intent. Redirects to:
 *   - /app/onboarding/intent if no intent yet
 *   - /app/onboarding/profile if target_country missing
 *
 * Module pages call this so they can rely on a complete prereq state and
 * read `intent` for emphasis-driven copy.
 */
export async function requirePrereqs(): Promise<PrereqContext> {
  const sess = await ensureBackendSession();
  const intent = await getIntent();
  if (!intent) {
    redirect("/app/onboarding/intent");
  }
  const profile = await getProfile();
  if (!profile.target_country) {
    redirect("/app/onboarding/profile?missing=target_country");
  }
  return { caseId: sess.caseId, profile, intent };
}
