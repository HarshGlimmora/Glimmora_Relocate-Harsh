import Link from "next/link";
import {
  Briefcase, Users, MessageSquare, ArrowRight, ArrowUpRight, Plus, Zap, Check, Clock, TrendingUp,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { company: true },
  });
  if (!membership) return null;

  const [activeJobs, draftJobs, totalApps, shortlisted, interviewing] = await Promise.all([
    prisma.job.count({ where: { companyId: membership.companyId, status: "ACTIVE" } }),
    prisma.job.count({ where: { companyId: membership.companyId, status: "DRAFT" } }),
    prisma.application.count({ where: { job: { companyId: membership.companyId } } }),
    prisma.application.count({ where: { job: { companyId: membership.companyId }, stage: "SHORTLISTED" } }),
    prisma.application.count({ where: { job: { companyId: membership.companyId }, stage: "INTERVIEW" } }),
  ]);

  const recentApps = await prisma.application.findMany({
    where: { job: { companyId: membership.companyId } },
    include: { job: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const first = session.user.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
            {membership.company.name} · {new Date().toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            {greeting}, {first}.
          </h1>
        </div>
        <Link href="/app/jobs/new" className="btn-accent inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
          <Plus className="h-4 w-4" /> Post a new role
        </Link>
      </header>

      {/* Hero stat strip */}
      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <HeroStat n={activeJobs} l="Active roles" sub={`${draftJobs} drafts`} tone="ink" />
        <StatCard n={totalApps} l="Applications" sub="all roles · all stages" />
        <StatCard n={shortlisted} l="Shortlisted" sub="ready to interview" tone="lagoon" />
        <StatCard n={interviewing} l="In interviews" sub="currently scheduled" />
      </section>

      {/* Next action */}
      <section className="mb-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Highlight — top match */}
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lagoon-500/25 blur-[70px]" />
          <div className="relative">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-300">
              Highest-fit candidate
            </span>
            <h2 className="mt-5 font-sans text-[28px] font-semibold leading-[1.15] tracking-[-0.015em]">
              Priya Menon — <span className="text-lagoon-300">92 fit</span>.
            </h2>
            <p className="mt-3 max-w-lg text-[14.5px] leading-[1.6] text-white/70">
              Senior engineer from India · 8 years experience · passport clears your EU Blue Card policy.
              She's available and has a Copilot-prepared Twin ready for review.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/app/candidates" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
                Open pipeline <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/app/candidates" className="font-mono text-[11px] uppercase tracking-[0.22em] text-lagoon-300 hover:text-parchment">
                Schedule interview →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Quick actions</p>
          <div className="mt-4 space-y-2">
            <QuickAction icon={Briefcase} label="Post a new role" href="/app/jobs/new" />
            <QuickAction icon={Users} label="Review candidates" href="/app/candidates" />
            <QuickAction icon={MessageSquare} label="Schedule interview" href="/app/interviews" />
            <QuickAction icon={TrendingUp} label="Update sponsorship policy" href="/app/company" />
          </div>
        </div>
      </section>

      {/* Recent applications */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Recent applications</span>
        </div>

        {recentApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Users className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No applications yet.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              Post your first visa-aware role and candidates start appearing here.
            </p>
            <Link href="/app/jobs/new" className="btn-accent mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
              Post a role <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <ul className="divide-y divide-ink-100">
              {recentApps.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/app/candidates/${a.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50/60 md:gap-6"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-parchment">
                      {a.candidateName.split(" ").map((s) => s[0]).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[14.5px] font-semibold text-ink-900">{a.candidateName}</p>
                      <p className="mt-0.5 text-[12.5px] text-ink-500">{a.profession} · {a.yearsExp}y · {a.passport}</p>
                    </div>
                    <span className="hidden md:inline-flex rounded-full bg-ink-50 border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                      {a.job.title}
                    </span>
                    <VisaPill fit={a.visaFit} />
                    <span className="font-sans text-[15px] font-semibold text-ink-900 w-10 text-right">{a.matchScore}</span>
                    <StagePill stage={a.stage} />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/app/candidates" className="block border-t border-ink-100 px-5 py-3 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 hover:text-ink-900 font-medium">
              Open full pipeline →
            </Link>
          </div>
        )}
      </section>

      {/* Copilot banner for hiring */}
      <section className="rounded-[28px] bg-lagoon-500 p-10 text-parchment md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lagoon-300/30 blur-[80px]" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
              <Zap className="h-4 w-4" strokeWidth={2} />
            </span>
            <h3 className="mt-5 font-sans text-[26px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Want the Copilot to pre-screen candidates?
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] leading-[1.6] text-white/80">
              Plug in your sponsorship policy and interview questions. Glimmora will do a first-pass rank before you spend a recruiter's hour.
            </p>
          </div>
          <Link href="/app/company" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white md:self-center">
            Set up policy <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ n, l, sub, tone }: { n: number; l: string; sub?: string; tone?: "ink" }) {
  if (tone === "ink") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 text-parchment">
        <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lagoon-500/20 blur-[50px]" />
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-300 font-medium">{l}</p>
        <p className="mt-2 font-sans text-[44px] font-semibold leading-none tracking-[-0.035em]">{n}</p>
        {sub ? <p className="mt-2 text-[12px] text-white/60">{sub}</p> : null}
      </div>
    );
  }
  return <StatCard n={n} l={l} sub={sub} />;
}

function StatCard({ n, l, sub, tone }: { n: number; l: string; sub?: string; tone?: "lagoon" }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" : "bg-white border-ink-200"}`}>
      <p className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${tone === "lagoon" ? "text-lagoon-800" : "text-ink-500"}`}>{l}</p>
      <p className="mt-2 font-sans text-[44px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      {sub ? <p className={`mt-2 text-[12px] ${tone === "lagoon" ? "text-ink-700" : "text-ink-500"}`}>{sub}</p> : null}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-ink-700 transition-colors hover:bg-ink-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-parchment text-ink-700">
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-ink-900" />
    </Link>
  );
}

function VisaPill({ fit }: { fit: string }) {
  const map = {
    yes: { bg: "bg-lagoon-50 border-lagoon-100 text-lagoon-800", l: "Visa ready" },
    maybe: { bg: "bg-gilt-50 border-gilt-200 text-gilt-800", l: "Check needed" },
    no: { bg: "bg-danger-50 border-danger-100 text-danger-700", l: "Blocked" },
    unknown: { bg: "bg-ink-50 border-ink-200 text-ink-700", l: "Unknown" },
  } as const;
  const v = (map as any)[fit] ?? map.unknown;
  return <span className={`hidden md:inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${v.bg}`}>{v.l}</span>;
}

function StagePill({ stage }: { stage: string }) {
  const map: Record<string, { bg: string; l: string }> = {
    NEW:         { bg: "bg-ink-50 border-ink-200 text-ink-700",         l: "New" },
    SHORTLISTED: { bg: "bg-lagoon-50 border-lagoon-100 text-lagoon-800", l: "Shortlisted" },
    INTERVIEW:   { bg: "bg-gilt-50 border-gilt-200 text-gilt-800",       l: "Interview" },
    OFFER:       { bg: "bg-success-50 border-success-100 text-success-700", l: "Offer" },
    HIRED:       { bg: "bg-success-100 border-success-200 text-success-800", l: "Hired" },
    REJECTED:    { bg: "bg-danger-50 border-danger-100 text-danger-700", l: "Rejected" },
  };
  const v = map[stage] ?? map.NEW;
  return <span className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] font-medium ${v.bg}`}>{v.l}</span>;
}
