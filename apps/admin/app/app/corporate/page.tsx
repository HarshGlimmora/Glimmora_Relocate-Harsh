import type { Metadata } from "next";
import { BookUser, Building2, Users, Plane, CheckCircle2, AlertCircle, FileText, Briefcase } from "lucide-react";
import { listOrganizations, listCorporateInvoices } from "@/lib/xdb";

export const metadata: Metadata = { title: "Corporate accounts" };

function money(n: number, cur: string) {
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function CorporatePage() {
  const orgs = listOrganizations();
  const invoices = listCorporateInvoices();

  const invoicesByCurrency = invoices.reduce<Record<string, number>>((acc, i) => {
    acc[i.currency] = (acc[i.currency] ?? 0) + i.amount;
    return acc;
  }, {});
  const primaryCur = Object.keys(invoicesByCurrency)[0] ?? "EUR";
  const totalInvoiced = invoicesByCurrency[primaryCur] ?? 0;

  const activeRelocationsTotal = orgs.reduce((a, o) => a + o.activeRelocations, 0);
  const employeesTotal = orgs.reduce((a, o) => a + o.employeeCount, 0);
  const openApprovalsTotal = orgs.reduce((a, o) => a + o.openApprovals, 0);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Knowledge & Support</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Corporate accounts.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          Enterprise mobility deals. Each org holds its own policy envelope and budget — their HR team runs day-to-day inside the Corporate portal.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={orgs.length}           l="Organizations"    sub="on contract"            tone="lagoon" />
        <Kpi n={employeesTotal}        l="Employees tracked" sub="across all orgs"       />
        <Kpi n={activeRelocationsTotal} l="Live relocations"  sub="in pipeline" tone="gilt" />
        <Kpi n={openApprovalsTotal}    l="Open approvals"    sub="awaiting HR decision"  />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Accounts" />
        {orgs.length === 0 ? (
          <EmptyState title="No corporate accounts." body="Sales-led deals land here once a contract is signed in the Corporate portal." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((o) => (
              <article key={o.id} className="rounded-2xl border border-ink-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-sans text-[17px] font-semibold tracking-tight text-ink-900">{o.name}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      <Building2 className="h-3 w-3" />
                      {o.hqCity ? `${o.hqCity}, ${o.hqCountry}` : o.hqCountry ?? "—"}
                      <span className="text-ink-300">·</span>
                      <span>{o.industry ?? "—"}</span>
                      <span className="text-ink-300">·</span>
                      <span>{o.size ?? "—"}</span>
                    </p>
                  </div>
                  <TierBadge tier={o.contractTier} />
                </div>

                <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-ink-100 pt-4 text-[12px]">
                  <DtDd t="Employees" icon={<Users className="h-3 w-3" />} v={`${o.employeeCount}`} />
                  <DtDd t="Active" icon={<Plane className="h-3 w-3" />} v={`${o.activeRelocations}`} />
                  <DtDd t="Policies" icon={<FileText className="h-3 w-3" />} v={`${o.policyCount}`} />
                  <DtDd t="Approvals" icon={<AlertCircle className="h-3 w-3" />} v={`${o.openApprovals}`} />
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                    Billing → {o.billingEmail ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
                    {o.invoiceCount} invoice{o.invoiceCount === 1 ? "" : "s"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead num="02" label="Invoice ledger" />
        {invoices.length === 0 ? (
          <EmptyState title="No invoices issued." body="Monthly cycle hasn't triggered any invoices yet." />
        ) : (
          <>
            <div className="mb-4 inline-flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
              Total invoiced <span className="font-sans text-[14px] font-semibold text-ink-900">{money(totalInvoiced, primaryCur)}</span>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
              <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.6fr] gap-3 border-b border-ink-100 bg-parchment/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
                <span>Organization</span>
                <span>Period</span>
                <span>Amount</span>
                <span>Status</span>
                <span className="text-right">Issued</span>
              </div>
              {invoices.map((i, idx) => (
                <div
                  key={i.id}
                  className={`grid gap-2 px-5 py-3.5 md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.6fr] md:items-center md:py-4 ${idx < invoices.length - 1 ? "border-b border-ink-100" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-ink-500" />
                    <span className="font-sans text-[13.5px] font-semibold text-ink-900 truncate">{i.organizationName}</span>
                  </div>
                  <Cell label="Period" v={i.period} mono />
                  <Cell label="Amount" v={money(i.amount, i.currency)} />
                  <Cell label="Status">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${invoiceStatusCls(i.status)}`}>
                      {i.status === "PAID" ? <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> : null}
                      {i.status}
                    </span>
                  </Cell>
                  <div className="flex items-center justify-between md:justify-end">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">Issued</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">{formatDate(i.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function DtDd({ t, v, icon }: { t: string; v: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
        {icon}{t}
      </dt>
      <dd className="mt-1 font-sans text-[15px] font-semibold text-ink-900">{v}</dd>
    </div>
  );
}

function Cell({ label, v, mono, children }: { label: string; v?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between md:block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">{label}</span>
      {children ?? (
        <span className={`${mono ? "font-mono text-[11.5px] text-ink-700" : "font-sans text-[13px] font-semibold text-ink-900"}`}>{v}</span>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cls = tier === "ENTERPRISE"
    ? "border-ink-900 bg-ink-900 text-parchment"
    : tier === "CUSTOM"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : "border-ink-200 bg-parchment text-ink-700";
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${cls}`}>
      <BookUser className="h-2.5 w-2.5" /> {tier}
    </span>
  );
}

function invoiceStatusCls(status: string): string {
  switch (status) {
    case "PAID": return "border-lagoon-200 bg-lagoon-50 text-lagoon-800";
    case "OVERDUE": return "border-danger-200 bg-danger-50 text-danger-700";
    case "ISSUED": return "border-gilt-200 bg-gilt-50 text-gilt-800";
    default: return "border-ink-200 bg-ink-50 text-ink-700";
  }
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <BookUser className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
