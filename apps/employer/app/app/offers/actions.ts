"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  offerId: z.string().min(1),
  status: z.enum(["SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"]),
});

export async function updateOfferStatus(offerId: string, status: string): Promise<ActionResult> {
  const parsed = schema.safeParse({ offerId, status });
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return { ok: false, error: "No company" };

  const offer = await prisma.offer.findUnique({
    where: { id: parsed.data.offerId },
    include: { application: { include: { job: true } } },
  });
  if (!offer || offer.application.job.companyId !== membership.companyId) {
    return { ok: false, error: "Not authorized" };
  }

  const data: Record<string, unknown> = { status: parsed.data.status };
  const now = new Date();
  if (parsed.data.status === "SENT" && !offer.sentAt) data.sentAt = now;
  if (["ACCEPTED", "DECLINED", "WITHDRAWN"].includes(parsed.data.status) && !offer.respondedAt) {
    data.respondedAt = now;
  }
  if (parsed.data.status === "ACCEPTED") {
    // Advance candidate to HIRED stage
    await prisma.application.update({
      where: { id: offer.applicationId },
      data: { stage: "HIRED" },
    });
  }

  await prisma.offer.update({ where: { id: parsed.data.offerId }, data });

  // Hand off to Consumer app — fire-and-log. Don't fail the local action if the bridge is down.
  if (parsed.data.status === "ACCEPTED") {
    await syncAcceptedOfferToConsumer(offer.id).catch((err) => {
      console.error("[offer-accept] bridge sync failed", err);
    });
  }

  revalidatePath("/app/offers");
  revalidatePath("/app/candidates");
  revalidatePath(`/app/candidates/${offer.applicationId}`);
  return { ok: true };
}

async function syncAcceptedOfferToConsumer(offerId: string) {
  const consumerUrl = process.env.CONSUMER_API_URL;
  const apiKey = process.env.INTERNAL_API_KEY;
  if (!consumerUrl || !apiKey) {
    console.warn("[offer-accept] CONSUMER_API_URL or INTERNAL_API_KEY missing; skipping bridge");
    return;
  }

  const full = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          job: { include: { company: { include: { sponsorship: true } } } },
        },
      },
    },
  });
  if (!full) return;

  const a = full.application;
  const j = a.job;
  const c = j.company;

  // Derive destination country/city from the job location. Format is "City, XX" in our seed data.
  let destCountry = c.hqCountry ?? "DE";
  let destCity: string | null = c.hqCity ?? null;
  if (j.location) {
    const parts = j.location.split(",").map((s) => s.trim());
    if (parts.length >= 2 && parts[parts.length - 1].length === 2) {
      destCountry = parts[parts.length - 1].toUpperCase();
      destCity = parts.slice(0, -1).join(", ");
    } else if (parts[0]) {
      destCity = parts[0];
    }
  }

  const body = {
    candidateEmail: a.candidateEmail,
    candidateName: a.candidateName,
    passport: a.passport ?? null,
    profession: a.profession ?? null,
    yearsExp: a.yearsExp ?? null,

    employerName: c.name,
    employerSlug: c.slug,
    jobTitle: j.title,
    startDate: full.startDate ? full.startDate.toISOString() : null,
    salary: full.baseSalary,
    currency: full.currency,
    visaRoute: j.visaTier ?? null,

    destCountry,
    destCity,
    relocationBenefit: full.relocationBenefit ?? null,
  };

  const res = await fetch(`${consumerUrl}/api/internal/relocation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Consumer bridge returned ${res.status}: ${text.slice(0, 200)}`);
  }
}
