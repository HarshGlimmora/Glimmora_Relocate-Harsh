"use server";

import type { BackendProfile } from "@/lib/backend/types";
import {
  applyResumeToProfile,
  getProfile,
  getResumeStatus,
  uploadResume,
} from "@/lib/backend/client";

export async function uploadResumeAction(formData: FormData): Promise<
  | { ok: true; parseId: string; status: string; extracted: BackendProfile | null }
  | { ok: false; error: string }
> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected." };
  }
  try {
    const r = await uploadResume(file);
    // The upload endpoint already runs extraction synchronously + writes
    // it to the user's profile via merge. To populate the preview we
    // read the full profile (which includes the new fields the merge
    // wrote: certifications, languages_known, target_role,
    // current_employer, phone) — so the preview shows the actual end
    // state, not just what the LLM returned.
    let extracted: BackendProfile | null = null;
    if (r.status === "ready") {
      try {
        extracted = await getProfile();
      } catch {
        // Fall back to status-call if profile read flakes.
        try {
          const s = await getResumeStatus(r.parse_id);
          extracted = (s.extracted as unknown as BackendProfile) ?? null;
        } catch {
          extracted = null;
        }
      }
    }
    return {
      ok: true,
      parseId: r.parse_id,
      status: r.status,
      extracted,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function applyResumeAction(parseId: string): Promise<
  | { ok: true; appliedKeys: string[]; profileCompletion: number }
  | { ok: false; error: string }
> {
  try {
    const r = await applyResumeToProfile(parseId);
    return {
      ok: true,
      appliedKeys: r.fields_filled_from_resume ?? [],
      profileCompletion: r.profile_completion ?? 0,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
