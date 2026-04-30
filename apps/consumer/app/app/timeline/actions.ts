"use server";

import { patchProfile, timeline } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

type Urgency = "asap" | "6m" | "12m" | "exploring";
type Style = "fast" | "safe" | "with_family";

export async function applyTimelinePreferencesAction(input: {
  urgency: Urgency;
  style: Style;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    const styleToPriority: Record<Style, "speed" | "lifestyle" | "family"> = {
      fast: "speed",
      safe: "lifestyle",
      with_family: "family",
    };
    await patchProfile({
      move_urgency: input.urgency,
      priority_ranking: [styleToPriority[input.style]],
    });
    await timeline.run(caseId, { force: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
