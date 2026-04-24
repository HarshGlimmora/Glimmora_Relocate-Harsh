"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setPartnerVerification, setEmployerVerified } from "@/lib/xdb";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function approvePartner(partnerId: string): Promise<{ ok: true }> {
  await requireAdmin();
  setPartnerVerification(partnerId, "APPROVED");
  revalidatePath("/app/verification/partners");
  revalidatePath("/app");
  return { ok: true };
}

export async function rejectPartner(
  partnerId: string,
  reason: string,
): Promise<{ ok: true }> {
  await requireAdmin();
  setPartnerVerification(partnerId, "REJECTED", reason || "Insufficient documentation");
  revalidatePath("/app/verification/partners");
  revalidatePath("/app");
  return { ok: true };
}

export async function markPartnerInReview(partnerId: string): Promise<{ ok: true }> {
  await requireAdmin();
  setPartnerVerification(partnerId, "IN_REVIEW");
  revalidatePath("/app/verification/partners");
  return { ok: true };
}

export async function approveEmployer(companyId: string): Promise<{ ok: true }> {
  await requireAdmin();
  setEmployerVerified(companyId, true);
  revalidatePath("/app/verification/employers");
  revalidatePath("/app/companies");
  revalidatePath("/app");
  return { ok: true };
}

export async function unverifyEmployer(companyId: string): Promise<{ ok: true }> {
  await requireAdmin();
  setEmployerVerified(companyId, false);
  revalidatePath("/app/verification/employers");
  revalidatePath("/app/companies");
  revalidatePath("/app");
  return { ok: true };
}
