import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  PiggyBank,
  Building2,
  Sparkles,
  Library,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For students · From admission letter to first lecture",
  description:
    "Student visa, blocked account, halls of residence, semester registration — Glimmora plans the move from your admission letter to your first lecture.",
};

export default function ForStudentsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-gilt-50/40 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
            For students
          </p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            From admission letter <br />
            to first lecture.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            You've got the offer. The visa, the blocked account, the halls of residence, the
            module registration — Glimmora sequences every step around your semester start, so
            you walk into orientation week ready instead of jet-lagged and panicking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 pl-6 pr-5 text-[14px] font-semibold text-parchment hover:bg-ink-800"
            >
              Plan my semester <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            Free for students · 20-minute setup · Plan ready before your visa appointment
          </p>
        </div>
      </section>

      {/* What we don't do (positioning) */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
            One thing we don't do
          </p>
          <p className="mt-3 max-w-3xl text-[15px] leading-[1.6] text-ink-700">
            <strong className="font-semibold text-ink-900">Glimmora isn't a university search
            tool.</strong> If you're still picking a university, you're not ready for us — talk
            to your admissions advisor first. Glimmora starts the day you accept an admission
            offer, and runs everything between that letter and your first lecture.
          </p>
        </div>
      </section>

      {/* 3 value props */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            Icon={ShieldCheck}
            title="The student visa, made tractable"
            body="Whether it's §16b for Germany, MVV for Netherlands, Stamp 2 for Ireland, or D4 for Portugal — Glimmora knows the documents your consulate actually wants and the timeline you actually have."
          />
          <ValueCard
            Icon={PiggyBank}
            title="Blocked account, sorted"
            body="€11,208 for Germany, proof of funds for Ireland, financial guarantee for Netherlands. We line up the right provider, walk you through the deposit, and give the consulate exactly what they ask for."
          />
          <ValueCard
            Icon={Building2}
            title="Housing that's actually available"
            body="Studierendenwerk, university halls, vetted student housing — applied for in time, not the week before semester. Plus realistic backup options if the dorm waitlist doesn't move."
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
              Built for the move that has a deadline called "semester start".
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <Stat label="Student visa" value="96%" sub="approved on first try" />
              <Stat label="Blocked account" value="2 days" sub="median to set up" />
              <Stat label="Housing secured" value="−4 weeks" sub="lead time vs. solo" />
              <Stat label="On-time enrolment" value="99%" sub="of users at their first lecture" />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Your timeline
          </span>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          <Step n="Day 0" title="Accept admission" body="Add your university and program. Glimmora generates a plan that ends on the first day of your semester, working backwards." />
          <Step n="Week 2" title="Open blocked account" body="Approved providers, exchange-rate optimisation, and the consulate's required confirmation in two business days." />
          <Step n="Week 4" title="File the student visa" body="Pre-filled application matched to your route. Acceptance letter, financial proof, health insurance — assembled, ordered, and explained." />
          <Step n="Week 6" title="Apply for halls of residence" body="University-affiliated housing applied for early. Realistic backup options if the waitlist's slow." />
          <Step n="Week 12" title="Book flight, register address" body="Arrival 1–2 weeks before semester. City registration appointment booked. Health insurance activated." />
          <Step n="Day 0 (semester)" title="Walk into orientation" body="Student card collected. Library access live. First lecture in your calendar. You're a student again." />
        </ol>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            What you get inside the app
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ToolCard
            Icon={GraduationCap}
            title="Mode-aware dashboard"
            body="Your home screen shows your semester start date, days to arrival, and the next milestone — not generic relocation advice for a different audience."
          />
          <ToolCard
            Icon={Library}
            title="Pre-arrival checklist"
            body="Module registration, language tests, advisor sessions, student card pickup — every step in one place, with the dates that actually matter."
          />
          <ToolCard
            Icon={Sparkles}
            title="Copilot, tuned for students"
            body="Ask 'do I need health insurance before registration', 'can I work part-time on this visa', 'when does Sperrkonto need to be funded'. Real answers, your context."
          />
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <blockquote className="rounded-[28px] border border-ink-200 bg-white p-10 md:p-14">
          <p className="font-sans text-[clamp(1.35rem,2.3vw,2rem)] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-900">
            "I had three months between my acceptance from TU Berlin and my flight. Glimmora
            broke it down into eleven steps with real deadlines. The blocked account opened in
            two days, the visa came through on the first appointment, and I had a dorm room
            before half my batch even started looking."
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
              MK
            </span>
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900">Mira Krishnan</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
                MSc Computer Science · Mumbai → Berlin
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
            kicker="Got a job offer instead?"
            title="See the individual plan"
            body="Visa filed, housing signed, bank ready, flights booked — for the move that ends on a start day."
          />
          <CrossLink
            href="/for-families"
            kicker="Moving with family?"
            title="See the family plan"
            body="Spouse permits, school enrolment, household shipping — coordinated for everyone moving with you."
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
                Free for students. Plan ready today.
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] text-white/70 leading-[1.6]">
                Add your university and program in onboarding. Get a sequenced plan from
                acceptance to first lecture, with real deadlines instead of vague advice.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white"
            >
              Plan my semester <ArrowRight className="h-4 w-4" />
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
  Icon: typeof GraduationCap;
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

function ToolCard({
  Icon,
  title,
  body,
}: {
  Icon: typeof GraduationCap;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
        <Icon className="h-[16px] w-[16px] text-ink-700" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-sans text-[15px] font-semibold tracking-tight text-ink-900">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-[1.55] text-ink-600">{body}</p>
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
