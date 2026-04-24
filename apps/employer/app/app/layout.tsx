import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "./_shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, title: true,
      memberships: { include: { company: true }, take: 1 },
    },
  });

  if (!user) redirect("/sign-in");
  const membership = user.memberships[0];
  if (!membership) redirect("/sign-in");

  return (
    <AppShell
      user={{ name: user.name, email: user.email, title: user.title }}
      companyName={membership.company.name}
    >
      {children}
    </AppShell>
  );
}
