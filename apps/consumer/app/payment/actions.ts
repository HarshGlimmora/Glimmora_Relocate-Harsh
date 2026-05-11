"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Dev-only shortcut: marks the current user's subscription as "PREMIUM" so
 * the /app gate lets them through, without going through Razorpay.
 *
 * Wired to the "Login as Admin (Free)" button on /payment.
 */
export async function adminBypassAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in." };
  }

  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      tier: "PREMIUM",
      status: "active",
    },
    update: {
      tier: "PREMIUM",
      status: "active",
    },
  });

  return { ok: true };
}
