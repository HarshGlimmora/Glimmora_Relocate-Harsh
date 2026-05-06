import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy URL — kept so any bookmarked /app/onboarding/intent still works.
 * The step has been renamed to "goal" because we now collect both the
 * relocation goal AND the reason for moving in one place, and persist
 * them in the backend profile (not just the consumer DB).
 */
export default function LegacyIntentRedirect() {
  redirect("/app/onboarding/goal");
}
