import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Sparkles, ArrowUpRight, FileText, CreditCard } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

const plans = {
  FREE:    { name: "Explore",         price: "$0",          desc: "Free tier — explore without commitment." },
  BASE:    { name: "Glimmora Base",   price: "$100 / year", desc: "Full Copilot + plan execution + marketplace." },
  PREMIUM: { name: "Premium",         price: "$240 / year", desc: "Base + Verified Human Experts + priority support." },
} as const;

const COMING_SOON_TITLE = "Subscription billing arrives soon — UI is preview only.";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const currentTier = (sub?.tier ?? "FREE") as keyof typeof plans;
  const current = plans[currentTier];

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

      {/* Current plan hero */}
      <section className="mb-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gilt-500/20 blur-[60px]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300">
                Current plan
              </span>
              <span className="rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-300">
                {sub?.status ?? "active"}
              </span>
            </div>
            <h2 className="mt-5 font-sans text-[28px] font-semibold tracking-tight">{current.name}</h2>
            <p className="mt-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">
              {current.price}
            </p>
            <p className="mt-3 max-w-md text-[14px] text-white/70">{current.desc}</p>

            <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">Renews</p>
                <p className="mt-1 text-[14px]">{sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">Cancellation</p>
                <p className="mt-1 text-[14px]">{sub?.cancelAtPeriodEnd ? "Ends at period close" : "Not scheduled"}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {currentTier === "FREE" ? (
                <button
                  type="button"
                  disabled
                  title={COMING_SOON_TITLE}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed"
                >
                  Upgrade to Base <ArrowUpRight className="h-4 w-4" />
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">Coming soon</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    title={COMING_SOON_TITLE}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed"
                  >
                    Manage plan
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">Coming soon</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title={COMING_SOON_TITLE}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[13.5px] font-medium text-white/60 cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <p className="mt-5 text-[11px] text-white/40">
              Subscription billing arrives soon. Buttons above are preview only.
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Payment method</p>
          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
            <CreditCard className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <p className="mt-5 font-sans text-[17px] font-semibold tracking-tight text-ink-900">No card on file</p>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-600">
            Add a payment method when you upgrade. Stripe handles storage — your card never touches our servers.
          </p>
          <button
            type="button"
            disabled
            title={COMING_SOON_TITLE}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white text-[13px] font-medium text-ink-500 cursor-not-allowed"
          >
            Add payment method
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">Coming soon</span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">All plans</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = currentTier === key;
            const isBase = key === "BASE";
            return (
              <article key={key} className={`rounded-2xl p-6 md:p-7 ${isCurrent ? "ring-2 ring-ink-900 bg-white border border-ink-900" : isBase ? "bg-ink-900 text-parchment border border-ink-900" : "bg-white border border-ink-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${isBase && !isCurrent ? "text-gilt-300" : "text-ink-500"}`}>{plan.name}</span>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-50 border border-lagoon-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} /> Current
                    </span>
                  ) : isBase ? (
                    <span className="rounded-full bg-gilt-400 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-900">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className={`mt-6 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] ${isBase && !isCurrent ? "text-parchment" : "text-ink-900"}`}>
                  {plan.price}
                </p>
                <p className={`mt-2 text-[13px] ${isBase && !isCurrent ? "text-white/60" : "text-ink-500"}`}>{plan.desc}</p>

                <ul className="mt-6 space-y-2 text-[13px]">
                  {(key === "FREE" ? [
                    "Country comparison, simulator",
                    "Visa-aware job discovery",
                    "10 Copilot / month",
                  ] : key === "BASE" ? [
                    "Unlimited Copilot",
                    "Documents vault",
                    "Marketplace + escrow",
                    "Family twin",
                  ] : [
                    "Everything in Base",
                    "Verified Human Experts",
                    "Priority support",
                  ]).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isBase && !isCurrent ? "text-gilt-400" : "text-lagoon-600"}`} strokeWidth={2.5} />
                      <span className={isBase && !isCurrent ? "text-white/85" : "text-ink-700"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  title={isCurrent ? "You're on this plan." : COMING_SOON_TITLE}
                  className={`mt-6 inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-medium cursor-not-allowed ${
                    isCurrent
                      ? "bg-ink-100 text-ink-500"
                      : isBase
                      ? "border border-white/15 bg-white/5 text-white/60"
                      : "border border-ink-200 bg-white text-ink-500"
                  }`}
                >
                  {isCurrent ? "Current plan" : `Choose ${key === "BASE" ? "Base" : key === "PREMIUM" ? "Premium" : "Explore"}`}
                  {!isCurrent ? (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${isBase ? "bg-white/10 text-white/60" : "bg-ink-100 text-ink-600"}`}>Coming soon</span>
                  ) : null}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Invoices</span>
        </div>

        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <FileText className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">No invoices yet.</h3>
          <p className="mt-2 text-[13px] text-ink-500">When you subscribe, invoices appear here.</p>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium">
          <Sparkles className="h-3 w-3 text-gilt-600" />
          <Link href="/app/messages" className="hover:text-ink-900">Questions about billing? Ask the Copilot →</Link>
        </p>
      </section>
    </div>
  );
}
