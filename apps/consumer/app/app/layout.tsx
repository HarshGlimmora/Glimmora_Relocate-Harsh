import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { INTENTS, isIntent } from "@/lib/intent";
import { getWorkflowStatus } from "@/lib/backend/workflow-status";
import { AppShell } from "./_shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Fetch minimal user record for topbar + shell + intent + payment gate
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      intent: true,
      subscription: { select: { tier: true } },
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  // Payment gate: unpaid users must complete checkout (or use the dev bypass
  // on /payment) before they can access the dashboard or any module.
  if (!user.subscription || user.subscription.tier === "FREE") {
    redirect("/payment");
  }

  const intent = user.intent && isIntent(user.intent) ? INTENTS[user.intent] : null;

  // Best-effort completion map for sidebar check indicators + auto-skip.
  // Failures are swallowed inside `getWorkflowStatus`; an empty map just
  // means no checkmarks, not a broken page.
  const { completion } = await getWorkflowStatus();

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image }}
      intentEmphasis={intent?.emphasis ?? null}
      intentLabel={intent?.label ?? null}
      completion={completion}
    >
      {children}
    </AppShell>
  );
}
