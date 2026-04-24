"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const stageSchema = z.object({
  applicationId: z.string().min(1),
  stage: z.enum(["NEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
});

const noteSchema = z.object({
  applicationId: z.string().min(1),
  notes: z.string().max(5000),
});

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function authedMembership() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.membership.findFirst({ where: { userId: session.user.id } });
}

/** Move an application to a new stage. Verifies the user owns the company. */
export async function moveStage(applicationId: string, stage: string): Promise<ActionResult> {
  const parsed = stageSchema.safeParse({ applicationId, stage });
  if (!parsed.success) return { ok: false, error: "Invalid stage." };

  const m = await authedMembership();
  if (!m) return { ok: false, error: "Not signed in." };

  const app = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { job: { select: { companyId: true } } },
  });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.job.companyId !== m.companyId) return { ok: false, error: "Not your candidate." };

  await prisma.application.update({
    where: { id: parsed.data.applicationId },
    data: { stage: parsed.data.stage },
  });

  revalidatePath("/app/candidates");
  revalidatePath(`/app/candidates/${parsed.data.applicationId}`);
  revalidatePath("/app");
  return { ok: true, message: `Moved to ${parsed.data.stage}` };
}

export async function saveNote(applicationId: string, notes: string): Promise<ActionResult> {
  const parsed = noteSchema.safeParse({ applicationId, notes });
  if (!parsed.success) return { ok: false, error: "Note too long." };

  const m = await authedMembership();
  if (!m) return { ok: false, error: "Not signed in." };

  const app = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { job: { select: { companyId: true } } },
  });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.job.companyId !== m.companyId) return { ok: false, error: "Not your candidate." };

  await prisma.application.update({
    where: { id: parsed.data.applicationId },
    data: { notes: parsed.data.notes },
  });

  revalidatePath(`/app/candidates/${parsed.data.applicationId}`);
  return { ok: true, message: "Note saved" };
}
