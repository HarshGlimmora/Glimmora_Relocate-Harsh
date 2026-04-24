import type { Metadata } from "next";
import { CreditCard, FileText, Check, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Account</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Billing.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Post roles for free. Pay only when you hire — 8% of first-year salary.
        </p>
      </header>

      <section className="mb-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lagoon-500/20 blur-[60px]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-300">Current plan</span>
              <span className="rounded-full bg-success-500/20 border border-success-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success-300">Active</span>
            </div>
            <h2 className="mt-5 font-sans text-[28px] font-semibold tracking-tight">Success fee</h2>
            <p className="mt-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">
              8%<span className="text-[16px] font-normal text-white/50"> of first-year salary</span>
            </p>
            <p className="mt-3 max-w-md text-[14px] text-white/70">Charged only when you close a hire. No posting fees, no seat fees.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                disabled
                title="Stripe Connect wires with the billing milestone (W4)."
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed"
              >
                Add billing details
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-300">W4</span>
              </button>
            </div>
            <p className="mt-5 text-[11px] text-white/40">Stripe Connect wires at W4. Until then, there's nothing for you to do — we'll prompt for details when your first hire lands.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Payment method</p>
          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
            <CreditCard className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <p className="mt-5 font-sans text-[17px] font-semibold tracking-tight text-ink-900">No payment method</p>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-600">
            Add one when you're ready to hire. We invoice per hire.
          </p>
          <button
            disabled
            title="Stripe payment methods land with W4."
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-parchment text-[13px] font-medium text-ink-500 cursor-not-allowed"
          >
            Add payment method
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W4</span>
          </button>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">What's included</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Unlimited job postings",
            "Visa-aware matching + AI ranking",
            "Unlimited candidate pipeline",
            "Interview scheduling + feedback",
            "Offer templates + negotiation threads",
            "Full relocation hand-off to candidate plans",
            "Team members (up to 10)",
            "ATS sync (Greenhouse, Lever, Workday)",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
              <Check className="h-4 w-4 shrink-0 text-lagoon-600" strokeWidth={2.5} />
              <span className="text-[13.5px] text-ink-800">{f}</span>
            </div>
          ))}
        </div>
      </section>

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
          <p className="mt-2 text-[13px] text-ink-500">When you make your first hire, an invoice lands here.</p>
        </div>
      </section>
    </div>
  );
}
