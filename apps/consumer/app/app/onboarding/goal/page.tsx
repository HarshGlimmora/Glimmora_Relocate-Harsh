import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { INTENTS, INTENT_IDS } from "@/lib/intent";
import { OnboardingShell } from "../_step-shell";
import { GoalForm } from "./goal-form";

export const metadata: Metadata = { title: "Your move" };
export const dynamic = "force-dynamic";

export default async function GoalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { intent: true },
  });

  return (
    <OnboardingShell
      active="goal"
      title="Tell us what kind of move this is."
      description="One choice + one line. We'll lead with the modules that matter most for you and frame every page around this. Change anytime later."
    >
      <GoalForm
        initialIntent={u?.intent ?? null}
        options={INTENT_IDS.map((id) => ({
          id,
          label: INTENTS[id].label,
          hint: INTENTS[id].hint,
        }))}
      />
    </OnboardingShell>
  );
}
