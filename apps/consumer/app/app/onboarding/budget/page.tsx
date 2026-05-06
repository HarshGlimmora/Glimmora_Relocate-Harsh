import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { getProfile } from "@/lib/backend/client";
import { OnboardingShell } from "../_step-shell";
import { BudgetIntakeForm } from "./budget-form";

export const metadata: Metadata = { title: "Budget" };
export const dynamic = "force-dynamic";

export default async function OnboardingBudgetPage() {
  await ensureBackendSession();
  const profile = await getProfile();
  return (
    <OnboardingShell
      active="budget"
      title="The honest financial picture."
      description="Salary, savings, and how tight your margin needs to be. We'll stress-test the move against this."
    >
      <BudgetIntakeForm
        initialCurrentSalary={profile.current_salary?.toString() ?? ""}
        initialExpectedSalary={profile.expected_salary?.toString() ?? ""}
        initialSavings={profile.savings?.toString() ?? profile.relocation_budget?.toString() ?? ""}
        initialMonthlyBudget={profile.monthly_budget?.toString() ?? ""}
        initialCurrency={profile.salary_currency ?? "EUR"}
        initialCostSensitivity={profile.cost_sensitivity ?? "medium"}
        initialMoveUrgency={(profile.move_urgency ?? "12m") as "asap" | "6m" | "12m" | "exploring"}
      />
    </OnboardingShell>
  );
}
