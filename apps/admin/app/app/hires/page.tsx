import type { Metadata } from "next";
import {
  Briefcase, Building2, CheckCircle2, DollarSign, MapPin, ShieldCheck,
} from "lucide-react";
import { listHires } from "@/lib/xdb";

export const metadata: Metadata = { title: "Hires" };

const SUCCESS_FEE_PCT = 0.08;

function money(n: number | null, cur: string | null) {
  if (n == null) return "—";
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : cur === "USD" ? "$" : "";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function fmtDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function HiresPage() {
  const hires = listHires();

  const feeByCurrency = hires.reduce<Record<string, number>>((acc, h) => {
    if (!h.baseSalary || !h.currency) return acc;
    acc[h.currency] = (acc[h.currency] ?? 0) + Math.round(h.baseSalary * SUCCESS_FEE_PCT);
    return acc;
  }, {});

  const salaryByCurrency = hires.reduce<Record<string, number>>((acc, h) => {
    if (!h.baseSalary || !h.currency) return acc;
    acc[h.currency] = (acc[h.currency] ?? 0) + h.baseSalary;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Hires ledger</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Every close. Every fee.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          When an employer's offer flips to accepted, the hire lands here with the invoiceable fee computed at {SUCCESS_FEE_PCT * 100}% of first-year salary.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <KPICard label="Hires" value={hires.length} sub="platform lifetime" />
        <KPICard
          label="Salaries placed"
          value={Object.entries(salaryByCurrency).map(([c, v]) => money(v, c)).join(" · ") || "—"}
          sub="sum of base"
          tone="gilt"
        />
        <KPICard
          label="Fees owed"
          value={Object.entries(feeByCurrency).map(([c, v]) => money(v, c)).join(" · ") || "—"}
          sub={`${SUCCESS_FEE_PCT * 100}% success fee`}
          tone="lagoon"
        />
      </section>

      {hires.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Briefcase className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No hires yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            When a candidate accepts an offer in the employer portal, the record lands in this ledger with the invoiceable fee computed automatically.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {hires.map((h) => {
            const fee = h.baseSalary ? Math.round(h.baseSalary * SUCCESS_FEE_PCT) : 0;
            return (
              <li
                key={h.applicationId}
                className="group grid gap-4 rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:grid-cols-[1.4fr_1fr_auto] md:px-6 md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12.5px] font-semibold text-parchment">
                      {h.candidateName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[15.5px] font-semibold text-ink-900">{h.candidateName}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                        {h.candidateEmail} · {h.candidatePassport ?? "—"} {h.profession ? `· ${h.profession}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink-900">
                    <Building2 className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.75} />
                    {h.companyName}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-500">
                    <span className="truncate">{h.jobTitle}</span>
                    {h.location ? (
                      <>
                        <span className="text-ink-300">·</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {h.location}</span>
                      </>
                    ) : null}
                    {h.visaTier ? (
                      <>
                        <span className="text-ink-300">·</span>
                        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {h.visaTier}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-4 md:justify-end">
                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Base</p>
                    <p className="mt-0.5 font-sans text-[14px] font-semibold text-ink-900">{money(h.baseSalary, h.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">Fee</p>
                    <p className="mt-0.5 font-sans text-[16px] font-semibold text-lagoon-700 inline-flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {money(fee, h.currency).replace(/^./, "")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Accepted</p>
                    <p className="mt-0.5 font-sans text-[12.5px] font-medium text-ink-700">{fmtDate(h.acceptedAt)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
        <CheckCircle2 className="h-3 w-3 text-success-600" strokeWidth={2.5} />
        Data sourced live from Glimmora for Employers
      </p>
    </div>
  );
}

function KPICard({
  label, value, sub, tone,
}: { label: string; value: number | string; sub?: string; tone?: "lagoon" | "gilt" }) {
  const bg = tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
             tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
             "bg-white border-ink-200";
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink-900 break-words">
        {value}
      </p>
      {sub ? <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p> : null}
    </div>
  );
}
