"use server";

import { family, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type SchoolingNeed =
  | "none"
  | "preschool"
  | "primary"
  | "secondary"
  | "high"
  | "tertiary"
  | "special_needs";
type Dependency = "none" | "low" | "medium" | "high" | "full_dependency";
type Sensitivity = "low" | "medium" | "high";
type BudgetImpact = "low" | "medium" | "high";

export async function applyFamilyShapeAction(input: {
  mode: "solo" | "with_family";
  spouse: {
    moving: boolean;
    has_career: boolean;
    profession: string | null;
    work_visa_required: boolean;
  } | null;
  children: { age: number; schooling_need: SchoolingNeed }[];
  parents: {
    moving: boolean;
    dependency_level: Dependency;
    healthcare_sensitivity: Sensitivity;
  } | null;
  housing_requirement: string | null;
  family_budget_impact: BudgetImpact;
  family_priority: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    // We can't store family_priority verbatim in profile, but the run body
    // carries the structure; re-running is what matters.
    await family.run(caseId, {
      moving_with_family: input.mode === "with_family",
      spouse: input.spouse
        ? {
            moving: input.spouse.moving,
            has_career: input.spouse.has_career,
            profession: input.spouse.profession ?? undefined,
            work_visa_required: input.spouse.work_visa_required,
          }
        : undefined,
      children: input.children.length ? input.children : undefined,
      parents: input.parents
        ? {
            moving: input.parents.moving,
            dependency_level: input.parents.dependency_level,
            healthcare_sensitivity: input.parents.healthcare_sensitivity,
          }
        : undefined,
      housing_requirement: input.housing_requirement ?? undefined,
      family_budget_impact: input.family_budget_impact,
      force: true,
    });
    // family_priority maps loosely onto priority_ranking; persist a hint.
    if (input.family_priority) {
      const map: Record<string, string> = {
        schooling: "family",
        spouse_career: "career",
        healthcare: "family",
        housing: "cost",
        speed: "speed",
      };
      const top = map[input.family_priority] ?? "family";
      await patchProfile({ priority_ranking: [top as "career" | "family" | "cost" | "lifestyle" | "speed"] });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
