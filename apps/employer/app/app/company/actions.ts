"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  sponsorsCountries: z.array(z.string().length(2)).max(50),
  visaTiers: z.array(z.string().min(1)).max(20),
  relocationBenefit: z.string().max(120).optional().nullable(),
  remoteFriendly: z.boolean(),
});

export async function updateSponsorship(input: {
  sponsorsCountries: string[];
  visaTiers: string[];
  relocationBenefit: string | null;
  remoteFriendly: boolean;
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const m = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!m) return { ok: false, error: "No company" };

  await prisma.sponsorshipPolicy.upsert({
    where: { companyId: m.companyId },
    update: {
      sponsorsCountries: JSON.stringify(parsed.data.sponsorsCountries),
      visaTiers: JSON.stringify(parsed.data.visaTiers),
      relocationBenefit: parsed.data.relocationBenefit ?? null,
      remoteFriendly: parsed.data.remoteFriendly,
    },
    create: {
      companyId: m.companyId,
      sponsorsCountries: JSON.stringify(parsed.data.sponsorsCountries),
      visaTiers: JSON.stringify(parsed.data.visaTiers),
      relocationBenefit: parsed.data.relocationBenefit ?? null,
      remoteFriendly: parsed.data.remoteFriendly,
    },
  });

  revalidatePath("/app/company");
  return { ok: true };
}
