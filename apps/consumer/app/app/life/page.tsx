import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Home,
  Landmark,
  HeartPulse,
  Wifi,
  Users2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  PiggyBank,
  School,
  Library,
  IdCard,
  Coffee,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Life Setup" };

type Domain = { icon: LucideIcon; t: string; d: string; status: string; tone?: "featured" };

const individualDomains: Domain[] = [
  { icon: Home,        t: "Housing",               d: "Short and long-term accommodation with neighbourhood scoring.",       status: "Pre-arrival",  tone: "featured" },
  { icon: Landmark,    t: "Banking & insurance",   d: "Remote account opening, health cover, financial onboarding.",         status: "4 weeks out" },
  { icon: HeartPulse,  t: "Healthcare & fitness",  d: "GP, dental, mental health, fitness in your neighbourhood.",            status: "On arrival" },
  { icon: Wifi,        t: "Utilities & mobility",  d: "Mobile plan, internet, transport pass, energy contracts.",             status: "Arrival week" },
  { icon: Coffee,      t: "Coworking & cafés",     d: "Spaces to land, work, and meet — beyond your apartment walls.",        status: "Settle-in" },
  { icon: Users2,      t: "Community",             d: "Meet movers on the same corridor, interest groups, local culture.",   status: "Ongoing" },
];

const familyDomains: Domain[] = [
  { icon: Home,        t: "Family housing",        d: "Family-sized rentals filtered by school catchments and transit.",     status: "Pre-arrival",  tone: "featured" },
  { icon: School,      t: "Schools & childcare",   d: "International, bilingual, or local schools matched to your kids.",    status: "Pre-arrival" },
  { icon: Landmark,    t: "Joint banking & insurance", d: "Joint accounts, family health cover, child policies.",            status: "4 weeks out" },
  { icon: HeartPulse,  t: "Pediatrics & GPs",      d: "Family doctor, paediatrician, dental — booked before you land.",      status: "On arrival" },
  { icon: Truck,       t: "Household setup",       d: "Shipping, utilities, internet, school supplies — coordinated.",       status: "Arrival week" },
  { icon: Users2,      t: "Family community",      d: "School-parent groups, expat-family meetups, weekend life.",            status: "Ongoing" },
];

const studentDomains: Domain[] = [
  { icon: Home,        t: "Halls & student housing", d: "Studierendenwerk, university dorms, vetted private student housing.", status: "Pre-arrival",  tone: "featured" },
  { icon: PiggyBank,   t: "Blocked / proof-of-funds account", d: "Approved providers, deposit tracked, consulate-ready confirmation.", status: "Pre-arrival" },
  { icon: HeartPulse,  t: "Student health insurance", d: "Mandatory student plans (TK, AOK, Barmer) — set up before semester.", status: "Pre-arrival" },
  { icon: IdCard,      t: "Enrolment & student card", d: "Anmeldung, Immatrikulation, student ID — all in one walkthrough.",   status: "Arrival week" },
  { icon: Wifi,        t: "SIM & semester ticket",   d: "Student-priced mobile, semester transit pass, cheap utilities.",      status: "Arrival week" },
  { icon: Library,     t: "Campus life & community", d: "Library access, societies, language tandems, mentors.",                status: "Ongoing" },
];

export default async function LifePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      mode: true,
      relocation: { select: { destCity: true, destCountry: true } },
    },
  });

  // Defensive: app/layout.tsx redirects no-relocation users to /onboarding,
  // but if anyone reaches this page without one, send them there too.
  if (!user?.relocation) {
    redirect("/onboarding");
  }

  const mode = (user.mode as "INDIVIDUAL" | "FAMILY" | "STUDENT" | undefined) ?? "INDIVIDUAL";
  const isStudent = mode === "STUDENT";
  const isFamily = mode === "FAMILY";

  const cityName = user.relocation.destCity ?? user.relocation.destCountry;

  const domains = isStudent ? studentDomains : isFamily ? familyDomains : individualDomains;

  const headline = isStudent
    ? `Every piece of student life in ${cityName}, before semester starts.`
    : isFamily
    ? `Every piece of family life in ${cityName}, ready before you land.`
    : `Every piece of a life in ${cityName}, once you arrive.`;

  const sub = isStudent
    ? "Halls, blocked account, health insurance, enrolment, SIM, community — sequenced around your semester start."
    : isFamily
    ? "Family housing, schools, joint banking, paediatrics, shipping, community — coordinated for the whole household."
    : "Housing, banking, healthcare, utilities, community — each domain matched, booked, tracked, verified.";

  const copilotLine = isStudent
    ? "Halls applications go in first, blocked account second, health insurance and enrolment lock in before your semester begins."
    : isFamily
    ? "Family housing first, schools next, banking and insurance four weeks before the flight, household setup on arrival."
    : "Housing first, banking and insurance four weeks before the flight, utilities and community after arrival.";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          Life Setup
        </p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {headline}
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          {sub}
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Six domains
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((d, i) => {
            const Icon = d.icon;
            const featured = d.tone === "featured";
            return (
              <article
                key={i}
                className={`rounded-2xl border p-6 md:p-7 ${featured ? "bg-ink-900 text-parchment border-ink-900" : "bg-white text-ink-900 border-ink-200"}`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-gilt-300" : "border border-ink-200 bg-parchment text-ink-700"}`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${featured ? "border-white/20 text-gilt-300" : "border-ink-200 bg-parchment text-ink-700"}`}
                  >
                    {d.status}
                  </span>
                </div>
                {featured ? (
                  <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gilt-500/15 border border-gilt-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-semibold">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    Start here · longest lead time
                  </span>
                ) : null}
                <h3
                  className={`${featured ? "mt-3" : "mt-6"} font-sans text-[19px] font-semibold tracking-tight ${featured ? "text-parchment" : "text-ink-900"}`}
                >
                  {d.t}
                </h3>
                <p
                  className={`mt-2 text-[13.5px] leading-[1.6] ${featured ? "text-white/70" : "text-ink-600"}`}
                >
                  {d.d}
                </p>
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
              The Copilot expands your plan domain by domain.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] leading-[1.6] text-ink-700">
              {copilotLine}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:min-w-[180px]">
            <Link
              href="/app/marketplace"
              className="btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-medium"
            >
              Browse partners <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app/plan"
              className="btn-ghost inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-medium"
            >
              View timeline <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
