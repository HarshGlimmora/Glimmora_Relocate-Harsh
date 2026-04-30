"use server";

import { country, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

export async function switchDestinationAction(target: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const upper = target.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    return { ok: false, error: "Pick a valid ISO-2 country." };
  }
  try {
    await patchProfile({ target_country: upper });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";

export async function applyCountryPreferencesAction(input: {
  priorities: Priority[];
  reason: string | null;
  alternatives: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({ priority_ranking: input.priorities });
    await country.run(caseId, {
      open_to_alternatives: input.alternatives.length > 0,
      alternatives: input.alternatives.length ? input.alternatives : undefined,
      reason_for_moving: input.reason ?? undefined,
      force: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
