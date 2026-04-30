import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  User,
  ShieldCheck,
  Coins,
  Plane,
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For individuals · Move solo with everything in one plan",
  description:
    "You've got the offer. We handle the rest — visa, housing, bank, flights, and your first day at work. One plan, every step, your move.",
};

export default function ForIndividualsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-gilt-50/40 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
            For individuals
          </p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            You signed the offer. <br />
            Everything else is on us.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            From the day you accept the role to your first day at work, Glimmora runs the move
            for you — visa filed, apartment signed, bank opened, flights booked. One plan. One
            timeline. Zero spreadsheets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 pl-6 pr-5 text-[14px] font-semibold text-parchment hover:bg-ink-800"
            >
              Start your plan <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            Free to start · 20-minute setup · Your first plan ready today
          </p>
        </div>
      </section>

      {/* 3 value props */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            Icon={ShieldCheck}
            title="Your visa, mapped to your passport"
            body="EU Blue Card, Highly Skilled Migrant, Critical Skills, Tech Visa — Glimmora knows the route your passport actually takes and which documents the consulate will ask for. No surprises mid-application."
          />
          <ValueCard
            Icon={Coins}
            title="Salary that survives the move"
            body="Net salary, tax band, social security, cost of living, savings projection — country by country. See how an offer in Berlin compares to one in Amsterdam before you say yes."
          />
          <ValueCard
            Icon={Plane}
            title="Arrival without the panic"
            body="Apartment booked before you land, bank account ready for your first paycheck, address registered, SIM in hand. You arrive on a Friday and start work fresh on Monday."
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
              Built for the move you've already decided to make.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <Stat label="Visa filing" value="−18 days" sub="vs. solo paperwork" />
              <Stat label="First-month savings" value="€1,620" sub="net salary protected" />
              <Stat label="Apartment lead time" value="3 weeks" sub="signed before you land" />
              <Stat label="On-time start day" value="98%" sub="of users hit it" />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / How it works */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Your timeline
          </span>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          <Step n="Day 0" title="Sign your offer" body="Link the offer to Glimmora. Your dashboard, plan, and document checklist generate around the start date." />
          <Step n="Week 1" title="File the visa" body="Pre-filled application packet matched to your route. The Copilot flags missing documents before you submit." />
          <Step n="Week 4" title="Bank, housing, flights" body="Apartment shortlist filtered for visa-friendly landlords. Bank account opened remotely. Flights booked to align with your visa approval." />
          <Step n="Day −5" title="Arrival admin" body="City registration appointment booked. SIM activated. Utilities ready. Keys collected the day you land." />
        </ol>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <blockquote className="rounded-[28px] border border-ink-200 bg-white p-10 md:p-14">
          <p className="font-sans text-[clamp(1.35rem,2.3vw,2rem)] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-900">
            "I accepted an offer in Berlin on a Tuesday. By Friday I had a visa appointment, a
            shortlist of three apartments, and a bank account waiting for my first paycheck. I
            didn't open Excel once."
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
              RP
            </span>
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900">Rohan Patel</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
                Senior Engineer · Mumbai → Berlin
              </p>
            </div>
          </div>
        </blockquote>
      </section>

      {/* Cross-links to other audience pages */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          <CrossLink
            href="/for-families"
            kicker="Moving with family?"
            title="See the family plan"
            body="Spouse permits, school enrolment, household shipping — coordinated for everyone moving with you."
          />
          <CrossLink
            href="/for-students"
            kicker="Just admitted?"
            title="See the student plan"
            body="Student visa, blocked account, halls of residence, semester registration — tuned to your university."
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
                Free to start. Your first plan, ready today.
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] text-white/70 leading-[1.6]">
                Twenty minutes with the Copilot, and your visa filing, housing search, bank
                account, and arrival admin are sequenced into a single timeline. Premium unlocks
                document AI, apartment guarantees, and concierge. No card to start.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white"
            >
              Start your plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================ */
/* SHARED PRIMITIVES                                            */
/* ============================================================ */

function ValueCard({
  Icon,
  title,
  body,
}: {
  Icon: typeof User;
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
