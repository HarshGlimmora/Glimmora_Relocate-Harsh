import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EditJobForm } from "./edit-form";

export const metadata: Metadata = { title: "Edit role" };

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return null;

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job || job.companyId !== membership.companyId) notFound();

  const passports: string[] = JSON.parse(job.eligiblePassports || "[]");

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:px-10 md:py-14">
      <Link
        href={`/app/jobs/${job.id}`}
        className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to role
      </Link>
      <header className="mt-6 mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Edit role</p>
        <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          {job.title}
        </h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-ink-600">
          Update the role details. Changes are live as soon as you save.
        </p>
      </header>

      <EditJobForm
        job={{
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
          eligiblePassports: passports,
        }}
      />
    </div>
  );
}
