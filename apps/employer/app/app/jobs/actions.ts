"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const editSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(3).max(120),
  department: z.string().max(80).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  remote: z.string().max(20).optional().nullable(),
  seniority: z.string().max(20).optional().nullable(),
  employmentType: z.string().max(20).optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3),
  description: z.string().max(8000).optional().nullable(),
  requirements: z.string().max(4000).optional().nullable(),
  visaSponsorship: z.boolean(),
  visaTier: z.string().max(60).optional().nullable(),
  eligiblePassports: z.array(z.string().length(2)).max(50),
});

export async function updateJob(input: {
  jobId: string;
  title: string;
  department: string | null;
  location: string | null;
  remote: string | null;
  seniority: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  description: string | null;
  requirements: string | null;
  visaSponsorship: boolean;
  visaTier: string | null;
  eligiblePassports: string[];
}): Promise<ActionResult> {
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return { ok: false, error: "No company" };

  const existing = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!existing || existing.companyId !== membership.companyId) return { ok: false, error: "Not authorized" };

  await prisma.job.update({
    where: { id: parsed.data.jobId },
    data: {
      title: parsed.data.title,
      department: parsed.data.department || null,
      location: parsed.data.location || null,
      remote: parsed.data.remote || null,
      seniority: parsed.data.seniority || null,
      employmentType: parsed.data.employmentType || null,
      salaryMin: parsed.data.salaryMin ?? null,
      salaryMax: parsed.data.salaryMax ?? null,
      currency: parsed.data.currency,
      description: parsed.data.description || null,
      requirements: parsed.data.requirements || null,
      visaSponsorship: parsed.data.visaSponsorship,
      visaTier: parsed.data.visaTier || null,
      eligiblePassports: JSON.stringify(parsed.data.eligiblePassports),
    },
  });

  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${parsed.data.jobId}`);
  return { ok: true };
}

const schema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["ACTIVE", "CLOSED", "DRAFT"]),
});

export async function setJobStatus(jobId: string, status: string): Promise<ActionResult> {
  const parsed = schema.safeParse({ jobId, status });
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return { ok: false, error: "No company" };

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.companyId !== membership.companyId) return { ok: false, error: "Not authorized" };

  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "CLOSED") data.closedAt = new Date();
  if (parsed.data.status === "ACTIVE" && !job.publishedAt) data.publishedAt = new Date();

  await prisma.job.update({ where: { id: parsed.data.jobId }, data });

  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${parsed.data.jobId}`);
  return { ok: true };
}
