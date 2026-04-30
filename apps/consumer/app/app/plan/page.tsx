import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Check, Clock, Sparkles, ArrowRight, Building2,
  MapPin, DollarSign, ShieldCheck, CheckCircle2, Circle, PlayCircle,
  FileText, Home, Plane, Landmark, KeyRound, CalendarCheck,
  GraduationCap, Heart, Users, Truck, BookOpen, ScrollText, Stamp,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My Plan" };

const kindIcons: Record<string, typeof Check> = {
  OFFER_ACCEPTED:        CheckCircle2,
  VISA_APPLY:            FileText,
  VISA_APPROVE:          ShieldCheck,
  HOUSING:               Home,
  BANK:                  Landmark,
  FLIGHTS:               Plane,
  MOVE_IN:               KeyRound,
  START_DAY:             CalendarCheck,
  FAMILY_MARRIAGE_DOC:   Heart,
  FAMILY_SPOUSE_PERMIT:  Users,
  FAMILY_SCHOOL:         GraduationCap,
  FAMILY_SHIPPING:       Truck,
  // ---- Student kinds ----
  UNI_ACCEPTED:          GraduationCap,
  CAS_LETTER:            ScrollText,
  STUDENT_VISA:          Stamp,
  ARRIVAL_REG:           Building2,
  SEMESTER_START:        BookOpen,
};

const kindHref: Record<string, string> = {
  OFFER_ACCEPTED:        "/app/career",
  VISA_APPLY:            "/app/marketplace?cat=visa",
  VISA_APPROVE:          "/app/marketplace?cat=visa",
  HOUSING:               "/app/marketplace?cat=housing",
  BANK:                  "/app/marketplace?cat=banking",
  FLIGHTS:               "/app/marketplace?cat=flights",
  MOVE_IN:               "/app/documents",
  START_DAY:             "/app/career",
  FAMILY_MARRIAGE_DOC:   "/app/documents",
  FAMILY_SPOUSE_PERMIT:  "/app/marketplace?cat=visa",
  FAMILY_SCHOOL:         "/app/family",
  FAMILY_SHIPPING:       "/app/marketplace?cat=movers",
  // ---- Student kinds ----
  UNI_ACCEPTED:          "/app/career",
  CAS_LETTER:            "/app/documents",
  STUDENT_VISA:          "/app/marketplace?cat=visa",
  ARRIVAL_REG:           "/app/life",
  SEMESTER_START:        "/app/career",
};

const kindCta: Record<string, string> = {
  OFFER_ACCEPTED:        "View offer",
  VISA_APPLY:            "Find a visa partner",
  VISA_APPROVE:          "Track with partner",
  HOUSING:               "Browse housing",
  BANK:                  "Find a banking partner",
  FLIGHTS:               "Book flights",
  MOVE_IN:               "Document checklist",
  START_DAY:             "Open Career",
  FAMILY_MARRIAGE_DOC:   "Upload to Documents",
  FAMILY_SPOUSE_PERMIT:  "Find an immigration lawyer",
  FAMILY_SCHOOL:         "Open Family workspace",
  FAMILY_SHIPPING:       "Find a mover",
  // ---- Student kinds ----
  UNI_ACCEPTED:          "View offer",
  CAS_LETTER:            "Upload to Documents",
  STUDENT_VISA:          "Find a visa partner",
  ARRIVAL_REG:           "Open Life Setup",
  SEMESTER_START:        "Open Studies",
};

function formatDue(d: Date | null) {
  if (!d) return "—";
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diffDays === 0) return `Today · ${dateStr}`;
  if (diffDays === 1) return `Tomorrow · ${dateStr}`;
  if (diffDays === -1) return `Yesterday · ${dateStr}`;
  if (diffDays > 1 && diffDays <= 30) return `In ${diffDays}d · ${dateStr}`;
  if (diffDays < -1 && diffDays >= -30) return `${Math.abs(diffDays)}d ago · ${dateStr}`;
  return dateStr;
}

function relativeLabel(d: Date | null) {
  if (!d) return "—";
  const diffDays = Math.round((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
}

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      twin: true,
      relocation: { include: { milestones: { orderBy: { order: "asc" } } } },
    },
  });

  // Defensive: app/layout.tsx redirects no-relocation users to /onboarding,
  // but if anyone reaches this page without one, send them there too.
  if (!user?.relocation) {
    redirect("/onboarding");
  }

  return <HiredPlan user={user} />;
}

// ---- HIRED view — real Relocation data ----

