"use server";

import { jobfit, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";

export async function applyJobsPreferencesAction(input: {
  target_role: string | null;
  preferred_industry: string | null;
  work_mode: "onsite" | "hybrid" | "remote";
  needs_visa_sponsorship: boolean;
  open_to_role_change: boolean;
  focus: Priority[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({
      industry: input.preferred_industry,
      work_preference: input.work_mode,
      needs_visa_sponsorship: input.needs_visa_sponsorship,
      expected_salary: input.salary_max ?? input.salary_min ?? undefined,
      salary_currency: input.salary_currency ?? undefined,
      priority_ranking: input.focus,
    });
    await jobfit.run(caseId, {
      target_role: input.target_role ?? undefined,
      preferred_industry: input.preferred_industry ?? undefined,
      salary_range_min: input.salary_min ?? undefined,
      salary_range_max: input.salary_max ?? undefined,
      salary_currency: input.salary_currency ?? undefined,
      work_mode: input.work_mode,
      needs_visa_sponsorship: input.needs_visa_sponsorship,
      open_to_role_change: input.open_to_role_change,
      force: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
