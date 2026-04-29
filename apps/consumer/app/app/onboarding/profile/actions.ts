"use server";

import { patchProfile } from "@/lib/backend/client";
import type { BackendProfile } from "@/lib/backend/types";

export async function saveProfileAction(patch: Partial<BackendProfile>): Promise<
  | { ok: true; impacted: string[]; changed: string[] }
  | { ok: false; error: string }
> {
  try {
    const r = await patchProfile(patch);
    return { ok: true, impacted: r.impacted_modules, changed: r.changed_keys };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
