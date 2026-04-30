"use server";

import { patchProfile, workflow } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";

export async function applyWorkflowPriorityAction(input: {
  priorities: Priority[];
  first_focus: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({ priority_ranking: input.priorities });
    await workflow.run(caseId, { force: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
