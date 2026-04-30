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
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({
      nationality: input.nationality,
      current_visa_status: input.current_visa_status,
      needs_visa_sponsorship: input.sponsor_required,
    });
    await visa.run(caseId, {
      nationality: input.nationality,
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
