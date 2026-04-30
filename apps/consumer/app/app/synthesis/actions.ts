"use server";

import { patchProfile, synthesis } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type Outcome = "career" | "family" | "cost" | "lifestyle" | "speed";

export async function applySynthesisFocusAction(input: {
  outcome: Outcome;
  concern: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({ priority_ranking: [input.outcome] });
    await synthesis.run(caseId, { force: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