function HiredPlan({ user }: { user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>> & { relocation: NonNullable<any> } }) {
  const r = user.relocation;
  const total = r.milestones.length;
  const done = r.milestones.filter((m: any) => m.status === "DONE").length;
  const inProgress = r.milestones.filter((m: any) => m.status === "IN_PROGRESS").length;
  const pending = total - done - inProgress;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextMilestone = r.milestones.find((m: any) => m.status !== "DONE");

  const currency = r.currency ?? "EUR";
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const isStudent = user.mode === "STUDENT";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      {/* Hero */}
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          {isStudent ? "My Studies" : "My Relocation"}
        </p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {isStudent
            ? <>Studies start at {r.employerName}.</>
            : <>You're moving to {r.destCity ?? r.destCountry}.</>}
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          {isStudent
            ? `Your admission to ${r.employerName} is locked in. Here's every task between now and your first lecture.`
            : `Your offer at ${r.employerName} is locked in. Here's every task between now and your first day.`}
        </p>
      </header>

      {/* Offer summary card */}
      <section className="mb-8 relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/15 blur-[80px]" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500/20 border border-gilt-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-medium">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> {isStudent ? "Admission accepted" : "Offer accepted"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                <Building2 className="h-3 w-3" /> {r.employerName}
              </span>
            </div>
            <h2 className="mt-5 font-sans text-[32px] font-semibold tracking-tight leading-[1.1]">
              {r.jobTitle}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                {r.destCity ? `${r.destCity}, ` : ""}{r.destCountry}
              </span>
              {r.salary ? (
                <>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {currencySymbol}{r.salary.toLocaleString("en-GB")}
                  </span>
                </>
              ) : null}
              {r.visaRoute ? (
                <>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {r.visaRoute}
                  </span>
                </>
              ) : null}
            </div>
            {r.startDate ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/75 font-medium">
                <CalendarCheck className="h-3.5 w-3.5" />
                {isStudent ? "Semester begins" : "Start day"} {new Date(r.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {relativeLabel(new Date(r.startDate))}
              </p>
            ) : null}
          </div>

          {/* Progress ring */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Plan progress</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-sans text-[56px] font-semibold leading-none tracking-[-0.035em] text-parchment">{progressPct}%</span>
              <span className="text-[13px] text-white/60">complete</span>
            </div>
            <div className="mt-4 h-[4px] w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-gilt-400 to-lagoon-300 transition-all" style={{ width: `${Math.max(4, progressPct)}%` }} />
            </div>
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <Row label="Done" value={String(done)} />
              <Row label="In progress" value={String(inProgress)} />
              <Row label="Remaining" value={String(pending)} />
            </div>
          </div>
        </div>
      </section>

      {/* Next up */}
      {nextMilestone ? (
        <Link
          href={kindHref[nextMilestone.kind] ?? "/app"}
          className="mb-8 group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gilt-200 bg-gilt-50/40 px-5 py-4 transition hover:border-gilt-400 hover:bg-gilt-50 md:px-6"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gilt-500 text-ink-900">
              <PlayCircle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Up next</p>
              <p className="mt-0.5 font-sans text-[16px] font-semibold text-ink-900">{nextMilestone.title}</p>
              {nextMilestone.description ? (
                <p className="mt-0.5 text-[12.5px] text-ink-600">{nextMilestone.description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Due</p>
              <p className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">
                {formatDue(nextMilestone.dueDate ? new Date(nextMilestone.dueDate) : null)}
              </p>
            </div>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-900 pl-4 pr-3 font-sans text-[13px] font-semibold text-parchment transition group-hover:bg-ink-700">
              {kindCta[nextMilestone.kind] ?? "Take action"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : null}

      {/* Timeline */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Timeline</span>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-2">
          <ol className="relative">
            {r.milestones.map((m: any, i: number) => {
              const Icon = kindIcons[m.kind] ?? Circle;
              const isLast = i === r.milestones.length - 1;
              const due = m.dueDate ? new Date(m.dueDate) : null;
              return (
                <li key={m.id} className="group grid grid-cols-[40px_1fr] gap-5 px-6 py-5 md:grid-cols-[40px_100px_1fr_160px] md:items-center">
                  <div className="relative flex items-start justify-center pt-1">
                    <span
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
                        m.status === "DONE" ? "bg-lagoon-500 text-white" :
                        m.status === "IN_PROGRESS" ? "bg-gilt-500 text-ink-900" :
                        m.status === "BLOCKED" ? "bg-danger-50 text-danger-700 border border-danger-200" :
                        "bg-white border border-ink-300 text-ink-400"
                      }`}
                    >
                      {m.status === "DONE" ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
                    </span>
                    {!isLast ? (
                      <span className="absolute left-1/2 top-9 -translate-x-1/2 h-[calc(100%-16px)] w-px bg-ink-200" />
                    ) : null}
                  </div>

                  <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium md:col-start-2">
                    Step {String(m.order).padStart(2, "0")}
                  </span>

                  <div className="col-span-2 md:col-span-1 md:col-start-3">
                    <p className={`text-[15px] ${m.status === "PENDING" ? "text-ink-500" : "font-semibold text-ink-900"}`}>
                      {m.title}
                      {m.status === "IN_PROGRESS" ? (
                        <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gilt-50 border border-gilt-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800 align-middle">
                          Active
                        </span>
                      ) : null}
                      {m.status === "DONE" ? (
                        <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-lagoon-50 border border-lagoon-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 align-middle">
                          Done
                        </span>
                      ) : null}
                    </p>
                    {m.description ? (
                      <p className="mt-1 text-[12.5px] text-ink-500 leading-[1.5]">{m.description}</p>
                    ) : null}
                    {m.status !== "DONE" && kindHref[m.kind] ? (
                      <Link
                        href={kindHref[m.kind]}
                        className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 font-medium hover:text-ink-900"
                      >
                        {kindCta[m.kind] ?? "Take action"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>

                  <span className="col-span-2 md:col-span-1 md:col-start-4 flex items-center gap-1.5 font-mono text-[10.5px] text-ink-500 md:justify-end md:text-right">
                    <Clock className="h-3 w-3" />
                    {formatDue(due)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Copilot CTA */}
      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Need help on a specific milestone?
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              Ask Copilot about visa paperwork, apartment viewings, school enrollment, or tax residency — it knows your plan.
            </p>
          </div>
          <Link href="/app/messages" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
            Open Copilot <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[12.5px]">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{label}</span>
      <span className="font-sans font-semibold text-parchment">{value}</span>
    </div>
  );
}

