import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { getProfile } from "@/lib/backend/client";
import { OnboardingShell } from "../_step-shell";
import { VisaIntakeForm } from "./visa-form";

export const metadata: Metadata = { title: "Visa basics" };
export const dynamic = "force-dynamic";

export default async function OnboardingVisaPage() {
  await ensureBackendSession();
  const profile = await getProfile();
  return (
    <OnboardingShell
      active="visa"
      title="Passport + current status."
      description="The route depends on your nationality, where you're sitting now, and any visa you already hold."
    >
      <VisaIntakeForm
        initialNationality={profile.nationality ?? null}
        initialCurrentCountry={profile.current_country ?? null}
        initialCurrentCity={profile.current_city ?? ""}
        initialCurrentVisaStatus={profile.current_visa_status ?? ""}
      />
    </OnboardingShell>
  );
}
