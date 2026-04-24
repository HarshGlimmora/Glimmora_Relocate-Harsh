import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Globe2, Building2, Target, Calendar, CheckCircle2,
  FileText, TrendingUp, ShieldCheck, Clock, User as UserIcon,
} from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, formatDate, cn, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Employee" };

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { organization } = await requireCorporateSession();

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      policy: true,
      cases: { orderBy: { startedAt: "desc" } },
      approvalsSubject: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee || employee.organizationId !== organization.id) notFound();

  const activeCase = employee.cases.find((c) => c.status === "ACTIVE");
  const spent = activeCase?.spent ?? 0;
  const cap = activeCase?.budgetCap ?? 0;
  const budgetPct = cap > 0 ? Math.round((spent / cap) * 100) : 0;
  const pct = employee.milestonesTotal > 0 ? Math.round((employee.milestonesDone / employee.milestonesTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10 md:py-10">
      <Link href="/app/employees" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to employees
      </Link>

      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-moss-500/25 blur-[70px]" />
        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                {employee.department}
              </span>
              {employee.policy ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-moss-500/20 border border-moss-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-moss-300">
                  <FileText className="h-3 w-3" /> {employee.policy.name}
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss-600 text-white text-[16px] font-semibold">
                {initials(employee.name)}
              </span>
              <div>
                <h1 className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                  {employee.name}
                </h1>
                <p className="mt-1 text-[14px] text-white/70">{employee.title}{employee.level ? ` · ${employee.level}` : ""}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> {employee.homeCountry}{employee.destCountry ? ` → ${employee.destCountry}` : ""}</span>
              {employee.destCity ? (<><span className="h-3 w-px bg-white/20" /><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {employee.destCity}</span></>) : null}
              {employee.manager ? (<><span className="h-3 w-px bg-white/20" /><span className="inline-flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> {employee.manager}</span></>) : null}
            </div>
            {employee.targetStartDate ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/80 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                Start {formatDate(employee.targetStartDate)} · {relativeTime(employee.targetStartDate)}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Plan progress</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-sans text-[52px] font-semibold leading-none tracking-[-0.035em] text-parchment">{pct}%</span>
              <span className="text-[13px] text-white/60">{employee.milestonesDone}/{employee.milestonesTotal}</span>
            </div>
            <div className="mt-4 h-[4px] w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-moss-400 to-moss-300" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            {cap > 0 ? (
              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                <Row label="Spent" value={money(spent, activeCase?.currency ?? "EUR")} />
                <Row label="Cap" value={money(cap, activeCase?.currency ?? "EUR")} />
                <Row label="Utilization" value={`${budgetPct}%`} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Policy envelope */}
          {employee.policy ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss-100 text-moss-700">
                  <FileText className="h-[16px] w-[16px]" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Policy envelope</p>
                  <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">{employee.policy.name}</h2>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                <Detail label="Tier" value={employee.policy.tier.toLowerCase().replace("_", " ")} />
                <Detail label="Relocation cap" value={money(employee.policy.relocationCap, employee.policy.currency)} />
                {employee.policy.housingCap ? <Detail label="Housing cap" value={money(employee.policy.housingCap, employee.policy.currency)} /> : null}
                {employee.policy.lumpSum ? <Detail label="Lump sum" value={money(employee.policy.lumpSum, employee.policy.currency)} /> : null}
                <Detail label="Shipping" value={employee.policy.shippingIncluded ? "Included" : "Not included"} />
              </dl>
              {employee.policy.description ? (
                <p className="mt-4 border-t border-ink-100 pt-4 text-[13.5px] text-ink-600 leading-[1.6]">{employee.policy.description}</p>
              ) : null}
            </section>
          ) : null}

          {/* Budget breakdown */}
          {cap > 0 ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
                  <Target className="h-[16px] w-[16px]" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Budget</p>
                  <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
                    {money(spent, activeCase?.currency)} of {money(cap, activeCase?.currency)}
                  </h2>
                </div>
              </div>
              <div className="mt-5 h-3 w-full rounded-full bg-ink-100">
                <div className={cn("h-full rounded-full", budgetPct > 90 ? "bg-danger-500" : budgetPct > 70 ? "bg-gilt-500" : "bg-moss-500")} style={{ width: `${Math.max(4, Math.min(100, budgetPct))}%` }} />
              </div>
              <p className="mt-3 text-[13px] text-ink-600">
                {budgetPct}% of policy cap consumed. {budgetPct > 90 ? "Budget is nearly exhausted — consider requesting an override." : budgetPct > 70 ? "Tracking high but within policy." : "Healthy headroom remaining."}
              </p>
            </section>
          ) : null}

          {/* Approvals for this employee */}
          {employee.approvalsSubject.length > 0 ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-800">
                  <CheckCircle2 className="h-[16px] w-[16px]" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Approvals</p>
                  <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Exception requests</h2>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {employee.approvalsSubject.map((a) => (
                  <li key={a.id} className="rounded-xl border border-ink-100 bg-parchment/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-sans text-[13.5px] font-semibold text-ink-900">{a.kind.replace(/_/g, " ").toLowerCase()}</p>
                        <p className="mt-0.5 text-[11.5px] font-mono uppercase tracking-[0.18em] text-ink-500">Requested by {a.requestedBy} · {relativeTime(a.createdAt)}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium",
                        a.status === "APPROVED" ? "bg-success-50 border-success-200 text-success-700" :
                        a.status === "DECLINED" ? "bg-danger-50 border-danger-200 text-danger-700" :
                        "bg-gilt-50 border-gilt-200 text-gilt-800",
                      )}>{a.status}</span>
                    </div>
                    <p className="mt-2 text-[13px] italic text-ink-700 border-l-2 border-ink-200 pl-3">"{a.reason}"</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Contact</p>
            <p className="mt-3 font-sans text-[13px] font-semibold text-ink-900">{employee.email}</p>
            {employee.manager ? <p className="mt-2 text-[12px] text-ink-600">Manager: {employee.manager}</p> : null}
          </section>

          {activeCase ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Current stage</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-moss-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {activeCase.stage.replace(/_/g, " ").toLowerCase()}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                Opened {relativeTime(activeCase.startedAt)}
              </p>
            </section>
          ) : null}

          <section className="rounded-2xl bg-ink-900 p-6 text-parchment relative overflow-hidden">
            <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-moss-500/20 blur-[50px]" />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-moss-300">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-sans text-[14px] font-semibold">Compliance</p>
              <p className="mt-2 text-[12px] text-white/70 leading-[1.55]">
                All spending tracks against {employee.policy?.name ?? "the assigned policy"}. Exception requests route to the approvals queue.
              </p>
            </div>
          </section>
        </aside>
      </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</dt>
      <dd className="mt-1 font-sans text-[13.5px] font-semibold text-ink-900 capitalize">{value}</dd>
    </div>
  );
}
