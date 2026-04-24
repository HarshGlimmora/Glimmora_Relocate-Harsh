import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/internal/jobs?passport=IN
// Returns active published jobs. If passport given, returns visa-aware fit flag per job.
// Called by the Consumer app's Discover page.

const querySchema = z.object({
  passport: z.string().length(2).optional(),
});

function visaFitFor(passport: string | undefined, eligible: string[], sponsors: boolean): "yes" | "maybe" | "no" {
  if (!passport) return "maybe";
  if (eligible.includes(passport)) return "yes";
  if (sponsors) return "maybe";
  return "no";
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ passport: url.searchParams.get("passport") || undefined });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const passport = parsed.data.passport?.toUpperCase();

  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE", publishedAt: { not: null } },
    include: { company: { select: { id: true, name: true, slug: true, hqCity: true, hqCountry: true, verified: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const payload = jobs.map((j) => {
    const eligible: string[] = JSON.parse(j.eligiblePassports || "[]");
    return {
      id: j.id,
      title: j.title,
      department: j.department,
      location: j.location,
      remote: j.remote,
      seniority: j.seniority,
      employmentType: j.employmentType,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      currency: j.currency,
      description: j.description,
      requirements: j.requirements,
      visaSponsorship: j.visaSponsorship,
      visaTier: j.visaTier,
      eligiblePassports: eligible,
      publishedAt: j.publishedAt?.toISOString() ?? null,
      company: j.company,
      visaFit: visaFitFor(passport, eligible, j.visaSponsorship),
    };
  });

  return NextResponse.json({ jobs: payload });
}
