"use server";

import { finance, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

export async function applyFinanceSensitivityAction(input: {
  monthly_budget: number | null;
  savings: number | null;
  rent_expectation: number | null;
  family_size: number | null;
  cost_sensitivity: "low" | "medium" | "high";
  salary_currency: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    // Persist what the profile knows; helpers fields are run-only.
    await patchProfile({
      relocation_budget: input.savings ?? undefined,
    });
    await finance.run(caseId, {
      monthly_budget: input.monthly_budget ?? undefined,
      savings: input.savings ?? undefined,
      rent_expectation: input.rent_expectation ?? undefined,
      family_size: input.family_size ?? undefined,
      cost_sensitivity: input.cost_sensitivity,
      salary_currency: input.salary_currency || undefined,
      force: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
