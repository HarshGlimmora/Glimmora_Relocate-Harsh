import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { getProfile } from "@/lib/backend/client";
import { OnboardingShell } from "../_step-shell";
import { DestinationForm } from "./destination-form";

export const metadata: Metadata = { title: "Destination" };
export const dynamic = "force-dynamic";

export default async function OnboardingDestinationPage() {
  await ensureBackendSession();
  const profile = await getProfile();

  return (
    <OnboardingShell
      active="destination"
      title="Where would you actually land?"
      description="Pick your primary target — and 1–3 alternates if you're still weighing options. Cities and country names below; we keep ISO codes only behind the scenes."
    >
      <DestinationForm
        initialTargetCountry={profile.target_country ?? null}
        initialTargetCity={profile.target_city ?? ""}
        initialAlternatives={profile.alternatives ?? []}
        initialOpenToAlternatives={profile.open_to_alternatives ?? null}
      />
    </OnboardingShell>
  );
}
