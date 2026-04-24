"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCorporateSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  approvalId: z.string().min(1),
  decision: z.enum(["APPROVED", "DECLINED"]),
  note: z.string().max(600).optional().nullable(),
});

export async function decideApproval(input: { approvalId: string; decision: "APPROVED" | "DECLINED"; note?: string | null }): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { organization, user } = await requireCorporateSession();

  const approval = await prisma.approval.findUnique({
    where: { id: parsed.data.approvalId },
    include: { employee: true },
  });
  if (!approval || approval.organizationId !== organization.id) return { ok: false, error: "Not authorised" };

  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: parsed.data.decision,
      decidedBy: user.name ?? user.email,
      decidedAt: new Date(),
      decidedNote: parsed.data.note ?? null,
    },
  });

  // If BUDGET_OVERRIDE approved, bump the employee's active case budget cap
  if (parsed.data.decision === "APPROVED" && approval.kind === "BUDGET_OVERRIDE" && approval.requestedAmount) {
    const activeCase = await prisma.relocationCase.findFirst({
      where: { employeeId: approval.employeeId, status: "ACTIVE" },
    });
    if (activeCase) {
      await prisma.relocationCase.update({
        where: { id: activeCase.id },
        data: { budgetCap: approval.requestedAmount },
      });
    }
  }

  revalidatePath("/app/approvals");
  revalidatePath("/app");
  revalidatePath(`/app/employees/${approval.employeeId}`);
  return { ok: true };
}
