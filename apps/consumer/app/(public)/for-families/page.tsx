import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  School,
  HeartHandshake,
  Truck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For families · Move the whole household with one plan",
  description:
    "Spouse permits, school enrolment, household shipping, family-sized housing — coordinated for everyone moving with you. One timeline, your whole family.",
};

export default function ForFamiliesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-lagoon-50/40 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">
            For families
          </p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            One plan. <br />
            Your whole family.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            A relocation isn't one move — it's three or four. Glimmora coordinates spouse
            permits, school enrolment, household shipping, and family-sized housing on a single
            timeline, so no one in your family falls between the cracks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 pl-6 pr-5 text-[14px] font-semibold text-parchment hover:bg-ink-800"
            >
              Start your family plan <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            Free to start · Add spouse and children in onboarding · Per-person tracking
          </p>
        </div>
      </section>

      {/* 4 value props */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            Icon={HeartHandshake}
            title="Spouse permit, sequenced right"
            body="Marriage certificate apostille, family reunion application, dependant visa — filed alongside the primary visa with the right legalisations the consulate actually requires."
          />
          <ValueCard
            Icon={School}
            title="Schools that have spots"
            body="Curated international schools and local options near family-friendly neighbourhoods, with realistic enrolment timelines so you don't arrive to a 'sorry, full' email."
          />
          <ValueCard
            Icon={Truck}
            title="Shipping without the headache"
            body="Container or air-freight quotes from vetted partners. Inventory templates, customs forms, insurance — handled without you reading a 40-page customs manual."
          />
          <ValueCard
            Icon={Users}
            title="Per-person tracking"
            body="Every member of the household gets their own visa status, document checklist, and timeline. The dashboard shows you who's ready and who needs you next — at a glance."
          />
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gilt-500/20 blur-[70px]" />
          <div className="relative">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">
              By the numbers
            </p>
            <h2 className="mt-4 max-w-xl font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              Built for the move that has more than one passport in it.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <Stat label="Spouse permits filed" value="98%" sub="approved on first try" />
              <Stat label="School enrolment" value="−6 weeks" sub="lead time vs. solo search" />
              <Stat label="Household savings" value="€820/mo" sub="net for a family of four" />
              <Stat label="Same-day arrival" value="100%" sub="all members land together" />
            </div>
          </div>
        </div>
      </section>

      {/* Family timeline */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Your family timeline
          </span>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          <Step n="Day 0" title="Add your household" body="Spouse, children, dependants — each becomes a tracked person on your plan with their own visa state and document checklist." />
          <Step n="Week 1" title="Marriage certificate apostille" body="Three to four weeks for legalisation. We start this clock the moment you accept the offer, so it's never the thing that blocks the family permit." />
          <Step n="Week 4" title="Spouse permit + visas filed" body="Primary applicant and dependant applications submitted together at the consulate. One appointment, one decision." />
          <Step n="Week 8" title="Family-size housing + schools" body="Apartments filtered for size, location near international schools. School registration packets submitted alongside the lease." />
          <Step n="Week 11" title="Shipping booked" body="Container or air-freight quote locked in. Inventory submitted. Insurance bound. Arrival window aligned with everyone's flights." />
          <Step n="Day 0 (arrival)" title="Move in together" body="Keys, utilities, address registration, school welcome packets — coordinated for the whole household on the same day." />
        </ol>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <blockquote className="rounded-[28px] border border-ink-200 bg-white p-10 md:p-14">
          <p className="font-sans text-[clamp(1.35rem,2.3vw,2rem)] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-900">
            "Two adults, two kids, three suitcases each, and a cat. Glimmora kept everyone's
            visa, permit, school place, and shipping container on the same screen. Our daughter
            walked into Year 4 the week we landed."
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
              AO
            </span>
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900">Adaeze & Tunde Okafor</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
                Family of four · Lagos → Amsterdam
              </p>
            </div>
          </div>
        </blockquote>
      </section>

      {/* Cross-links */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          <CrossLink
            href="/for-individuals"
            kicker="Moving on your own?"
            title="See the individual plan"
            body="Visa filed, housing signed, bank ready, flights booked — without spreadsheets or sticky notes."
          />
          <CrossLink
            href="/for-students"
            kicker="Just admitted?"
            title="See the student plan"
            body="Student visa, blocked account, halls of residence, and the run-up to your first lecture."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/15 blur-[80px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_auto] md:items-end">
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Move the whole household. Together.
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] text-white/70 leading-[1.6]">
                Free to start. Add your spouse, kids, and dependants in onboarding. Premium
                unlocks per-member document AI, school concierge, and shipping guarantees.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white"
            >
              Start your family plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================ */
/* PRIMITIVES                                                   */
/* ============================================================ */

function ValueCard({
  Icon,
  title,
  body,
}: {
  Icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-parchment">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-sans text-[18px] font-semibold tracking-tight text-ink-900 leading-[1.3]">
        {title}
      </h3>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-600">{body}</p>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">
        {label}
      </p>
      <p className="mt-2 font-sans text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-none tracking-[-0.025em] text-parchment">
        {value}
      </p>
      <p className="mt-2 text-[12.5px] text-white/60">{sub}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400 font-medium">
        {n}
      </span>
      <h3 className="mt-3 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
        {title}
      </h3>
      <p className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-600">{body}</p>
    </li>
  );
}

function CrossLink({
  href,
  kicker,
  title,
  body,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:border-ink-900"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          {kicker}
        </p>
        <h3 className="mt-2 font-sans text-[17px] font-semibold tracking-tight text-ink-900">
          {title}
        </h3>
        <p className="mt-1.5 text-[13.5px] text-ink-600 leading-[1.55]">{body}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 text-ink-400 transition-all group-hover:translate-x-0.5 group-hover:text-ink-900" />
    </Link>
  );
}
