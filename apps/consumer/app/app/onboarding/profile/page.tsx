import type { Metadata } from "next";
import { getProfile } from "@/lib/backend/client";
import { ensureBackendSession } from "@/lib/backend/session";
import { OnboardingShell } from "../_step-shell";
import { ProfileReviewForm } from "./profile-review-form";

export const metadata: Metadata = { title: "Confirm profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage() {
  await ensureBackendSession();
  const profile = await getProfile();
  return (
    <OnboardingShell
      active="profile"
      title="Confirm what we got."
      description="Resume-inferred fields are pre-filled — fix anything that's wrong, fill what's missing. We'll only ask about destination + family + visa + money next."
    >
      <ProfileReviewForm initial={profile} />
    </OnboardingShell>
  );
}
