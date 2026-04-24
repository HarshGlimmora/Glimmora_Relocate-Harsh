"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCorporateSession } from "@/lib/session";

type Result = { ok: true; id?: string } | { ok: false; error: string };

const policySchema = z.object({
  name: z.string().min(2).max(80),
  tier: z.enum(["STANDARD", "EXEC", "EARLY_CAREER", "INTERN"]),
  relocationCap: z.number().int().nonnegative().max(500000),
  housingCap: z.number().int().nonnegative().max(200000).optional().nullable(),
  shippingIncluded: z.boolean(),
  lumpSum: z.number().int().nonnegative().max(50000).optional().nullable(),
  currency: z.string().length(3),
  active: z.boolean(),
  description: z.string().max(600).optional().nullable(),
});

function parseForm(fd: FormData) {
  return {
    name: ((fd.get("name") as string | null) ?? "").trim(),
    tier: fd.get("tier") as string,
    relocationCap: fd.get("relocationCap") ? parseInt(fd.get("relocationCap") as string, 10) : 0,
    housingCap: fd.get("housingCap") ? parseInt(fd.get("housingCap") as string, 10) : null,
    shippingIncluded: fd.get("shippingIncluded") === "on" || fd.get("shippingIncluded") === "true",
    lumpSum: fd.get("lumpSum") ? parseInt(fd.get("lumpSum") as string, 10) : null,
    currency: ((fd.get("currency") as string | null) ?? "EUR").toUpperCase(),
    active: fd.get("active") === "on" || fd.get("active") === "true",
    description: ((fd.get("description") as string | null) ?? "").trim() || null,
  };
}

export async function createPolicy(formData: FormData): Promise<Result> {
  const { organization } = await requireCorporateSession();
  const parsed = policySchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const created = await prisma.policy.create({
      data: { ...parsed.data, organizationId: organization.id, description: parsed.data.description ?? null },
    });
    revalidatePath("/app/policies");
    return { ok: true, id: created.id };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { ok: false, error: "A policy with this name already exists." };
    return { ok: false, error: "Could not save policy." };
  }
}

export async function updatePolicy(id: string, formData: FormData): Promise<Result> {
  const { organization } = await requireCorporateSession();
  const existing = await prisma.policy.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== organization.id) return { ok: false, error: "Not authorised" };

  const parsed = policySchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.policy.update({
    where: { id },
    data: { ...parsed.data, description: parsed.data.description ?? null },
  });
  revalidatePath("/app/policies");
  revalidatePath(`/app/policies/${id}`);
  return { ok: true };
}

export async function togglePolicyActive(id: string): Promise<Result> {
  const { organization } = await requireCorporateSession();
  const existing = await prisma.policy.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== organization.id) return { ok: false, error: "Not authorised" };
  await prisma.policy.update({ where: { id }, data: { active: !existing.active } });
  revalidatePath("/app/policies");
  return { ok: true };
}
