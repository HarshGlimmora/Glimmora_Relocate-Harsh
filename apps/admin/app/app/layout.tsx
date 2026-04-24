import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OpsShell } from "./_shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) redirect("/sign-in");

  return (
    <OpsShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </OpsShell>
  );
}
