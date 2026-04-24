"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePartnerSession } from "@/lib/session";

type Ok<T = object> = { ok: true } & T;
type Err = { ok: false; error: string };
type Result<T = object> = Ok<T> | Err;

const listingFields = z.object({
  kind: z.enum(["APARTMENT", "SCHOOL_SEAT", "BANK_APPOINTMENT", "LEGAL_PACKAGE", "COWORKING", "LANGUAGE_COURSE"]),
  title: z.string().min(3).max(160),
  summary: z.string().max(600).optional().nullable(),
  city: z.string().min(1).max(80),
  country: z.string().length(2),
  address: z.string().max(200).optional().nullable(),
  priceMin: z.number().int().nonnegative().optional().nullable(),
  priceMax: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3),
  billingCycle: z.enum(["one-time", "monthly", "yearly", "hourly"]),
  capacity: z.number().int().nonnegative().max(10000),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

const createSchema = listingFields;
const updateSchema = listingFields.extend({ id: z.string().min(1) });

function parseForm(formData: FormData) {
  return {
    kind: formData.get("kind") as string,
    title: ((formData.get("title") as string | null) ?? "").trim(),
    summary: ((formData.get("summary") as string | null) ?? "").trim() || null,
    city: ((formData.get("city") as string | null) ?? "").trim(),
    country: ((formData.get("country") as string | null) ?? "").trim().toUpperCase(),
    address: ((formData.get("address") as string | null) ?? "").trim() || null,
    priceMin: formData.get("priceMin") ? parseInt(formData.get("priceMin") as string, 10) : null,
    priceMax: formData.get("priceMax") ? parseInt(formData.get("priceMax") as string, 10) : null,
    currency: ((formData.get("currency") as string | null) ?? "EUR").toUpperCase(),
    billingCycle: (formData.get("billingCycle") as string) ?? "one-time",
    capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string, 10) : 1,
    status: (formData.get("status") as string) ?? "DRAFT",
  };
}

export async function createListingAction(formData: FormData): Promise<Result<{ id: string }>> {
  const { partner } = await requirePartnerSession();

  const parsed = createSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const created = await prisma.listing.create({
    data: {
      ...parsed.data,
      summary: parsed.data.summary ?? null,
      address: parsed.data.address ?? null,
      partnerId: partner.id,
      publishedAt: parsed.data.status === "ACTIVE" ? new Date() : null,
    },
  });

  revalidatePath("/app/listings");
  revalidatePath("/app");
  return { ok: true, id: created.id };
}

export async function updateListingAction(formData: FormData): Promise<Result> {
  const { partner } = await requirePartnerSession();

  const payload = { id: formData.get("id") as string, ...parseForm(formData) };
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.listing.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.partnerId !== partner.id) {
    return { ok: false, error: "Not authorised" };
  }

  const wasActive = existing.status === "ACTIVE";
  const goesActive = parsed.data.status === "ACTIVE";

  const { id, ...fields } = parsed.data;
  await prisma.listing.update({
    where: { id },
    data: {
      ...fields,
      summary: fields.summary ?? null,
      address: fields.address ?? null,
      publishedAt: !wasActive && goesActive ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath("/app/listings");
  revalidatePath(`/app/listings/${id}`);
  revalidatePath("/app");
  return { ok: true };
}

export async function archiveListingAction(listingId: string): Promise<Result> {
  const { partner } = await requirePartnerSession();
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing || existing.partnerId !== partner.id) return { ok: false, error: "Not authorised" };

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/app/listings");
  revalidatePath("/app");
  return { ok: true };
}

export async function restoreListingAction(listingId: string): Promise<Result> {
  const { partner } = await requirePartnerSession();
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing || existing.partnerId !== partner.id) return { ok: false, error: "Not authorised" };

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "DRAFT" },
  });

  revalidatePath("/app/listings");
  return { ok: true };
}
