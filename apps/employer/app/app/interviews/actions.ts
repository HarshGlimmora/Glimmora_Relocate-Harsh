"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  interviewId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(1).max(2000),
});

export async function submitFeedback(input: {
  interviewId: string;
  rating: number;
  feedback: string;
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please add feedback and pick a rating." };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return { ok: false, error: "No company" };

  // Confirm the interview belongs to this company
  const interview = await prisma.interview.findUnique({
    where: { id: parsed.data.interviewId },
    include: { application: { include: { job: true } } },
  });
  if (!interview || interview.application.job.companyId !== membership.companyId) {
    return { ok: false, error: "Not authorized" };
  }

  await prisma.interview.update({
    where: { id: parsed.data.interviewId },
    data: {
      rating: parsed.data.rating,
      feedback: parsed.data.feedback.trim(),
    },
  });

  revalidatePath("/app/interviews");
  revalidatePath(`/app/candidates/${interview.applicationId}`);
  return { ok: true };
}
