import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, FileText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CurrentPlanCard } from "./current-plan-card";
import { PlansExplorer } from "./plans-explorer";

export const metadata: Metadata = { title: "Billing" };

type TierKey = "FREE" | "BASE" | "PREMIUM";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const currentTier = (sub?.tier ?? "FREE") as TierKey;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Account</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Billing &amp; subscription.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Glimmora is quiet software that earns its keep. Simple plans, no surprises.
        </p>
      </header>

      <div className="space-y-10">
        {/* ============ Current plan + payment method tile ============ */}
        <CurrentPlanCard
          currentTier={currentTier}
          status={sub?.status}
          currentPeriodEnd={sub?.currentPeriodEnd ?? null}
          cancelAtPeriodEnd={!!sub?.cancelAtPeriodEnd}
        />

        {/* ============ Interactive plans explorer + comparison matrix ============ */}
        <PlansExplorer currentTier={currentTier} />

        {/* ============ Invoices ============ */}
        <section>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">03</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Invoices</span>
          </div>

          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <FileText className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">No invoices yet.</h3>
            <p className="mt-2 text-[13px] text-ink-500">When you subscribe, invoices appear here as monthly receipts you can download.</p>

            {/* Visual placeholder of what an invoice row will look like */}
            <div className="mx-auto mt-6 max-w-md space-y-1.5 text-left">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  data-invoice-placeholder={i}
                  className="flex items-center justify-between rounded-xl border border-dashed border-ink-200 bg-white/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-ink-100" />
                    <div>
                      <span className="block h-2 w-24 rounded-full bg-ink-100" />
                      <span className="mt-1 block h-1.5 w-16 rounded-full bg-ink-50" />
                    </div>
                  </div>
                  <span className="h-2 w-12 rounded-full bg-ink-100" />
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium">
            <Sparkles className="h-3 w-3 text-gilt-600" />
            <Link href="/app/messages" className="hover:text-ink-900">Questions about billing? Ask the Copilot →</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
