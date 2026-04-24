import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Users, Plane, AlertTriangle, TrendingUp, Globe2,
  Target, CheckSquare, Clock,
} from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { organization } = await requireCorporateSession();

  const [employees, approvals, cases, policies, invoices] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      include: { policy: true, cases: { orderBy: { startedAt: "desc" }, take: 1 } },
      orderBy: { lastEventAt: "desc" },
    }),
    prisma.approval.findMany({
      where: { organizationId: organization.id, status: "PENDING" },
      include: { employee: { select: { name: true, title: true } } },
    }),
    prisma.relocationCase.findMany({
      where: { employee: { organizationId: organization.id } },
    }),
    prisma.policy.findMany({ where: { organizationId: organization.id, active: true } }),
    prisma.invoice.findMany({
      where: { organizationId: organization.id },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  const activeRelocating = employees.filter((e) => e.relocationStatus === "ACTIVE");
  const planned = employees.filter((e) => e.relocationStatus === "PLANNED");
  const settled = employees.filter((e) => e.relocationStatus === "SETTLED");

  const budgetSpent = cases.reduce((s, c) => s + c.spent, 0);
  const budgetCap = cases.reduce((s, c) => s + (c.budgetCap ?? 0), 0);
  const budgetPct = budgetCap > 0 ? Math.round((budgetSpent / budgetCap) * 100) : 0;

  // At-risk = active relocations where case is nearing cap (>85%) or start date soon and milestones far behind
  const atRisk = activeRelocating.filter((e) => {
    const c = e.cases[0];
    const overBudget = c?.budgetCap ? c.spent / c.budgetCap > 0.85 : false;
    const daysToStart = e.targetStartDate ? (e.targetStartDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 999;
    const progress = e.milestonesTotal > 0 ? e.milestonesDone / e.milestonesTotal : 0;
    const behind = daysToStart < 30 && progress < 0.6;
    return overBudget || behind;
  });

  // Country breakdown
  const byCountry = activeRelocating.reduce<Record<string, number>>((acc, e) => {
    if (e.destCountry) acc[e.destCountry] = (acc[e.destCountry] ?? 0) + 1;
    return acc;
  }, {});

  const ytdPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const nextDue = invoices.find((i) => i.status === "ISSUED");

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Overview</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {organization.name}'s mobility program.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Every active relocation, every policy exception, every euro spent — in one screen.
        </p>
      </header>

      {/* KPIs */}
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <KPI Icon={Plane} label="Active" value={String(activeRelocating.length)} sub="employees in flight" tone="moss" />
        <KPI Icon={Clock} label="Planned" value={String(planned.length)} sub="upcoming starts" tone={planned.length > 0 ? "gilt" : undefined} />
        <KPI Icon={AlertTriangle} label="At risk" value={String(atRisk.length)} sub="budget or timeline drift" tone={atRisk.length > 0 ? "danger" : undefined} />
        <KPI Icon={CheckSquare} label="Approvals" value={String(approvals.length)} sub="pending your decision" tone={approvals.length > 0 ? "gilt" : undefined} />
      </section>

      {/* Hero: budget + invoices */}
      <section className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-moss-500/25 blur-[70px]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-500/20 border border-moss-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-moss-300 font-semibold">
                <Target className="h-3 w-3" /> Program spend
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">across {cases.length} cases</span>
            </div>
            <p className="mt-6 font-sans text-[clamp(3rem,7vw,4.5rem)] font-semibold leading-none tracking-[-0.035em]">
              {money(budgetSpent, "EUR")}
            </p>
            <p className="mt-2 text-[13.5px] text-white/65 max-w-md">
              of {money(budgetCap, "EUR")} budgeted · {budgetPct}% consumed
            </p>
            <div className="mt-5 h-[4px] w-full max-w-md rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", budgetPct > 90 ? "bg-gradient-to-r from-danger-400 to-danger-500" : "bg-gradient-to-r from-moss-400 to-moss-300")} style={{ width: `${Math.max(4, Math.min(100, budgetPct))}%` }} />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <MiniStat title="Active" value={activeRelocating.length} />
              <MiniStat title="Settled" value={settled.length} sub="lifetime" />
              <MiniStat title="Policies" value={policies.length} sub="active tiers" />
            </div>
          </div>
        </div>

        {/* Country mix */}
        <div className="rounded-[28px] border border-ink-200 bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss-100 text-moss-700">
              <Globe2 className="h-[16px] w-[16px]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Destinations</p>
              <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">{Object.keys(byCountry).length} countries</h2>
            </div>
          </div>
          {Object.keys(byCountry).length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
              No active relocations right now.
            </p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([country, count]) => {
                const pct = activeRelocating.length > 0 ? Math.round((count / activeRelocating.length) * 100) : 0;
                return (
                  <li key={country}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 font-semibold">{country}</span>
                      <span className="font-sans text-ink-900"><span className="font-semibold">{count}</span> <span className="text-ink-400">· {pct}%</span></span>
                    </div>
                    <div className="mt-1 h-1 w-full rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Approvals + At Risk */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
                <CheckSquare className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Pending approvals</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                  {approvals.length} waiting on you
                </h2>
              </div>
            </div>
            <Link href="/app/approvals" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium">
              Queue →
            </Link>
          </div>
          {approvals.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">Nothing pending.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {approvals.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link href={`/app/approvals`} className="block rounded-xl border border-ink-100 bg-parchment/40 px-4 py-3 hover:border-ink-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans text-[13.5px] font-semibold text-ink-900">{a.employee.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-500">{a.kind.replace(/_/g, " ").toLowerCase()}</p>
                      </div>
                      {a.requestedAmount ? (
                        <p className="font-sans text-[14px] font-semibold text-ink-900">{money(a.requestedAmount, a.currency ?? "EUR")}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
                <AlertTriangle className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">At risk</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">{atRisk.length} cases need attention</h2>
              </div>
            </div>
            <Link href="/app/employees" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium">
              All employees →
            </Link>
          </div>
          {atRisk.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">All cases on track.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {atRisk.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <Link href={`/app/employees/${e.id}`} className="block rounded-xl border border-ink-100 bg-parchment/40 px-4 py-3 hover:border-ink-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans text-[13.5px] font-semibold text-ink-900">{e.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-500">{e.title} · {e.homeCountry} → {e.destCity}, {e.destCountry}</p>
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700 font-medium">
                        {e.milestonesDone}/{e.milestonesTotal}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Active cases strip */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Recent activity</span>
          <Link href="/app/pipelines" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium">Pipelines →</Link>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {activeRelocating.slice(0, 6).map((e) => {
            const c = e.cases[0];
            const pct = e.milestonesTotal > 0 ? Math.round((e.milestonesDone / e.milestonesTotal) * 100) : 0;
            return (
              <li key={e.id}>
                <Link href={`/app/employees/${e.id}`} className="block rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-[14.5px] font-semibold text-ink-900">{e.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">{e.title} · {e.department}</p>
                    </div>
                    {e.policy ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-moss-50 border border-moss-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-moss-800 font-medium">
                        {e.policy.tier.toLowerCase().replace("_", " ")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12.5px] text-ink-600">
                    {e.homeCountry} → {e.destCity ?? e.destCountry}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{e.milestonesDone}/{e.milestonesTotal}</span>
                  </div>
                  {c?.spent && c.budgetCap ? (
                    <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                      {money(c.spent, c.currency)} / {money(c.budgetCap, c.currency)} budget
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Invoices mini-panel */}
      <section className="rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-moss-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-500/20 border border-moss-400/30 text-moss-300">
              <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              {money(ytdPaid, "EUR")} paid YTD.
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              {nextDue ? `Next invoice ${nextDue.number} (${money(nextDue.total, nextDue.currency)}) due ${relativeTime(nextDue.dueAt)}.` : "All invoices settled."}
            </p>
          </div>
          <Link href="/app/billing" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white self-start md:self-center">
            Billing ledger <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function KPI({ Icon, label, value, sub, tone }: { Icon: typeof Users; label: string; value: string; sub: string; tone?: "moss" | "gilt" | "danger" }) {
  const bg =
    tone === "moss"   ? "bg-moss-50 border-moss-100" :
    tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
    tone === "danger" ? "bg-danger-50 border-danger-100" :
    "bg-white border-ink-200";
  const iconBg =
    tone === "moss"   ? "bg-moss-600 text-white" :
    tone === "gilt"   ? "bg-gilt-500 text-ink-900" :
    tone === "danger" ? "bg-danger-500 text-white" :
    "bg-ink-900 text-parchment";
  return (
    <div className={cn("rounded-2xl border p-5", bg)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
          <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{value}</p>
          <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

function MiniStat({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{title}</p>
      <p className="mt-2 font-sans text-[24px] font-semibold leading-none tracking-[-0.025em] text-parchment">{value}</p>
      {sub ? <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40">{sub}</p> : null}
    </div>
  );
}
