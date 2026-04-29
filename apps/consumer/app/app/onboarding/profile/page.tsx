import type { Metadata } from "next";
import { getProfile } from "@/lib/backend/client";
import { ensureBackendSession } from "@/lib/backend/session";
import { ProfileReviewForm } from "./profile-review-form";

export const metadata: Metadata = { title: "Review profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  await ensureBackendSession();
  const profile = await getProfile();
  const missing = searchParams?.missing ?? null;
  return (
    <div className="mx-auto max-w-[860px] px-6 py-12">
      <header className="mb-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">Step 2 of 2</p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
          Confirm your profile.
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-ink-600">
          Inferred values from your resume are pre-filled. Add what's missing and confirm. Every analysis below uses this snapshot.
        </p>
        {missing === "target_country" ? (
          <p className="mt-4 rounded-xl bg-gilt-50 p-3 text-[13px] text-gilt-900">
            We need your <strong>target country</strong> before any analysis can run. Please fill it in below.
          </p>
        ) : null}
      </header>

      <ProfileReviewForm initial={profile} />
    </div>
  );
}
