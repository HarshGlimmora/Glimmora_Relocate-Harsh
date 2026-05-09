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
  // Server-side mirror of the UI's required-field validation. Even if a
  // crafted client skips the disabled button, the AI prompt anchors
  // every score on a target role — without it, market_demand /
  // salary_realism / role_match all collapse to vague defaults. Refuse
  // the call before patching the profile or burning a model invocation.
  const targetRole = (input.target_role ?? "").trim();
  if (targetRole.length === 0) {
    return {
      ok: false,
      error: "Sharpen your career angle: a target role is required.",
    };
  }
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({
      target_role: targetRole,
      industry: input.preferred_industry,
      work_preference: input.work_mode,
      needs_visa_sponsorship: input.needs_visa_sponsorship,
      expected_salary: input.salary_max ?? input.salary_min ?? undefined,
      salary_currency: input.salary_currency ?? undefined,
      priority_ranking: input.focus,
    });
    await jobfit.run(caseId, {
      target_role: targetRole,
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
