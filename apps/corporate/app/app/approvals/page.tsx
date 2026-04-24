import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckSquare, CheckCircle2, XCircle, Clock, ArrowRight, User,
} from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";
import { DecisionButtons } from "./decision-buttons";

export const metadata: Metadata = { title: "Approvals" };

const kindLabel: Record<string, string> = {
  BUDGET_OVERRIDE:   "Budget override",
  POLICY_EXCEPTION:  "Policy exception",
  EXTENSION:         "Extension",
};

export default async function ApprovalsPage() {
  const { organization } = await requireCorporateSession();

  const approvals = await prisma.approval.findMany({
    where: { organizationId: organization.id },
    include: {
      employee: { include: { policy: { select: { name: true, relocationCap: true, currency: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = approvals.filter((a) => a.status === "PENDING");
  const decided = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Approvals</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Exception requests.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          When a manager needs to override a policy — bigger budget, extended housing, special shipping — they submit here. You decide.
        </p>
      </header>

      {pending.length > 0 ? (
        <Section num="01" label="Waiting on you">
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a.id} className="rounded-2xl border border-gilt-200 bg-gilt-50/40 p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-[15px] font-semibold text-ink-900">{a.employee.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gilt-100 border border-gilt-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
                        {kindLabel[a.kind] ?? a.kind}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      {a.employee.title} · current policy: {a.employee.policy?.name ?? "—"}
                    </p>
                    <p className="mt-3 text-[13px] italic leading-[1.55] text-ink-700 border-l-2 border-gilt-300 pl-3">
                      "{a.reason}"
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      <User className="mr-1 inline h-3 w-3" /> Requested by {a.requestedBy} · {relativeTime(a.createdAt)}
                    </p>
                  </div>

                  {a.requestedAmount ? (
                    <div className="rounded-xl border border-gilt-300 bg-white p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Requested cap</p>
                      <p className="mt-1 font-sans text-[22px] font-semibold text-ink-900">{money(a.requestedAmount, a.currency ?? "EUR")}</p>
                      {a.employee.policy ? (
                        <p className="mt-1 font-mono text-[10px] text-ink-500">
                          vs policy {money(a.employee.policy.relocationCap, a.employee.policy.currency)}
                        </p>
                      ) : null}
                    </div>
                  ) : <div /> }

                  <div className="flex items-center gap-3 md:justify-end md:items-start md:pt-1">
                    <DecisionButtons approvalId={a.id} employeeName={a.employee.name} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gilt-200 pt-3 text-[11px] text-ink-500">
                  <Link href={`/app/employees/${a.employeeId}`} className="font-mono uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium">
                    Open employee →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <section className="mb-10 rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <CheckSquare className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Nothing pending.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Exception requests from hiring managers will land here.
          </p>
        </section>
      )}

      {decided.length > 0 ? (
        <Section num="—" label="Decided">
          <ul className="space-y-3">
            {decided.map((a) => (
              <li key={a.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-[14px] font-semibold text-ink-900">{a.employee.name}</p>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">{kindLabel[a.kind] ?? a.kind}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-600 truncate">"{a.reason}"</p>
                  </div>
                  <div className="text-[12px] text-ink-500">
                    Decided by {a.decidedBy ?? "—"} · {a.decidedAt ? relativeTime(a.decidedAt) : "—"}
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium shrink-0 md:justify-self-end",
                    a.status === "APPROVED" ? "bg-success-50 border-success-200 text-success-700" :
                    a.status === "DECLINED" ? "bg-danger-50 border-danger-200 text-danger-700" :
                    "bg-ink-50 border-ink-200 text-ink-500"
                  )}>
                    {a.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> : <XCircle className="h-3 w-3" strokeWidth={2.5} />}
                    {a.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
      </div>
      {children}
    </section>
  );
}
