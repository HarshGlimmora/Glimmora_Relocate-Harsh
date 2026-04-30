"use server";

import type { BackendProfile } from "@/lib/backend/types";
import { uploadResume, applyResumeToProfile } from "@/lib/backend/client";

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
    return {
      ok: true,
      parseId: r.parse_id,
      status: r.status,
      extracted: r.extracted ?? null,
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
