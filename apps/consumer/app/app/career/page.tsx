import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase, ArrowRight, ArrowUpRight, Sparkles, Building2, MapPin, Clock,
  CheckCircle2, Circle, MessageSquare, Trophy, ShieldCheck,
  GraduationCap, BookOpen, Users, CalendarCheck, Languages, FileText, Library,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { listApplicationsForEmail, type EmployerApplication } from "@/lib/employer-api";

export const metadata: Metadata = { title: "Career" };

const stageMeta: Record<string, { label: string; cls: string; Icon: typeof Briefcase }> = {
  NEW:         { label: "Submitted",   cls: "bg-ink-50 border-ink-200 text-ink-700",               Icon: Circle        },
  SHORTLISTED: { label: "Shortlisted", cls: "bg-lagoon-50 border-lagoon-100 text-lagoon-800",      Icon: Sparkles      },
  INTERVIEW:   { label: "Interview",   cls: "bg-gilt-50 border-gilt-200 text-gilt-800",            Icon: MessageSquare },
  OFFER:       { label: "Offer",       cls: "bg-success-50 border-success-100 text-success-800",  Icon: Trophy        },
  HIRED:       { label: "Hired",       cls: "bg-success-100 border-success-200 text-success-800", Icon: CheckCircle2  },
  REJECTED:    { label: "Closed",      cls: "bg-ink-50 border-ink-200 text-ink-500",              Icon: Circle        },
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

function money(n: number | null, currency: string | null) {
  if (!n) return "—";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${(n / 1000).toFixed(0)}k`;
}

export default async function CareerPage() {
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
  if (!user) {
    redirect("/sign-in");
  }

  if (user.mode === "STUDENT") {
    if (!user.relocation) {
      redirect("/onboarding");
    }
    return <StudiesView relocation={user.relocation} />;
  }

  let apps: EmployerApplication[] = [];
  let apiError: string | null = null;
  try {
    apps = await listApplicationsForEmail(user.email);
  } catch (e) {
    apiError = e instanceof Error ? e.message : "Could not fetch applications";
  }

  const counts = {
    applications: apps.length,
    interviews: apps.filter((a) => a.stage === "INTERVIEW" || a.nextInterview).length,
    offers: apps.filter((a) => a.activeOffer || a.stage === "OFFER" || a.stage === "HIRED").length,
  };

  const nextStep = apps.find((a) => a.nextInterview)
    ? `Prep for ${apps.find((a) => a.nextInterview)?.job.title}`
    : apps.find((a) => a.activeOffer?.status === "SENT")
      ? "Review your offer"
      : apps.some((a) => a.stage === "SHORTLISTED")
        ? "Watch for interview invite"
        : apps.length === 0
          ? "Start applying"
          : "Wait for response";

  const hasAcceptedOffer = !!user.relocation;
  const acceptedOfferOrgName = user.relocation?.employerName ?? null;
  const acceptedOfferRole = user.relocation?.jobTitle ?? null;
  const acceptedOfferCity = user.relocation?.destCity ?? user.relocation?.destCountry ?? null;
  const acceptedOfferStartDate = user.relocation?.startDate ?? null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Career</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {hasAcceptedOffer ? <>Your offer at {acceptedOfferOrgName}.</> : <>The job side of your move.</>}
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          {hasAcceptedOffer
            ? "Track this offer to start day. If you're also interviewing elsewhere, those applications will appear below."
            : "Visa-aware search, one-click apply with your Twin, and every application tracked to offer."}
        </p>
      </header>

      {/* Accepted offer summary — only shown post-onboarding */}
      {hasAcceptedOffer ? (
        <section className="mb-10 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-900 to-[#0a1820] p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500/20 border border-gilt-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-semibold">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Offer accepted
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                  <Building2 className="h-3 w-3" />
                  {acceptedOfferOrgName}
                </span>
              </div>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                {acceptedOfferRole}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
                {acceptedOfferCity ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {acceptedOfferCity}
                  </span>
                ) : null}
                {acceptedOfferStartDate ? (
                  <>
                    <span className="h-3 w-px bg-white/20" />
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Start day {new Date(acceptedOfferStartDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <Link
              href="/app/plan"
              className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white md:self-center"
            >
              See your plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <StatTile n={String(counts.applications)} l={hasAcceptedOffer ? "Other applications" : "Applications"} />
        <StatTile n={String(counts.interviews)}   l="Interviews"   tone={counts.interviews > 0 ? "gilt" : undefined} />
        <StatTile n={String(counts.offers)}       l="Other offers" tone={counts.offers > 0 ? "lagoon" : undefined} />
        <StatTile n="→"                           l="Next step"    sub={hasAcceptedOffer && apps.length === 0 ? "Stay focused on your offer" : nextStep} />
      </section>

      {apiError ? (
        <div className="mb-8 rounded-2xl border border-danger-200 bg-danger-50 p-5 text-[13px] text-danger-700">
          <p className="font-semibold">Employer portal unreachable.</p>
          <p className="mt-1 text-[12.5px]">{apiError}</p>
        </div>
      ) : null}

      {/* Applications */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Your applications</span>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Briefcase className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
              {hasAcceptedOffer ? "No other applications tracked." : "No applications yet."}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              {hasAcceptedOffer
                ? `If you're interviewing elsewhere as a backup or next move, applications you submit through visa-aware partners will appear here.`
                : "Visa-aware roles arrive here once partner employers post them. Until then, stick with the Copilot for guidance."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => {
              const stage = stageMeta[a.stage] ?? stageMeta.NEW;
              const SI = stage.Icon;
              return (
                <li
                  key={a.id}
                  className="group relative rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6"
                >
                  <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/app/discover/jobs/${a.job.id}`}
                          className="font-sans text-[15.5px] font-semibold tracking-tight text-ink-900 hover:underline decoration-ink-300 decoration-1 underline-offset-4"
                        >
                          {a.job.title}
                        </Link>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${stage.cls}`}>
                          <SI className="h-3 w-3" />
                          {stage.label}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {a.job.company.name}</span>
                        {a.job.location ? (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.job.location}</span>
                          </>
                        ) : null}
                        {a.job.visaTier ? (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {a.job.visaTier}</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="min-w-0 text-[12.5px] text-ink-600">
                      {a.nextInterview?.scheduledAt ? (
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-gilt-50 border border-gilt-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
                          <MessageSquare className="h-3 w-3" />
                          {a.nextInterview.kind.toLowerCase()} · {new Date(a.nextInterview.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      ) : a.activeOffer ? (
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-success-50 border border-success-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-success-700 font-medium">
                          <Trophy className="h-3 w-3" />
                          Offer {a.activeOffer.status.toLowerCase()} · {money(a.activeOffer.baseSalary, a.activeOffer.currency)}
                        </p>
                      ) : (
                        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                          <Clock className="h-3 w-3" />
                          Applied {relTime(a.appliedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <div className="text-right">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Match</p>
                        <p className={`mt-0.5 font-sans text-[17px] font-semibold ${a.matchScore >= 80 ? "text-lagoon-700" : a.matchScore >= 60 ? "text-gilt-800" : "text-ink-700"}`}>
                          {a.matchScore}
                        </p>
                      </div>
                      <Link
                        href={`/app/discover/jobs/${a.job.id}`}
                        aria-label="Open role"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-900 hover:text-ink-900"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Career sub-modules */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Career tools</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ToolCard
            title="Resume & Cover Letters"
            desc="Copilot tailors your materials per role, in the employer's language."
          />
          <ToolCard
            title="Interview AI"
            desc="Mock rounds with a Copilot interviewer — your Twin adapts after each session."
          />
          <ToolCard
            title="Offer & Negotiation"
            desc="Structured offers arrive here. Compare across countries, net of tax."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Let the Copilot hunt while you sleep.
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              Leave your Twin visible to employers who sponsor your passport. Pre-screened matches arrive as shortlists you can accept in one tap.
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

function StatTile({ n, l, sub, tone }: { n: string; l: string; sub?: string; tone?: "lagoon" | "gilt" }) {
  const bg = tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
             tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
             "bg-white border-ink-200";
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{l}</p>
      <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      {sub ? <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p> : null}
    </div>
  );
}

function ToolCard({
  title, desc,
}: { title: string; desc: string }) {
  // Coming-soon card — visually muted, not interactive.
  // When a tool ships, swap this for a real <Link href="…"> card.
  return (
    <article
      aria-disabled="true"
      className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-5 opacity-75"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[15px] font-semibold tracking-tight text-ink-700">{title}</p>
        <span className="shrink-0 rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-[13px] text-ink-500 leading-[1.55]">{desc}</p>
    </article>
  );
}

/* ================================================================== */
/* STUDIES VIEW — rendered when user.mode === STUDENT                 */
/* ================================================================== */

type StudentMilestone = {
  id: string;
  kind: string;
  title: string;
  status: string;
  dueDate: Date | null;
  order: number;
};

type StudentRelocation = {
  employerName: string;
  jobTitle: string;
  startDate: Date | null;
  destCity: string | null;
  destCountry: string;
  visaRoute: string | null;
  milestones: StudentMilestone[];
};

function StudiesView({ relocation }: { relocation: StudentRelocation }) {
  const universityName = relocation.employerName;
  const programName = relocation.jobTitle;
  const semesterStart = relocation.startDate;
  const cityLabel = `${relocation.destCity ? relocation.destCity + ", " : ""}${relocation.destCountry}`;
  const visaRoute = relocation.visaRoute;

  const daysToStart = semesterStart
    ? Math.max(0, Math.round((semesterStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const semesterLabel = semesterStart
    ? semesterStart.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Set in onboarding";

  // Real progress derived from the user's plan — the same source the Plan page uses.
  const totalMilestones = relocation.milestones.length;
  const doneMilestones = relocation.milestones.filter((m) => m.status === "DONE").length;
  const planProgressPct =
    totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  // Informational timeline — NOT a todo list. Describes the typical pre-arrival journey
  // for a student. Read-only by design; ticking happens in the system of record (Plan, Documents).
  const journey = [
    { t: "Confirm acceptance & pay tuition deposit",   when: "Day 0 — at admission" },
    { t: "Apply for student housing",                  when: "8+ weeks before semester" },
    { t: "Module registration window opens",           when: "2–3 weeks before semester" },
    { t: "Language test or pre-sessional course",      when: "If your program requires it" },
    { t: "Meet with academic advisor (online)",        when: "Within 2 weeks of arrival" },
    { t: "Pick up student card at orientation",        when: "Orientation week" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Studies</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            The academic side of your move.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Course registration, language prep, advisor check-ins, and orientation — every step before your first lecture.
          </p>
        </div>
        <Link
          href="/app/plan"
          className="btn-primary inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium"
        >
          <CalendarCheck className="h-4 w-4" /> See timeline
        </Link>
      </header>

      {/* Admission banner */}
      <section className="mb-10 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-900 to-[#0a1820] p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500/20 border border-gilt-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-semibold">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Admitted
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                <GraduationCap className="h-3 w-3" />
                {universityName}
              </span>
            </div>
            <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              {programName}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {cityLabel}
              </span>
              {visaRoute ? (
                <>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> {visaRoute}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Semester begins</p>
            <p className="mt-3 font-sans text-[28px] font-semibold leading-none tracking-[-0.02em] text-parchment">
              {semesterLabel}
            </p>
            {daysToStart !== null ? (
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300 font-medium">
                in {daysToStart} day{daysToStart === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stats — all derived from real plan + onboarding data */}
      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <StatTile
          n={daysToStart != null ? String(daysToStart) : "—"}
          l="Days to semester"
          tone={daysToStart != null && daysToStart < 30 ? "gilt" : undefined}
        />
        <StatTile
          n={`${planProgressPct}%`}
          l="Plan progress"
          sub={`${doneMilestones} of ${totalMilestones} steps done`}
        />
        <StatTile n="0" l="Modules registered" sub="Opens 2–3 weeks before" />
        <StatTile n="0" l="Advisor sessions" sub="Book one to plan modules" />
      </section>

      {/* Pre-arrival journey — informational, not a todo list */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Pre-arrival journey
          </span>
        </div>

        <p className="mb-5 max-w-2xl text-[13px] text-ink-600 leading-[1.55]">
          A typical timeline for an admitted student. Your real status — visa filed, deposit paid, housing
          booked — lives on{" "}
          <Link href="/app/plan" className="font-medium text-ink-900 underline underline-offset-2 hover:text-ink-700">
            My Plan
          </Link>
          .
        </p>

        <ol className="rounded-2xl border border-ink-200 bg-white">
          {journey.map((step, i) => (
            <li
              key={i}
              className={`flex items-start gap-4 px-5 py-4 md:px-6 ${i < journey.length - 1 ? "border-b border-ink-100" : ""}`}
            >
              <span className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-ink-200 bg-parchment font-mono text-[11px] font-semibold text-ink-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-ink-900">{step.t}</p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                  {step.when}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Studies tools */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Study tools</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StudyToolCard
            icon={BookOpen}
            title="Module catalogue"
            desc="Browse courses, prerequisites, and credit weights — once your university opens registration."
          />
          <StudyToolCard
            icon={Languages}
            title="Language prep"
            desc="Language placement, conversational practice, and pre-sessional resources for your destination."
          />
          <StudyToolCard
            icon={Users}
            title="Advisor & cohort"
            desc="Book office hours with your academic advisor and meet incoming students from your country."
          />
          <StudyToolCard
            icon={FileText}
            title="Academic writing"
            desc="Citation styles, plagiarism checks, and writing guides matched to your program's standards."
          />
          <StudyToolCard
            icon={Library}
            title="Library & resources"
            desc="Activate your student email and library access — the moment your enrolment confirms."
          />
          <StudyToolCard
            icon={CalendarCheck}
            title="Orientation week"
            desc="Map of campus events, society fairs, and the dates that actually matter in week one."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Stuck on a syllabus, a module choice, a deadline?
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              The Copilot knows your university, your program, and your visa timeline. Ask anything from "do I need health insurance before registration" to "can I take this elective".
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

function StudyToolCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  // Visually muted "coming soon" card — not clickable, not interactive.
  // When a tool ships, swap this for a real <Link href="…"> card.
  return (
    <article
      aria-disabled="true"
      className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-5 opacity-75"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
          <Icon className="h-[16px] w-[16px] text-ink-500" strokeWidth={1.75} />
        </span>
        <span className="shrink-0 rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
          Coming soon
        </span>
      </div>
      <p className="mt-4 font-sans text-[15px] font-semibold tracking-tight text-ink-700">{title}</p>
      <p className="mt-2 text-[13px] text-ink-500 leading-[1.55]">{desc}</p>
    </article>
  );
}
