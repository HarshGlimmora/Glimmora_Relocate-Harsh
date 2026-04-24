"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePartnerSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const docSchema = z.object({
  kind: z.enum(["CERT_OF_INCORPORATION", "VAT", "PROOF_OF_ADDRESS", "DIRECTOR_ID", "INSURANCE"]),
  fileName: z.string().min(1).max(200),
});

export async function uploadKybDoc(input: { kind: string; fileName: string }): Promise<Result> {
  const parsed = docSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid document" };

  const { partner } = await requirePartnerSession();

  await prisma.kybDocument.create({
    data: {
      partnerId: partner.id,
      kind: parsed.data.kind,
      fileName: parsed.data.fileName,
      status: "SUBMITTED",
    },
  });

  // Auto-advance to IN_REVIEW if we just submitted a doc
  if (partner.verificationStatus === "PENDING") {
    await prisma.partner.update({
      where: { id: partner.id },
      data: { verificationStatus: "IN_REVIEW", kybSubmittedAt: new Date() },
    });
  }

  revalidatePath("/app/verification");
  revalidatePath("/app");
  return { ok: true };
}

export async function submitForReview(): Promise<Result> {
  const { partner } = await requirePartnerSession();

  const docs = await prisma.kybDocument.findMany({ where: { partnerId: partner.id } });
  if (docs.length < 3) {
    return { ok: false, error: "Upload at least 3 documents before submitting." };
  }

  await prisma.partner.update({
    where: { id: partner.id },
    data: { verificationStatus: "IN_REVIEW", kybSubmittedAt: new Date() },
  });

  revalidatePath("/app/verification");
  revalidatePath("/app");
  return { ok: true };
}
