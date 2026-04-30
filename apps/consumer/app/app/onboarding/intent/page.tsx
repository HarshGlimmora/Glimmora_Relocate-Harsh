import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { INTENTS, INTENT_IDS } from "@/lib/intent";
import { IntentPicker } from "./intent-picker";

export const metadata: Metadata = { title: "What kind of move is this?" };
export const dynamic = "force-dynamic";

export default async function IntentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { intent: true },
  });

  return (
    <div className="mx-auto max-w-[860px] px-6 py-12">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
        Step 1 · Intent
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-ink-900">
        What kind of move is this?
      </h1>
      <p className="mt-2 max-w-[640px] text-[14px] leading-[1.55] text-ink-600">
        Pick the closest fit. We'll lead with the modules that matter most for
        you and frame every page around this. You can change this later.
      </p>
      <IntentPicker
        initial={u?.intent ?? null}
        options={INTENT_IDS.map((id) => ({
          id,
          label: INTENTS[id].label,
          hint: INTENTS[id].hint,
        }))}
      />
    </div>
  );
}
