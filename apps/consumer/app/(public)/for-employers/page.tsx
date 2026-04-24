import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Briefcase, ShieldCheck, Users, CheckCircle2, TrendingUp, Globe2, Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For employers",
  description: "Hire visa-ready talent globally. Only candidates your sponsorship policy actually supports — pre-filtered, AI-ranked, relocation-ready.",
};

const EMPLOYER_URL = process.env.NEXT_PUBLIC_EMPLOYER_URL ?? "http://localhost:3002/sign-up";

export default function ForEmployersPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-gilt-50/40 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">For employers</p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            Hire the engineer. <br />We'll sort the visa.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            Glimmora for Employers puts only <em>visa-ready</em> candidates in front of your recruiters. Every application clears your sponsorship policy before it lands in your pipeline. When you close, relocation runs itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={EMPLOYER_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 pl-6 pr-5 text-[14px] font-semibold text-parchment hover:bg-ink-800"
            >
              Post your first role <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900">
              See pricing
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            No posting fees · No seat fees · 8% success fee only on closed hires
          </p>
        </div>
      </section>

      {/* 3-value-props */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            Icon={ShieldCheck}
            title="Visa-aware from day one"
            body="Every role you post gets pre-filtered by your sponsorship policy (countries, visa tiers, eligibility). Candidates see only roles they can actually take. You see only candidates who actually qualify."
          />
          <ValueCard
            Icon={TrendingUp}
            title="AI-ranked pipeline"
            body="Glimmora's match engine scores candidates by role fit, visa readiness, experience band, and relocation intent. Your recruiters review 20 great applications instead of wading through 200."
          />
          <ValueCard
            Icon={Globe2}
            title="Relocation runs itself"
            body="When you close, the hire flows into Glimmora's consumer platform. Visa, housing, school, bank, flights — handled through our verified marketplace. Your candidate arrives ready to work."
          />
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gilt-500/20 blur-[70px]" />
          <div className="relative">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">By the numbers</p>
            <h2 className="mt-4 max-w-xl font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              Recruiters who stopped writing rejection emails.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <Stat label="Pipeline reviewed" value="−80%" sub="garbage applications filtered" />
              <Stat label="Offer acceptance" value="+34%" sub="when relocation is included" />
              <Stat label="Time to close" value="−22 days" sub="vs untracked hiring" />
              <Stat label="90-day retention" value="98%" sub="relocations actually stick" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">How it works</span>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          <Step n="01" title="Define your sponsorship policy" body="Countries you sponsor, visa tiers you support, relocation benefits. Every role inherits these defaults — override per-job as needed." />
          <Step n="02" title="Post a role, get visa-filtered matches" body="Only candidates your passport policy accepts see your role. The Copilot ranks them against your spec. You interview the top 5, not the top 50." />
          <Step n="03" title="Run the hiring loop inside the platform" body="Interviews scheduled, scorecards captured, offers sent, negotiations tracked. Less Gmail, more pipeline." />
          <Step n="04" title="Close → Glimmora handles relocation" body="Visa files, housing bookings, school seats, bank accounts — all through our verified partner network. Your hire arrives on day 1 ready to work." />
        </ol>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <blockquote className="rounded-[28px] border border-ink-200 bg-white p-10 md:p-14">
          <p className="font-sans text-[clamp(1.35rem,2.3vw,2rem)] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-900">
            "Before Glimmora we rejected nine good engineers because we couldn't sponsor. Now those nine engineers don't even see the role. The ones who do see it are pre-cleared. Our recruiters are faster and kinder at the same time."
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">MS</span>
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900">Marta Schmidt</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">Head of Talent · Kontra GmbH</p>
            </div>
          </div>
        </blockquote>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/15 blur-[80px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_auto] md:items-end">
            <div>
              <h2 className="font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                No posting fees. Pay only when you hire.
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] text-white/70 leading-[1.6]">
                8% of first-year salary per closed hire, invoiced quarterly. That's it. No seat fees, no platform subscription, no minimum commitment. Get a 14-day trial of the full pipeline before you post your first real role.
              </p>
            </div>
            <Link
              href={EMPLOYER_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white"
            >
              Start hiring <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ Icon, title, body }: { Icon: typeof Briefcase; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-parchment">
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
