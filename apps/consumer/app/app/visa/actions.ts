"use server";

import { patchProfile, visa } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

export async function applyVisaPreferencesAction(input: {
  nationality: string;
  current_visa_status: string | null;
  sponsor_required: boolean;
  family_relocation: boolean;
  employment_status: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Server-side mirror of the UI's required-field validation. Without
  // a valid ISO-2 nationality the AI can't anchor the route (it would
  // silently fall back to the profile and produce a misleading
  // direction), so refuse the call before patching the profile or
  // burning a visa generation.
  const nationality = (input.nationality ?? "").trim().toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(nationality)) {
    return {
      ok: false,
      error: "Please confirm your details before continuing with the analysis.",
    };
  }
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({
      nationality,
      current_visa_status: input.current_visa_status,
      needs_visa_sponsorship: input.sponsor_required,
    });
    await visa.run(caseId, {
      nationality,
      current_visa_status: input.current_visa_status ?? undefined,
      sponsor_required: input.sponsor_required,
      family_relocation: input.family_relocation,
      employment_status: input.employment_status,
      force: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
