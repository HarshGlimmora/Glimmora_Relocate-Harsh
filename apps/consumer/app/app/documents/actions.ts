"use server";

import { documents, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";

export async function applyDocumentStatusAction(
  current_document_status: Record<string, { has?: boolean; notes?: string }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { caseId } = await requirePrereqs();
    await patchProfile({ current_document_status });
    await documents.run(caseId, {
      current_document_status,
      force: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
