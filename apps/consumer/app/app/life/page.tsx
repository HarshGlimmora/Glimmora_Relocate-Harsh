import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  GraduationCap,
  Landmark,
  HeartPulse,
  Wifi,
  Users2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = { title: "Life Setup" };

const domains = [
  { icon: Home,          t: "Housing",               d: "Short and long-term accommodation with neighbourhood scoring.", status: "Waits for offer", tone: "featured" },
  { icon: GraduationCap, t: "Schools",               d: "Match children to international, bilingual, or local schools.",   status: "Family mode" },
  { icon: Landmark,      t: "Banking & Insurance",   d: "Remote account opening, health cover, financial onboarding.",     status: "4 weeks out" },
  { icon: HeartPulse,    t: "Healthcare & Fitness",  d: "GP, dental, mental health, fitness in your neighbourhood.",        status: "On arrival" },
  { icon: Wifi,          t: "Utilities & Mobility",  d: "Mobile plan, internet, transport pass, energy.",                   status: "Arrival week" },
  { icon: Users2,        t: "Community",             d: "Introductions to movers like you, interest groups, culture.",      status: "Ongoing" },
];

export default function LifePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Life Setup</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Every piece of a life, <br className="hidden md:block" />
          once you arrive.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Housing, schools, banks, health, utilities, community. Each domain sequenced — matched, booked, tracked, verified.
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Six domains</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((d, i) => {
            const Icon = d.icon;
            const featured = d.tone === "featured";
            return (
              <article key={i} className={`rounded-2xl border p-6 md:p-7 ${featured ? "bg-ink-900 text-parchment border-ink-900" : "bg-white text-ink-900 border-ink-200"}`}>
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-gilt-300" : "border border-ink-200 bg-parchment text-ink-700"}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${featured ? "border-white/20 text-gilt-300" : "border-ink-200 bg-parchment text-ink-700"}`}>
                    {d.status}
                  </span>
                </div>
                <h3 className={`mt-6 font-sans text-[19px] font-semibold tracking-tight ${featured ? "text-parchment" : "text-ink-900"}`}>{d.t}</h3>
                <p className={`mt-2 text-[13.5px] leading-[1.6] ${featured ? "text-white/70" : "text-ink-600"}`}>{d.d}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] bg-gilt-50 border border-gilt-200 p-10 md:p-12">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink-900">
              The Copilot waits for your offer, then expands the plan.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] leading-[1.6] text-ink-700">
              Housing searches kick off first, schools next if you have children, banking and insurance four weeks before the flight, utilities and community after arrival.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:min-w-[180px]">
            <Link href="/app/marketplace" className="btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-medium">
              Browse partners <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/app/plan" className="btn-ghost inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-medium">
              View timeline <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
