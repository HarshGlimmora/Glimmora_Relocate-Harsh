"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isIntent } from "@/lib/intent";

export async function saveIntentAction(intent: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };
  if (!isIntent(intent)) return { ok: false, error: "Unknown intent." };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { intent },
  });
  return { ok: true };
}

export async function saveIntentAndContinue(intent: string): Promise<void> {
  const r = await saveIntentAction(intent);
  if (!r.ok) throw new Error(r.error);
  redirect("/app/onboarding/resume");
}
