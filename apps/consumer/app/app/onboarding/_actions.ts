"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { patchProfile } from "@/lib/backend/client";
import type { BackendProfile } from "@/lib/backend/types";
import { isIntent } from "@/lib/intent";

/**
 * Generic "save patch + go to /app/onboarding/<next>" server action.
 *
 * Each onboarding step has its own thin server-action file that calls
 * this with the patch it collected. The redirect happens server-side so
 * the user never sees the previous step flash again.
 *
 * Backend writes are PATCH /api/v1/profile (existing endpoint). The
 * dependency map invalidates downstream analyses on the next visit.
 */
export async function saveStepAndContinue(
  patch: Partial<BackendProfile>,
  nextHref: string,
): Promise<void> {
  await patchProfile(patch);
  redirect(nextHref);
}

/**
 * Save the relocation goal (intent). The goal is persisted in BOTH the
 * consumer DB (`User.intent`, drives the sidebar reorder via
 * `getIntent()`) and the backend profile (`relocation_goal`, the
 * canonical store).
 */
export async function saveGoalAndContinue(input: {
  relocation_goal: string;
  reason_for_moving?: string | null;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!isIntent(input.relocation_goal)) {
    throw new Error("Unknown relocation goal.");
  }
  // Consumer DB: powers sidebar reorder + framing in module headers.
  await prisma.user.update({
    where: { id: session!.user!.id },
    data: { intent: input.relocation_goal },
  });
  // Backend profile: the canonical record any downstream system reads.
  await patchProfile({
    relocation_goal: input.relocation_goal as BackendProfile["relocation_goal"],
    reason_for_moving: input.reason_for_moving ?? null,
  });
  redirect("/app/onboarding/resume");
}
