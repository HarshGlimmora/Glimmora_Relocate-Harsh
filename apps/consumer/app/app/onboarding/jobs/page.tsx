import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { getProfile } from "@/lib/backend/client";
import { OnboardingShell } from "../_step-shell";
import { JobsIntakeForm } from "./jobs-form";

export const metadata: Metadata = { title: "Career angle" };
export const dynamic = "force-dynamic";

export default async function OnboardingJobsPage() {
  await ensureBackendSession();
  const profile = await getProfile();
  return (
    <OnboardingShell
      active="jobs"
      title="What's your career angle?"
      description="The role you want, what you'd compromise on, and how you'd like to work. Ten seconds — keeps the analyses sharp."
    >
      <JobsIntakeForm
        initialTargetRole={profile.target_role ?? profile.current_role ?? ""}
        initialIndustry={profile.industry ?? ""}
        initialWorkPreference={(profile.work_preference ?? "hybrid") as "onsite" | "hybrid" | "remote"}
        initialNeedsSponsorship={profile.needs_visa_sponsorship ?? true}
        initialPriorities={(profile.priority_ranking ?? []) as ("career" | "family" | "cost" | "lifestyle" | "speed")[]}
        initialExpectedSalary={profile.expected_salary?.toString() ?? ""}
        initialCurrency={profile.salary_currency ?? "EUR"}
      />
    </OnboardingShell>
  );
}
