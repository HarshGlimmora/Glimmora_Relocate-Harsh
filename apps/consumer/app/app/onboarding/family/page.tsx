import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { getProfile } from "@/lib/backend/client";
import { OnboardingShell } from "../_step-shell";
import { FamilyIntakeForm } from "./family-form";

export const metadata: Metadata = { title: "Household" };
export const dynamic = "force-dynamic";

export default async function OnboardingFamilyPage() {
  await ensureBackendSession();
  const profile = await getProfile();
  return (
    <OnboardingShell
      active="family"
      title="Who's coming with you?"
      description="Solo or family changes the visa route, the budget, and the timeline. Tell us the household shape."
    >
      <FamilyIntakeForm
        initialFamilyStatus={profile.family_status ?? "single"}
        initialMovingWithFamily={profile.moving_with_family ?? false}
        initialChildrenCount={profile.children_count ?? 0}
        initialParentsMoving={profile.parents_moving ?? false}
        initialSchoolRequirement={profile.school_requirement ?? "none"}
        initialHousingRequirement={profile.housing_requirement ?? ""}
        initialFamilyBudgetImpact={profile.family_budget_impact ?? "medium"}
      />
    </OnboardingShell>
  );
}
