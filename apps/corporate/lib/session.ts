import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireCorporateSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.corporateUser.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        take: 1,
        include: { organization: true },
      },
    },
  });
  if (!user) redirect("/sign-in");
  const membership = user.memberships[0];
  if (!membership) redirect("/sign-in");

  return { user, organization: membership.organization, membership };
}
