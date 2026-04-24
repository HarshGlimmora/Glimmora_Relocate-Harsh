import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus, Check, Clock, Flag, Sparkles, ArrowRight, Building2, Briefcase,
  MapPin, DollarSign, ShieldCheck, CheckCircle2, Circle, PlayCircle,
  FileText, Home, Plane, Landmark, KeyRound, CalendarCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My Plan" };

// ---- Pre-hire (exploration) mock milestones — shown when no Relocation record exists yet ----
const exploreMilestones = [
  { status: "done",    label: "Account created",                      week: "Week 0",  when: "Today" },
  { status: "done",    label: "Digital Twin drafted",                 week: "Week 0",  when: "Today" },
  { status: "active",  label: "Complete intake — profession, family", week: "Week 1",  when: "This week" },
  { status: "pending", label: "Pick a country corridor",              week: "Week 2",  when: "Next week" },
  { status: "pending", label: "Apply to first three jobs",            week: "Week 4",  when: "In a month" },
  { status: "pending", label: "Receive and accept offer",             week: "Week 10", when: "—" },
  { status: "pending", label: "Visa application submitted",           week: "Week 14", when: "—" },
  { status: "pending", label: "Housing booked via Marketplace",       week: "Week 22", when: "—" },
  { status: "pending", label: "Arrive · keys in hand",                week: "Week 38", when: "—" },
];

const kindIcons: Record<string, typeof Check> = {
  OFFER_ACCEPTED: CheckCircle2,
  VISA_APPLY:     FileText,
  VISA_APPROVE:   ShieldCheck,
  HOUSING:        Home,
  BANK:           Landmark,
  FLIGHTS:        Plane,
  MOVE_IN:        KeyRound,
  START_DAY:      CalendarCheck,
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
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      twin: true,
      relocation: { include: { milestones: { orderBy: { order: "asc" } } } },
    },
  });

  if (user?.relocation) {
    return <HiredPlan user={user} />;
  }

  // Fallback to pre-hire exploration view
  return <ExplorePlan user={user} />;
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

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      {/* Hero */}
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">My Relocation</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          You're moving to {r.destCity ?? r.destCountry}.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Your offer at {r.employerName} is locked in. Here's every task between now and your first day.
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
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Offer accepted
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
                Start day {new Date(r.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {relativeLabel(new Date(r.startDate))}
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
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gilt-200 bg-gilt-50/40 px-5 py-4 md:px-6">
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
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Due</p>
            <p className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">
              {formatDue(nextMilestone.dueDate ? new Date(nextMilestone.dueDate) : null)}
            </p>
          </div>
        </section>
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

// ---- EXPLORATION view — shown to users without a relocation ----

function ExplorePlan({ user }: { user: any }) {
  const readiness = user?.twin?.readinessScore ?? 0;
  const stage = user?.twin?.stage ?? "exploring";
  const doneCount = exploreMilestones.filter(m => m.status === "done").length;
  const activeCount = exploreMilestones.filter(m => m.status === "active").length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">My Plan</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            The timeline of your move.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Every task, every dependency, every date. The Copilot maintains the plan; you approve the work.
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
          <Plus className="h-4 w-4" /> Add task
        </button>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6 text-parchment md:col-span-2">
          <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gilt-500/20 blur-[60px]" />
          <div className="relative flex items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">Plan readiness</p>
              <p className="mt-3 flex items-baseline gap-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">
                {readiness}<span className="text-[16px] font-normal text-white/50">/100</span>
              </p>
              <div className="mt-4 h-[3px] w-full max-w-md rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-gilt-400 to-gilt-300 transition-all" style={{ width: `${Math.max(4, readiness)}%` }} />
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300">
              {stage}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Milestones</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat n={doneCount} l="Done" tone="lagoon" />
            <MiniStat n={activeCount} l="Active" tone="gilt" />
            <MiniStat n={exploreMilestones.length - doneCount - activeCount} l="Ahead" tone="ink" />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Timeline</span>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-2">
          <ol className="relative">
            {exploreMilestones.map((m, i) => (
              <li key={i} className="group grid grid-cols-[28px_1fr] gap-5 px-6 py-5 md:grid-cols-[28px_100px_1fr_100px] md:items-center">
                <div className="relative flex items-start justify-center pt-1">
                  <span
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ${
                      m.status === "done" ? "bg-lagoon-500 text-white" :
                      m.status === "active" ? "bg-gilt-500 text-ink-900" :
                      "bg-white border border-ink-300 text-ink-400"
                    }`}
                  >
                    {m.status === "done" ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}
                    {m.status === "active" ? <span className="h-1.5 w-1.5 rounded-full bg-ink-900 animate-pulse" /> : null}
                  </span>
                  {i < exploreMilestones.length - 1 ? (
                    <span className="absolute left-1/2 top-6 -translate-x-1/2 h-[calc(100%-8px)] w-px bg-ink-200" />
                  ) : null}
                </div>

                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium md:col-start-2">
                  {m.week}
                </span>

                <p className={`col-span-2 md:col-span-1 md:col-start-3 text-[15px] ${m.status === "pending" ? "text-ink-400" : "font-medium text-ink-900"}`}>
                  {m.label}
                  {m.status === "active" ? (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gilt-50 border border-gilt-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800 align-middle">
                      Active
                    </span>
                  ) : null}
                </p>

                <span className="col-span-2 md:col-span-1 md:col-start-4 flex items-center gap-1.5 font-mono text-[11px] text-ink-500 md:justify-end">
                  <Clock className="h-3 w-3" />
                  {m.when}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Open tasks</span>
        </div>

        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Flag className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
            Your task list populates here.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Once you pick a country corridor and receive your first offer, the Copilot will expand the plan into dependency-ordered tasks with deadlines.
          </p>
          <Link href="/app/discover" className="btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
            Pick a country <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Want the Copilot to sequence your tasks?
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              Give it your twin and a country — it expands the plan into dependency-aware tasks with realistic dates.
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

function MiniStat({ n, l, tone }: { n: number; l: string; tone: "lagoon" | "gilt" | "ink" }) {
  const bg = tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" : tone === "gilt" ? "bg-gilt-50 border-gilt-200" : "bg-ink-50 border-ink-200";
  const color = tone === "lagoon" ? "text-lagoon-800" : tone === "gilt" ? "text-gilt-800" : "text-ink-900";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <p className={`font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] ${color}`}>{n}</p>
      <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-500 font-medium">{l}</p>
    </div>
  );
}
