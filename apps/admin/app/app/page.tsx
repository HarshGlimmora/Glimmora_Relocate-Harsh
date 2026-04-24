import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase, Building2, Plane, TrendingUp, Users, ArrowRight, ShieldCheck,
  CheckCircle2, Activity,
} from "lucide-react";
import {
  listEmployerCompanies,
  countEmployerJobs,
  listHires,
  employerPipelineStats,
  countActiveRelocations,
  listRelocations,
  countConsumerUsers,
} from "@/lib/xdb";

export const metadata: Metadata = { title: "Dashboard" };

const SUCCESS_FEE_PCT = 0.08;

function money(n: number, cur: string) {
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : cur === "USD" ? "$" : "";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function daysAgo(ms: number) {
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 7) return `${d} days ago`;
  if (d < 14) return "1 week ago";
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}

export default async function OpsDashboard() {
  const companies = listEmployerCompanies();
  const jobs = countEmployerJobs();
  const hires = listHires();
  const pipeline = employerPipelineStats();
  const activeRelocations = countActiveRelocations();
  const relocations = listRelocations();
  const consumerUsers = countConsumerUsers();

  const feeOwedByCurrency = hires.reduce<Record<string, number>>((acc, h) => {
    if (!h.baseSalary || !h.currency) return acc;
    const fee = Math.round(h.baseSalary * SUCCESS_FEE_PCT);
    acc[h.currency] = (acc[h.currency] ?? 0) + fee;
    return acc;
  }, {});
  const primaryCurrency = Object.keys(feeOwedByCurrency)[0] ?? "EUR";
  const primaryFee = feeOwedByCurrency[primaryCurrency] ?? 0;

  const verifiedCount = companies.filter((c) => c.verified === 1).length;
  const latestHires = hires.slice(0, 4);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      {/* Header */}
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Platform overview</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          The state of Glimmora.
        </h1>
        <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.6] text-ink-600">
          Every company, every hire, every relocation — one screen. Updated live from Employer and Consumer databases.
        </p>
      </header>

      {/* KPIs — revenue hero */}
      <section className="mb-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/20 blur-[80px]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500/20 border border-gilt-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-semibold">
                <TrendingUp className="h-3 w-3" /> Success-fee revenue
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                {SUCCESS_FEE_PCT * 100}% of first-year salary
              </span>
            </div>
            <p className="mt-6 font-sans text-[clamp(3.5rem,8vw,5.5rem)] font-semibold leading-none tracking-[-0.035em]">
              {money(primaryFee, primaryCurrency)}
            </p>
            <p className="mt-2 text-[13.5px] text-white/65">
              Earned across {hires.length} hire{hires.length === 1 ? "" : "s"}{" "}
              {Object.keys(feeOwedByCurrency).length > 1 ? `· primary: ${primaryCurrency}` : ""}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <MiniStat title="Companies" value={companies.length} sub={`${verifiedCount} verified`} />
              <MiniStat title="Active jobs" value={jobs.active} sub={`${jobs.total} total posted`} />
              <MiniStat title="Members" value={consumerUsers} sub="candidate accounts" />
            </div>
          </div>
        </div>

        {/* Right column: pipeline snapshot */}
        <div className="rounded-[28px] border border-ink-200 bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
              <Activity className="h-[16px] w-[16px]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Pipeline</p>
              <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                {pipeline.totalApplications} applications
              </h2>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {pipeline.byStage.map((s) => {
              const pct = pipeline.totalApplications > 0 ? Math.round((s.n / pipeline.totalApplications) * 100) : 0;
              return (
                <li key={s.stage}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">{s.stage}</span>
                    <span className="font-sans font-semibold text-ink-900">
                      {s.n} <span className="text-ink-400">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${stageColor(s.stage)}`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Second row: hires + relocations summary */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
                <Briefcase className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Hires</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                  {hires.length} closed
                </h2>
              </div>
            </div>
            <Link
              href="/app/hires"
              className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium"
            >
              Ledger →
            </Link>
          </div>

          {latestHires.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
              No hires yet on the platform.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {latestHires.map((h) => {
                const fee = h.baseSalary ? Math.round(h.baseSalary * SUCCESS_FEE_PCT) : 0;
                return (
                  <li key={h.applicationId} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-parchment/40 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">
                        {h.candidateName}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">
                        {h.jobTitle} · {h.companyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-[13px] font-semibold text-ink-900">
                        {h.currency && h.baseSalary ? money(fee, h.currency) : "—"}
                      </p>
                      <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                        {h.acceptedAt ? daysAgo(h.acceptedAt) : "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
                <Plane className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Relocations</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                  {activeRelocations} active
                </h2>
              </div>
            </div>
            <Link
              href="/app/relocations"
              className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium"
            >
              See all →
            </Link>
          </div>

          {relocations.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
              No relocation plans have been triggered yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {relocations.slice(0, 4).map((r) => {
                const pct = r.totalCount > 0 ? Math.round((r.doneCount / r.totalCount) * 100) : 0;
                return (
                  <li key={r.id} className="rounded-xl border border-ink-100 bg-parchment/40 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">
                          {r.userName ?? r.userEmail}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-ink-500">
                          {r.jobTitle} · {r.destCity ?? r.destCountry}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-lagoon-200 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lagoon-400 to-lagoon-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Companies strip */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Employers on Glimmora</span>
        </div>
        {companies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
            No companies yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/app/companies#${c.id}`}
                className="group rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[15px] font-semibold tracking-tight text-ink-900">{c.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      <Building2 className="h-3 w-3" />
                      {c.hqCity ? `${c.hqCity}, ${c.hqCountry ?? ""}` : c.hqCountry ?? "—"}
                      <span className="text-ink-300">·</span>
                      <span>{c.size ?? "—"}</span>
                    </p>
                  </div>
                  {c.verified ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-lagoon-50 border border-lagoon-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
                      <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> Verified
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Platform integrity callout */}
      <section className="rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-900 to-[#0a1820] p-10 text-parchment md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lagoon-500/20 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lagoon-500/20 border border-lagoon-400/30 text-lagoon-300">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Platform integrity is our product.
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              Every hire logs to this console. Candidates see visa-matched jobs only. Employers never see a candidate they can't legally sponsor. Success fees invoice automatically on hire.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-[13px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 font-medium">Quick links</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/app/hires" className="flex items-center justify-between text-white/85 hover:text-parchment"><span>Hire ledger</span><ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link href="/app/companies" className="flex items-center justify-between text-white/85 hover:text-parchment"><span>Company directory</span><ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link href="/app/relocations" className="flex items-center justify-between text-white/85 hover:text-parchment"><span>Relocation plans</span><ArrowRight className="h-3.5 w-3.5" /></Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{title}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.025em] text-parchment">{value}</p>
      {sub ? <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40">{sub}</p> : null}
    </div>
  );
}

function stageColor(stage: string) {
  switch (stage) {
    case "HIRED":       return "bg-success-500";
    case "OFFER":       return "bg-success-400";
    case "INTERVIEW":   return "bg-gilt-500";
    case "SHORTLISTED": return "bg-lagoon-500";
    case "REJECTED":    return "bg-danger-400";
    default:            return "bg-ink-400";
  }
}
