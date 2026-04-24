import type { Metadata } from "next";
import { BarChart3, TrendingUp, Globe2, FileText, Target, Download } from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { organization } = await requireCorporateSession();

  const [employees, cases, policies, invoices] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      include: { policy: true },
    }),
    prisma.relocationCase.findMany({
      where: { employee: { organizationId: organization.id } },
    }),
    prisma.policy.findMany({ where: { organizationId: organization.id } }),
    prisma.invoice.findMany({ where: { organizationId: organization.id } }),
  ]);

  const active = employees.filter((e) => e.relocationStatus === "ACTIVE");
  const settled = employees.filter((e) => e.relocationStatus === "SETTLED");

  // Spend by country
  const spendByCountry: Record<string, number> = {};
  for (const c of cases) {
    if (c.destCountry) spendByCountry[c.destCountry] = (spendByCountry[c.destCountry] ?? 0) + c.spent;
  }

  // Spend by policy
  const spendByPolicy: Record<string, { name: string; total: number; n: number }> = {};
  for (const e of active.concat(settled)) {
    const policyName = e.policy?.name ?? "No policy";
    const c = cases.find((c) => c.employeeId === e.id);
    if (!spendByPolicy[policyName]) spendByPolicy[policyName] = { name: policyName, total: 0, n: 0 };
    spendByPolicy[policyName].total += c?.spent ?? 0;
    spendByPolicy[policyName].n += 1;
  }

  const totalSpend = cases.reduce((s, c) => s + c.spent, 0);
  const avgPerCase = cases.length > 0 ? Math.round(totalSpend / cases.length) : 0;

  // Invoice summary
  const paidYTD = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Reports</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Program insights.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Canned reports for CFO, COO, and Board. Export to CSV or PDF — wires at W5.
          </p>
        </div>
        <button
          disabled
          title="Report export lands with W5."
          className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Export
          <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W5</span>
        </button>
      </header>

      {/* Exec summary */}
      <section className="mb-10 relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-moss-500/25 blur-[70px]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-500/20 border border-moss-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-moss-300 font-semibold">
              <TrendingUp className="h-3 w-3" /> Executive summary
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">Q3 2026</span>
          </div>
          <div className="mt-6 grid gap-8 md:grid-cols-4">
            <ExecStat label="Relocations" value={String(active.length + settled.length)} sub={`${active.length} active · ${settled.length} settled`} />
            <ExecStat label="Spend" value={money(totalSpend, "EUR")} sub={`avg ${money(avgPerCase, "EUR")} / case`} />
            <ExecStat label="YTD paid" value={money(paidYTD, "EUR")} sub="invoices to Glimmora" />
            <ExecStat label="Outstanding" value={money(outstanding, "EUR")} sub="awaiting payment" />
          </div>
        </div>
      </section>

      {/* Spend by country */}
      <section className="mb-10 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss-100 text-moss-700">
            <Globe2 className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Spend by destination</p>
            <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Where the budget goes</h2>
          </div>
        </div>
        {Object.keys(spendByCountry).length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">No spend recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {Object.entries(spendByCountry).sort((a, b) => b[1] - a[1]).map(([country, amt]) => {
              const pct = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
              return (
                <li key={country}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-mono font-semibold uppercase tracking-[0.18em] text-ink-800">{country}</span>
                    <span className="font-sans font-semibold text-ink-900">{money(amt, "EUR")} <span className="text-ink-400 font-mono text-[11px]">· {pct}%</span></span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Spend by policy */}
      <section className="mb-10 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
            <FileText className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Spend by policy tier</p>
            <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Who costs what</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600 font-medium">Policy</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600 font-medium">Employees</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600 font-medium">Total spend</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600 font-medium">Avg / employee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {Object.values(spendByPolicy).sort((a, b) => b.total - a.total).map((p) => (
                <tr key={p.name} className="hover:bg-parchment/60">
                  <td className="px-4 py-3 font-sans font-semibold text-ink-900">{p.name}</td>
                  <td className="px-4 py-3 text-ink-700">{p.n}</td>
                  <td className="px-4 py-3 font-sans font-semibold text-ink-900">{money(p.total, "EUR")}</td>
                  <td className="px-4 py-3 text-ink-700">{money(p.n > 0 ? Math.round(p.total / p.n) : 0, "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Policy compliance */}
      <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
            <Target className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Policy compliance</p>
            <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Cap utilisation</h2>
          </div>
        </div>
        <ul className="space-y-3">
          {active.map((e) => {
            const c = cases.find((c) => c.employeeId === e.id);
            if (!c?.budgetCap) return null;
            const pct = Math.round((c.spent / c.budgetCap) * 100);
            return (
              <li key={e.id} className="rounded-xl border border-ink-100 bg-parchment/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sans text-[13.5px] font-semibold text-ink-900">{e.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">{e.policy?.name ?? "No policy"} · {e.destCountry}</p>
                  </div>
                  <p className={cn("font-mono text-[10.5px] uppercase tracking-[0.18em] font-semibold",
                    pct > 90 ? "text-danger-700" : pct > 70 ? "text-gilt-800" : "text-moss-700")}>
                    {pct}% of cap
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-ink-100">
                    <div className={cn("h-full rounded-full", pct > 90 ? "bg-danger-500" : pct > 70 ? "bg-gilt-500" : "bg-moss-500")} style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
                  </div>
                  <p className="shrink-0 font-mono text-[10px] text-ink-500">
                    {money(c.spent, c.currency)} / {money(c.budgetCap, c.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ExecStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{label}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.025em] text-parchment">{value}</p>
      <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/50">{sub}</p>
    </div>
  );
}
