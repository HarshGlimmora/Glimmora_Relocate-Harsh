import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Check, User, Briefcase, Building2, Building, ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent pricing. Candidates free. Employers pay on hire. Partners pay on booking. Companies pay on contract.",
};

const EMPLOYER_URL = process.env.NEXT_PUBLIC_EMPLOYER_URL ?? "http://localhost:3002/sign-up";
const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3004/sign-up";
const CORPORATE_URL = process.env.NEXT_PUBLIC_CORPORATE_URL ?? "http://localhost:3005/sign-up";

export default function PricingPage() {
  return (
    <main>
      <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Pricing</p>
        <h1 className="mt-4 font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
          No subscriptions. <br />Pay only when it works.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
          Four audiences, four pricing models, all transparent. Candidates never pay. Everyone else pays in proportion to the value we deliver.
        </p>
      </section>

      {/* 4 cards */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PriceCard
            Icon={User}
            audience="Candidates"
            price="Free"
            sub="Always"
            body="Glimmora is always free for the person moving. No paywalls on country comparison, job matching, plan, or marketplace browsing."
            features={[
              "Compare countries, salaries, tax",
              "Get matched to visa-aware jobs",
              "Full relocation plan with Copilot",
              "Access to verified marketplace",
              "Unlimited messages with partners",
            ]}
            ctaLabel="Start my plan"
            ctaHref="/sign-up"
            accent="ink"
          />
          <PriceCard
            Icon={Briefcase}
            audience="Employers"
            price="8%"
            sub="of first-year salary · only on close"
            body="No posting fees. No seat fees. You pay only when a candidate accepts your offer and actually starts."
            features={[
              "Unlimited job postings",
              "Visa-aware candidate matching",
              "Full hiring pipeline (interview, offer, hire)",
              "Auto relocation hand-off on close",
              "Team seats included (up to 10)",
            ]}
            ctaLabel="Start hiring"
            ctaHref={EMPLOYER_URL}
            accent="gilt"
            featured
          />
          <PriceCard
            Icon={Building}
            audience="Partners"
            price="5%"
            sub="marketplace spread · only on paid bookings"
            body="KYB-verified. Customer funds held in escrow. You pay a flat marketplace spread on bookings you fulfil. No listing fees."
            features={[
              "Unlimited listings across 5 categories",
              "Booking pipeline with escrow",
              "Quality-tier search ranking",
              "Weekly batched payouts",
              "Customer message threads",
            ]}
            ctaLabel="Apply to list"
            ctaHref={PARTNER_URL}
            accent="plum"
          />
          <PriceCard
            Icon={Building2}
            audience="Companies"
            price="Enterprise"
            sub="annual contract · success-fee + marketplace"
            body="Bulk relocation management for HR and Global Mobility teams. Pricing blends success fees with optional flat-fee pilots."
            features={[
              "Unlimited employees + policies",
              "Approval workflows + audit log",
              "SSO + SCIM provisioning",
              "GDPR + SOC 2 Type II",
              "Dedicated Customer Success manager",
            ]}
            ctaLabel="Book a demo"
            ctaHref={CORPORATE_URL}
            accent="moss"
          />
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">What you get</p>
          <h2 className="mt-3 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
            Feature matrix, side by side.
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-ink-200">
          <table className="w-full min-w-[700px] text-left text-[13.5px]">
            <thead className="bg-ink-50 text-ink-700">
              <tr>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-medium">Feature</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-medium">Candidates</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-medium">Employers</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-medium">Partners</th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-medium">Companies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 bg-white">
              {[
                ["Discovery tools", true, true, true, true],
                ["Relocation plan with Copilot", true, false, false, true],
                ["Job posting + ATS", false, true, false, false],
                ["Visa-aware ranking", true, true, false, true],
                ["Marketplace inventory", false, false, true, false],
                ["Escrow on bookings", true, false, true, true],
                ["Policy & approval workflows", false, false, false, true],
                ["SSO / SCIM", false, "Paid add-on", "Paid add-on", true],
                ["Quarterly analytics reports", false, true, true, true],
                ["Dedicated CS manager", false, "Over 50 hires/yr", false, true],
              ].map(([feature, c, e, p, co], i) => (
                <tr key={i} className="hover:bg-parchment/50">
                  <td className="px-5 py-4 font-sans font-semibold text-ink-900">{feature}</td>
                  <Cell value={c} />
                  <Cell value={e} />
                  <Cell value={p} />
                  <Cell value={co} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">FAQ</p>
          <h2 className="mt-3 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
            What people ask us.
          </h2>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          <FAQ
            q="Is Glimmora really free for candidates?"
            a="Yes — always. The value to you is in the tools and the plan. We monetise the other side of the marketplace (employers who hire, partners who fulfil)."
          />
          <FAQ
            q="When does the 8% employer fee trigger?"
            a="On candidate start date, not offer signature. If the candidate withdraws before day 1 (rare, ~3% of cases), you pay nothing. Invoiced quarterly in arrears."
          />
          <FAQ
            q="What counts as a 'closed hire' for the success fee?"
            a="A candidate introduced via Glimmora's platform who accepts your offer and starts work. The fee is calculated on their gross first-year base salary, excluding bonuses and equity."
          />
          <FAQ
            q="Can partners pay a subscription instead of the marketplace spread?"
            a="Top-tier partners (>100 bookings/quarter) can move to a custom contract with a lower marketplace fee + a monthly platform fee. Contact sales."
          />
          <FAQ
            q="Do you handle payroll or EOR?"
            a="No. Glimmora is not an EOR. We match, pipeline, and relocate — your existing entity or EOR of choice handles payroll. We integrate with Deel, Remote, and Globalization Partners."
          />
          <FAQ
            q="Is this really per-country visa accurate?"
            a="The visa knowledge base is maintained by our legal partner network across 8 jurisdictions. We review quarterly and update in real time when rules change (e.g. when the EU Blue Card thresholds moved in 2023)."
          />
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_auto] md:items-end">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Still weighing it?
              </h2>
              <p className="mt-3 max-w-xl text-[14.5px] text-white/70 leading-[1.6]">
                Candidates sign up free. Employers trial for 14 days. Partners apply and review the numbers. Companies get a free pilot for 5 moves. You decide what "worth it" means.
              </p>
            </div>
            <Link href="/sign-up" className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PriceCard({
  Icon, audience, price, sub, body, features, ctaLabel, ctaHref, accent, featured,
}: {
  Icon: typeof User; audience: string; price: string; sub: string; body: string;
  features: string[]; ctaLabel: string; ctaHref: string;
  accent: "ink" | "gilt" | "plum" | "moss"; featured?: boolean;
}) {
  const accentBg =
    accent === "gilt" ? "bg-gilt-500 text-ink-900" :
    accent === "plum" ? "bg-[#6B3E8A] text-white" :
    accent === "moss" ? "bg-[#2F7D66] text-white" :
    "bg-ink-900 text-parchment";
  const cardBg = featured ? "border-gilt-300 bg-gilt-50/40" : "border-ink-200 bg-white";
  const ctaBg =
    accent === "gilt" ? "bg-ink-900 text-parchment hover:bg-ink-800" :
    accent === "plum" ? "bg-[#6B3E8A] text-white hover:bg-[#512E69]" :
    accent === "moss" ? "bg-[#2F7D66] text-white hover:bg-[#246455]" :
    "bg-ink-900 text-parchment hover:bg-ink-800";
  return (
    <article className={`relative rounded-2xl border p-6 md:p-7 ${cardBg}`}>
      {featured ? (
        <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-gilt-500 border border-gilt-600 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-900 font-semibold">
          Most popular
        </span>
      ) : null}
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${accentBg}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{audience}</p>
      <p className="mt-3 font-sans text-[clamp(2.5rem,4.5vw,3.5rem)] font-semibold leading-none tracking-[-0.03em] text-ink-900">
        {price}
      </p>
      <p className="mt-2 text-[12.5px] text-ink-600 font-mono uppercase tracking-[0.16em]">{sub}</p>
      <p className="mt-5 text-[13.5px] leading-[1.6] text-ink-700">{body}</p>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-ink-700">
            <Check className="mt-0.5 h-3.5 w-3.5 text-lagoon-600 shrink-0" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[13.5px] font-semibold transition-colors ${ctaBg}`}
      >
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <td className="px-5 py-4"><Check className="h-4 w-4 text-lagoon-600" strokeWidth={2.5} /></td>;
  if (value === false) return <td className="px-5 py-4"><span className="text-ink-300">—</span></td>;
  return <td className="px-5 py-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600">{value}</td>;
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
      <p className="font-sans text-[15.5px] font-semibold tracking-tight text-ink-900">{q}</p>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-600">{a}</p>
    </li>
  );
}
