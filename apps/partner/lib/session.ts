import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Return the partner + current user for the signed-in operator. Redirects if unauthorised.
// Every server action starts with this.
export async function requirePartnerSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.partnerUser.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        take: 1,
        include: { partner: true },
      },
    },
  });
  if (!user) redirect("/sign-in");
  const membership = user.memberships[0];
  if (!membership) redirect("/sign-in");

  return { user, partner: membership.partner, membership };
}
