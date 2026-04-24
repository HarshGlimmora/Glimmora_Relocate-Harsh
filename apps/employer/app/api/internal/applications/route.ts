import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// POST /api/internal/applications — submit an application (Consumer → Employer)
// GET  /api/internal/applications?email=... — list applications for a candidate email
//                                              (Consumer's Career page consumes this)

const submitSchema = z.object({
  jobId: z.string().min(1),
  candidateEmail: z.string().email(),
  candidateName: z.string().min(1).max(160),
  passport: z.string().length(2).optional().nullable(),
  currentCountry: z.string().length(2).optional().nullable(),
  profession: z.string().max(120).optional().nullable(),
  yearsExp: z.number().int().nonnegative().max(60).optional().nullable(),
  // Match score + visa fit computed by Consumer with a mock heuristic for now.
  // When the real matching engine lands, it will recompute both here and mark `source`.
  matchScore: z.number().int().min(0).max(100),
  visaFit: z.enum(["yes", "maybe", "no", "unknown"]),
});

function authorized(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.INTERNAL_API_KEY;
  return !!expected && auth === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const job = await prisma.job.findUnique({ where: { id: b.jobId } });
  if (!job || job.status !== "ACTIVE") {
    return NextResponse.json({ error: "Job not open" }, { status: 404 });
  }

  // One application per (job, email). If already applied, return the existing row.
  const existing = await prisma.application.findFirst({
    where: { jobId: b.jobId, candidateEmail: b.candidateEmail },
    select: { id: true, stage: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: true, applicationId: existing.id, stage: existing.stage, alreadyApplied: true },
      { status: 200 }
    );
  }

  const created = await prisma.application.create({
    data: {
      jobId: b.jobId,
      candidateName: b.candidateName,
      candidateEmail: b.candidateEmail,
      passport: b.passport ?? null,
      currentCountry: b.currentCountry ?? null,
      profession: b.profession ?? null,
      yearsExp: b.yearsExp ?? null,
      matchScore: b.matchScore,
      visaFit: b.visaFit,
      stage: "NEW",
    },
  });

  return NextResponse.json({
    ok: true,
    applicationId: created.id,
    stage: created.stage,
    alreadyApplied: false,
  });
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email query required" }, { status: 400 });

  const apps = await prisma.application.findMany({
    where: { candidateEmail: email.toLowerCase() },
    include: {
      job: { include: { company: { select: { id: true, name: true, slug: true } } } },
      interviews: { orderBy: { scheduledAt: "asc" }, select: { id: true, kind: true, scheduledAt: true } },
      offers: { orderBy: { updatedAt: "desc" }, select: { id: true, status: true, baseSalary: true, currency: true, startDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    applications: apps.map((a) => ({
      id: a.id,
      stage: a.stage,
      matchScore: a.matchScore,
      visaFit: a.visaFit,
      appliedAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      job: {
        id: a.job.id,
        title: a.job.title,
        location: a.job.location,
        seniority: a.job.seniority,
        salaryMin: a.job.salaryMin,
        salaryMax: a.job.salaryMax,
        currency: a.job.currency,
        visaTier: a.job.visaTier,
        company: a.job.company,
      },
      nextInterview: a.interviews.find((i) => i.scheduledAt && i.scheduledAt > new Date()) ?? null,
      activeOffer: a.offers.find((o) => o.status === "SENT" || o.status === "ACCEPTED") ?? null,
    })),
  });
}
