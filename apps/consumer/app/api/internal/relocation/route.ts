import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  candidateEmail: z.string().email(),
  candidateName: z.string().min(1).max(120),
  passport: z.string().length(2).optional().nullable(),
  profession: z.string().max(120).optional().nullable(),
  yearsExp: z.number().int().nonnegative().optional().nullable(),

  employerName: z.string().min(1).max(160),
  employerSlug: z.string().max(60).optional().nullable(),
  jobTitle: z.string().min(1).max(160),
  startDate: z.string().datetime().optional().nullable(),
  salary: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  visaRoute: z.string().max(60).optional().nullable(),

  destCountry: z.string().length(2),
  destCity: z.string().max(80).optional().nullable(),

  relocationBenefit: z.string().max(160).optional().nullable(),
});

// Map a start date into an ordered milestone plan.
// Dates are best-effort estimates — a real implementation would have configurable templates
// per visa route + destination country.
function buildMilestones(startDate: Date | null): Array<{
  kind: string;
  title: string;
  description: string;
  order: number;
  dueDate: Date | null;
  status: string;
}> {
  const base = startDate ?? new Date();
  const offset = (days: number) => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d;
  };

  // All dates are offsets from the start date: negative = before start, positive = after.
  return [
    {
      kind: "OFFER_ACCEPTED",
      title: "Offer accepted",
      description: "Your offer is locked in. Your relocation plan is live.",
      dueDate: new Date(), // today
      order: 0,
      status: "DONE",
    },
    {
      kind: "VISA_APPLY",
      title: "Submit visa application",
      description: "Collect documents, translations, and apply through the partner lawyer.",
      dueDate: offset(-90),
      order: 1,
      status: "IN_PROGRESS",
    },
    {
      kind: "VISA_APPROVE",
      title: "Visa approved",
      description: "Embassy/consulate appointment and final approval.",
      dueDate: offset(-45),
      order: 2,
      status: "PENDING",
    },
    {
      kind: "HOUSING",
      title: "Secure housing",
      description: "Shortlist, tour virtually, sign a lease before you fly.",
      dueDate: offset(-30),
      order: 3,
      status: "PENDING",
    },
    {
      kind: "BANK",
      title: "Open local bank account",
      description: "Required for payroll. Book an in-person or eID-based appointment.",
      dueDate: offset(-14),
      order: 4,
      status: "PENDING",
    },
    {
      kind: "FLIGHTS",
      title: "Book flights",
      description: "Family + pet included. Relocation benefit reimburses on submission.",
      dueDate: offset(-10),
      order: 5,
      status: "PENDING",
    },
    {
      kind: "MOVE_IN",
      title: "Move in",
      description: "Meter readings, local SIM, doctor's registration.",
      dueDate: offset(-2),
      order: 6,
      status: "PENDING",
    },
    {
      kind: "START_DAY",
      title: "First day at work",
      description: "You're hired and on the ground. We check in after 30 days.",
      dueDate: startDate ?? base,
      order: 7,
      status: "PENDING",
    },
  ];
}

export async function POST(req: Request) {
  // Shared-secret auth. In production this becomes a signed JWT or mTLS.
  const auth = req.headers.get("authorization");
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const b = parsed.data;

  // Upsert user. If the candidate doesn't have a Consumer account yet, create one
  // with a random password — they'll pick up via magic-link invite (W3) or password reset.
  let user = await prisma.user.findUnique({ where: { email: b.candidateEmail } });
  if (!user) {
    const randomPassword = await bcrypt.hash(
      `placeholder-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      10
    );
    user = await prisma.user.create({
      data: {
        email: b.candidateEmail,
        passwordHash: randomPassword,
        name: b.candidateName,
        emailVerified: new Date(),
      },
    });
  }

  // Ensure Profile + Twin exist and reflect the employer-supplied context.
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: b.candidateName.split(" ")[0] ?? b.candidateName,
      lastName: b.candidateName.split(" ").slice(1).join(" ") || null,
      displayName: b.candidateName,
      nationality: b.passport ?? null,
    },
    update: {
      nationality: b.passport ?? undefined,
    },
  });

  await prisma.twin.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      profession: b.profession ?? null,
      yearsExperience: b.yearsExp ?? null,
      targetCountries: JSON.stringify([b.destCountry]),
      stage: "hired",
      readinessScore: 100,
    },
    update: {
      profession: b.profession ?? undefined,
      yearsExperience: b.yearsExp ?? undefined,
      targetCountries: JSON.stringify([b.destCountry]),
      stage: "hired",
      readinessScore: 100,
    },
  });

  const startDate = b.startDate ? new Date(b.startDate) : null;
  const milestones = buildMilestones(startDate);

  // Upsert relocation record. If it already exists, we replace milestones so the
  // plan is idempotent for re-sends from the Employer side.
  const existing = await prisma.relocation.findUnique({ where: { userId: user.id } });
  if (existing) {
    await prisma.relocationMilestone.deleteMany({ where: { relocationId: existing.id } });
  }

  const relocation = await prisma.relocation.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      employerName: b.employerName,
      employerSlug: b.employerSlug ?? null,
      jobTitle: b.jobTitle,
      startDate,
      salary: b.salary ?? null,
      currency: b.currency ?? "EUR",
      visaRoute: b.visaRoute ?? null,
      destCountry: b.destCountry,
      destCity: b.destCity ?? null,
      status: "ACTIVE",
      acceptedAt: new Date(),
      milestones: { create: milestones },
    },
    update: {
      employerName: b.employerName,
      employerSlug: b.employerSlug ?? null,
      jobTitle: b.jobTitle,
      startDate,
      salary: b.salary ?? null,
      currency: b.currency ?? "EUR",
      visaRoute: b.visaRoute ?? null,
      destCountry: b.destCountry,
      destCity: b.destCity ?? null,
      status: "ACTIVE",
      acceptedAt: new Date(),
      milestones: { create: milestones },
    },
    include: { milestones: true },
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    relocationId: relocation.id,
    milestonesCreated: relocation.milestones.length,
  });
}
