import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Home, GraduationCap, Scale, Landmark, Wifi, ShieldCheck, Wallet, Star, TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For partners",
  description: "Sell housing, schools, banking, legal, and local services to relocating professionals across the EU. Verified inventory, escrow-protected bookings.",
};

const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3004/sign-up";

export default function ForPartnersPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#F6F0FA]/60 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#6B3E8A] font-medium">For partners</p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            Relocating clients, <br />all year, arriving ready.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            Glimmora for Partners brings pre-qualified, insured bookings to your housing, school, legal, banking, or local services business. Every customer is a relocating professional with verified financials and a clear timeline.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={PARTNER_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#6B3E8A] pl-6 pr-5 text-[14px] font-semibold text-white hover:bg-[#512E69]"
            >
              Apply to join <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900">
              Marketplace terms
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            KYB verification · Escrow on every booking · 5% marketplace fee only on paid bookings
          </p>
        </div>
      </section>

      {/* Categories we accept */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Who we partner with</p>
          <h2 className="mt-3 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
            Five categories. Eight countries. Thousands of movers a quarter.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Category Icon={Home}          label="Housing"  example="Furnished apartments, relocation-ready lets, corporate stays" />
          <Category Icon={GraduationCap} label="Schools"  example="International schools, kita placements, tutor networks" />
          <Category Icon={Scale}         label="Legal · Visa" example="Immigration lawyers, family reunification, tax advisory" />
          <Category Icon={Landmark}      label="Banking"  example="Account opening, expat mortgages, FX and transfer specialists" />
          <Category Icon={Wifi}          label="Local services"  example="Movers, language schools, health insurance, phone + internet" />
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            Icon={ShieldCheck}
            title="Pre-qualified customers"
            body="Every mover on Glimmora has verified identity, valid work offer, and a confirmed timeline. No tire-kickers. No flaky deposits."
            tint="plum"
          />
          <ValueCard
            Icon={Wallet}
            title="Escrow-protected bookings"
            body="Glimmora holds customer funds until fulfilment — your security, their insurance. Payouts release automatically when you mark the booking complete."
            tint="plum"
          />
          <ValueCard
            Icon={Star}
            title="Quality tier rankings"
            body="Partners with fast response times and high review scores rise in search. Your hustle actually pays off. The best partners on the platform see 3-4× traffic of the median."
            tint="plum"
          />
        </div>
      </section>

      {/* How to list */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">How listing works</span>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          <Step n="01" title="Apply with your business details" body="Certificate of incorporation, tax registration, proof of address, director ID, and liability insurance. Typical review: 2-3 business days." />
          <Step n="02" title="Set up your inventory" body="Apartments, school seats, legal packages, bank-appointment slots — whatever you offer. Pricing, capacity, photos, attributes. Publish when you're ready." />
          <Step n="03" title="Respond to bookings inside the portal" body="New requests need confirmation within 24h to keep your quality score. Chat with customers, submit quotes, manage documents." />
          <Step n="04" title="Mark fulfilled, get paid" body="When service is complete, mark the booking fulfilled. Escrow releases to your account, typically within 2 business days of the weekly batch." />
        </ol>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#6B3E8A]/35 blur-[70px]" />
          <div className="relative grid gap-10 md:grid-cols-4">
            <Stat label="Avg. monthly movers" value="2,400" sub="across EU corridors" />
            <Stat label="Bookings per partner" value="18/mo" sub="top-tier average" />
            <Stat label="Confirm-to-pay" value="2 days" sub="once fulfilment is marked" />
            <Stat label="Customer CSAT" value="4.7/5" sub="review mean across verified partners" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="grid gap-6 rounded-[28px] border border-ink-200 bg-white p-10 md:p-14 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6B3E8A] text-white">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
              Ready to get listed?
            </h2>
            <p className="mt-3 max-w-lg text-[14.5px] text-ink-600 leading-[1.6]">
              Apply now. Our team reviews in 2-3 business days. You'll be serving movers by the end of next week.
            </p>
          </div>
          <Link
            href={PARTNER_URL}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#6B3E8A] pl-6 pr-5 text-[14px] font-semibold text-white hover:bg-[#512E69] self-start md:self-center"
          >
            Start your application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Category({ Icon, label, example }: { Icon: typeof Home; label: string; example: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F0FA] text-[#6B3E8A]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-sans text-[14.5px] font-semibold text-ink-900">{label}</p>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-600">{example}</p>
    </div>
  );
}

function ValueCard({ Icon, title, body, tint }: { Icon: typeof Home; title: string; body: string; tint?: "plum" }) {
  const iconBg = tint === "plum" ? "bg-[#6B3E8A] text-white" : "bg-ink-900 text-parchment";
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-sans text-[18px] font-semibold tracking-tight text-ink-900 leading-[1.3]">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-600">{body}</p>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{label}</p>
      <p className="mt-2 font-sans text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-none tracking-[-0.025em] text-parchment">{value}</p>
      <p className="mt-2 text-[12.5px] text-white/60">{sub}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400 font-medium">{n}</span>
      <h3 className="mt-3 font-sans text-[18px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-600">{body}</p>
    </li>
  );
}
