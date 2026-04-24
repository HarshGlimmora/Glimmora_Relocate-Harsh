"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getPublicJob,
  submitApplication,
} from "@/lib/employer-api";
import { scoreMatch, computeVisaFit } from "@/lib/matching";

type ActionResult =
  | { ok: true; applicationId: string; alreadyApplied: boolean }
  | { ok: false; error: string };

export async function applyToJobAction(jobId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { twin: true, profile: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const job = await getPublicJob(jobId).catch(() => null);
  if (!job) return { ok: false, error: "Job is no longer available" };

  const twin = {
    passport: user.profile?.nationality ?? null,
    currentCountry: user.profile?.currentCountry ?? null,
    profession: user.twin?.profession ?? null,
    yearsExp: user.twin?.yearsExperience ?? null,
    targetCountries: user.twin?.targetCountries ? (JSON.parse(user.twin.targetCountries) as string[]) : [],
  };

  const score = scoreMatch(twin, job);
  const fit = computeVisaFit(twin, { eligiblePassports: job.eligiblePassports, visaSponsorship: job.visaSponsorship });

  try {
    const res = await submitApplication({
      jobId,
      candidateEmail: user.email,
      candidateName: user.name ?? user.email,
      passport: twin.passport,
      currentCountry: twin.currentCountry,
      profession: twin.profession,
      yearsExp: twin.yearsExp,
      matchScore: score,
      visaFit: fit,
    });

    revalidatePath(`/app/discover/jobs/${jobId}`);
    revalidatePath("/app/career");
    return { ok: true, applicationId: res.applicationId, alreadyApplied: res.alreadyApplied };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not submit application";
    return { ok: false, error: msg };
  }
}
