"use server";

import { culture, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";

export async function applyCulturePreferencesAction(input: {
  concern: string;
  language_confidence: string;
  mapped_priority: Priority;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({ priority_ranking: [input.mapped_priority] });
    await culture.run(caseId, { force: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
