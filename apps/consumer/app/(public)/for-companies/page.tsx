import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Users, BarChart3, ShieldCheck, Target, CheckSquare, Globe2,
  FileText, TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For companies",
  description: "Run your global mobility program. Policy tiers, approvals, pipelines, and invoicing — all in one place. Built for HR and Finance, loved by relocating employees.",
};

const CORPORATE_URL = process.env.NEXT_PUBLIC_CORPORATE_URL ?? "http://localhost:3005/sign-up";

export default function ForCompaniesPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#EAF2EF]/60 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#2F7D66] font-medium">For companies</p>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink-900">
            Your mobility program, <br />on one screen.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-ink-700">
            Glimmora for Companies is the operating system for global mobility teams. Define policy tiers, watch pipelines in real time, approve exceptions with one click, and invoice in the language your CFO speaks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={CORPORATE_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#2F7D66] pl-6 pr-5 text-[14px] font-semibold text-white hover:bg-[#246455]"
            >
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-6 text-[14px] font-medium text-ink-800 hover:border-ink-900">
              Enterprise pricing
            </Link>
          </div>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
            SOC 2 Type II · GDPR-compliant · 99.9% SLA on approvals
          </p>
        </div>
      </section>

      {/* The stack */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">The full mobility stack</p>
          <h2 className="mt-3 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
            Policy. Pipeline. Proof.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            Icon={FileText}
            title="Policy tiers, codified"
            body="Define Standard / Executive / Early Career envelopes. Cap relocation, housing, shipping. Every hire gets the right tier automatically."
          />
          <ValueCard
            Icon={BarChart3}
            title="Pipelines, live"
            body="See every active relocation by stage. Drill into an employee to see their budget utilisation, timeline, and blockers — no status meetings required."
          />
          <ValueCard
            Icon={CheckSquare}
            title="Approvals, simple"
            body="Managers request exceptions. Mobility leads decide in one click. Budget caps auto-update. Everyone knows what's authorised."
          />
        </div>
      </section>

      {/* Who uses it */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="rounded-[28px] border border-ink-200 bg-white p-10 md:p-14">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Who's on it</p>
          <h2 className="mt-3 max-w-2xl font-sans text-[clamp(1.5rem,2.5vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.015em] text-ink-900">
            Growth-stage to late-stage. Fintech to biotech. Anyone hiring across borders.
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            <PersonaCard
              role="Global mobility lead"
              name="Julia Kim"
              usecase="Runs the program end-to-end. Dashboards by country, policy, and quarter. Approvals + exception log + CFO reports in one place."
            />
            <PersonaCard
              role="CFO / Finance"
              name="Ricardo Oliveira"
              usecase="Quarterly invoicing with line-item breakdown. Spend by policy tier. YTD paid vs forecast. Stripe-ready integration."
            />
            <PersonaCard
              role="Hiring manager"
              name="Elena Rusu"
              usecase="Requests exception budgets in 30 seconds. Sees where their team's relocations are stuck. Never has to email Julia again."
            />
          </ul>
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2F7D66]/35 blur-[70px]" />
          <div className="relative">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#73A899] font-medium">Outcomes enterprise teams report</p>
            <h2 className="mt-4 max-w-xl font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              Less admin, more hires, fewer surprises.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              <Stat label="Admin time" value="−68%" sub="vs spreadsheet-driven ops" />
              <Stat label="Policy adherence" value="+41%" sub="exceptions decline because defaults are clear" />
              <Stat label="Forecast accuracy" value="±6%" sub="YTD spend vs quarterly forecast" />
              <Stat label="Employee NPS" value="+52" sub="relocating staff rate the experience" />
            </div>
          </div>
        </div>
      </section>

      {/* Compliance strip */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
        <div className="grid gap-6 md:grid-cols-4">
          <Pill Icon={ShieldCheck} title="SOC 2 Type II" />
          <Pill Icon={Globe2}      title="GDPR + EU data residency" />
          <Pill Icon={Target}      title="Policy-tier audit trail" />
          <Pill Icon={Users}       title="SSO + SCIM provisioning" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2F7D66]/30 blur-[70px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_auto] md:items-end">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F7D66] text-white">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Ready to ditch the mobility spreadsheet?
              </h2>
              <p className="mt-3 max-w-2xl text-[14.5px] text-white/70 leading-[1.6]">
                45-minute demo with our enterprise team. We'll map your current program onto Glimmora in real time. Free pilot for up to 5 relocations if we're a fit.
              </p>
            </div>
            <Link
              href={CORPORATE_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white"
            >
              Book demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ Icon, title, body }: { Icon: typeof Users; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F7D66] text-white">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-sans text-[18px] font-semibold tracking-tight text-ink-900 leading-[1.3]">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-600">{body}</p>
    </article>
  );
}

function PersonaCard({ role, name, usecase }: { role: string; name: string; usecase: string }) {
  const init = name.split(" ").map((p) => p[0]).join("").toUpperCase();
  return (
    <li className="rounded-2xl border border-ink-200 bg-parchment/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2F7D66] text-[12px] font-semibold text-white">{init}</span>
        <div>
          <p className="font-sans text-[13.5px] font-semibold text-ink-900">{name}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-[13.5px] leading-[1.6] text-ink-700">{usecase}</p>
    </li>
  );
}

function Pill({ Icon, title }: { Icon: typeof Users; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF2EF] text-[#2F7D66]">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <p className="font-sans text-[13.5px] font-semibold text-ink-900">{title}</p>
    </div>
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
