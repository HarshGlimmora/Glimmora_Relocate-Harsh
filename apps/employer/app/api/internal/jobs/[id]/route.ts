import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/internal/jobs/[id]
// Full job detail for the Consumer app's job page.

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get("authorization");
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      company: {
        select: {
          id: true, name: true, slug: true, hqCity: true, hqCountry: true, verified: true,
          about: true, website: true, industry: true, size: true,
        },
      },
      _count: { select: { applications: true } },
    },
  });
  if (!job || job.status !== "ACTIVE" || !job.publishedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    remote: job.remote,
    seniority: job.seniority,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    description: job.description,
    requirements: job.requirements,
    visaSponsorship: job.visaSponsorship,
    visaTier: job.visaTier,
    eligiblePassports: JSON.parse(job.eligiblePassports || "[]"),
    publishedAt: job.publishedAt?.toISOString() ?? null,
    company: job.company,
    applicantCount: job._count.applications,
  });
}
