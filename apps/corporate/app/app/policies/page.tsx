import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Policies" };

const tierMeta: Record<string, { label: string; cls: string }> = {
  STANDARD:     { label: "Standard",    cls: "bg-moss-50 border-moss-200 text-moss-800" },
  EXEC:         { label: "Executive",   cls: "bg-gilt-50 border-gilt-200 text-gilt-800" },
  EARLY_CAREER: { label: "Early career", cls: "bg-lagoon-50 border-lagoon-200 text-lagoon-800" },
  INTERN:       { label: "Intern",      cls: "bg-ink-50 border-ink-200 text-ink-700" },
};

export default async function PoliciesPage() {
  const { organization } = await requireCorporateSession();
  const policies = await prisma.policy.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { employees: true } } },
    orderBy: [{ active: "desc" }, { relocationCap: "desc" }],
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Policies</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Your relocation tiers.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Budgets, housing caps, lump sums, shipping rules — whatever you define, every hire gets an envelope automatically.
          </p>
        </div>
        <Link href="/app/policies/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-moss-600 pl-5 pr-4 text-[13.5px] font-semibold text-white hover:bg-moss-700">
          <Plus className="h-4 w-4" /> New policy
        </Link>
      </header>

      {policies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <FileText className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No policies yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Define at least one tier so HR can assign a relocation envelope when hiring.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {policies.map((p) => {
            const tier = tierMeta[p.tier] ?? tierMeta.STANDARD;
            return (
              <li key={p.id}>
                <Link href={`/app/policies/${p.id}/edit`} className="block rounded-2xl border border-ink-200 bg-white p-6 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-sans text-[18px] font-semibold tracking-tight text-ink-900">{p.name}</h2>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", tier.cls)}>
                          {tier.label}
                        </span>
                      </div>
                      {p.description ? (
                        <p className="mt-2 text-[13px] text-ink-600 leading-[1.55]">{p.description}</p>
                      ) : null}
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium shrink-0",
                      p.active ? "bg-success-50 border-success-200 text-success-700" : "bg-ink-50 border-ink-200 text-ink-500"
                    )}>
                      {p.active ? <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> : <XCircle className="h-2.5 w-2.5" strokeWidth={2.5} />}
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-ink-100 pt-4 text-[13px]">
                    <Stat label="Cap" value={money(p.relocationCap, p.currency)} />
                    {p.housingCap ? <Stat label="Housing" value={money(p.housingCap, p.currency)} /> : <Stat label="Housing" value="—" />}
                    {p.lumpSum ? <Stat label="Lump" value={money(p.lumpSum, p.currency)} /> : <Stat label="Lump" value="—" />}
                  </dl>

                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {p._count.employees} assigned · {p.shippingIncluded ? "Shipping incl." : "No shipping"}
                    </p>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 font-medium">
                      Edit <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</dt>
      <dd className="mt-1 font-sans text-[14px] font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
