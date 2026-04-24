import type { Metadata } from "next";
import { LineChart, TrendingUp, Briefcase, Plane, Wallet, CheckCircle2, ShieldCheck, FileDown, Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  listEmployerCompanies,
  countEmployerJobs,
  listHires,
  employerPipelineStats,
  countActiveRelocations,
  listRelocations,
  countConsumerUsers,
  listPartners,
  listPartnerBookings,
  listPartnerPayouts,
  listOrganizations,
  listCorporateInvoices,
} from "@/lib/xdb";

export const metadata: Metadata = { title: "Analytics & audit" };

const SUCCESS_FEE_PCT = 0.08;

function money(n: number, cur = "EUR") {
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function formatDateTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

type AuditEvent = {
  id: string;
  kind: string;
  who: string;
  what: string;
  when: number;
  portal: "Consumer" | "Employer" | "Partner" | "Corporate" | "Admin";
};

export default function AuditPage() {
  const companies = listEmployerCompanies();
  const jobs = countEmployerJobs();
  const hires = listHires();
  const pipeline = employerPipelineStats();
  const activeRelocations = countActiveRelocations();
  const relocations = listRelocations();
  const users = countConsumerUsers();
  const partners = listPartners();
  const bookings = listPartnerBookings();
  const payouts = listPartnerPayouts();
  const orgs = listOrganizations();
  const invoices = listCorporateInvoices();

  const successFees = hires.reduce<Record<string, number>>((acc, h) => {
    if (!h.baseSalary || !h.currency) return acc;
    const fee = Math.round(h.baseSalary * SUCCESS_FEE_PCT);
    acc[h.currency] = (acc[h.currency] ?? 0) + fee;
    return acc;
  }, {});
  const primaryCur = Object.keys(successFees)[0] ?? "EUR";
  const successFeeTotal = successFees[primaryCur] ?? 0;

  const payoutFees = payouts.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.platformFee;
    return acc;
  }, {});
  const marketplaceFeeTotal = payoutFees[primaryCur] ?? 0;

  const corporateFees = invoices.reduce<Record<string, number>>((acc, i) => {
    acc[i.currency] = (acc[i.currency] ?? 0) + i.amount;
    return acc;
  }, {});
  const corporateTotal = corporateFees[primaryCur] ?? 0;

  // Synthesize an audit event stream from real write-bearing rows across portals.
  const events: AuditEvent[] = [
    ...hires.map((h) => ({
      id: `hire-${h.applicationId}`,
      kind: "HIRE_CLOSED",
      who: h.candidateName,
      what: `hired at ${h.companyName} as ${h.jobTitle} · fee ${h.baseSalary ? money(Math.round(h.baseSalary * SUCCESS_FEE_PCT), h.currency ?? "EUR") : "—"}`,
      when: h.acceptedAt ?? 0,
      portal: "Employer" as const,
    })),
    ...relocations.map((r) => ({
      id: `reloc-${r.id}`,
      kind: "RELOCATION_STARTED",
      who: r.userName ?? r.userEmail,
      what: `started plan → ${r.destCity ?? r.destCountry} · ${r.jobTitle}`,
      when: r.acceptedAt,
      portal: "Consumer" as const,
    })),
    ...partners.filter((p) => p.kybApprovedAt).map((p) => ({
      id: `partner-approve-${p.id}`,
      kind: "PARTNER_APPROVED",
      who: p.name,
      what: `KYB approved → listings unlocked in ${p.category}`,
      when: p.kybApprovedAt ?? 0,
      portal: "Admin" as const,
    })),
    ...bookings.filter((b) => b.confirmedAt).map((b) => ({
      id: `booking-${b.id}`,
      kind: "BOOKING_CONFIRMED",
      who: b.customerName,
      what: `booked ${b.listingTitle} at ${b.partnerName} · ${money(b.amount, b.currency)}`,
      when: b.confirmedAt ?? 0,
      portal: "Partner" as const,
    })),
    ...invoices.map((i) => ({
      id: `invoice-${i.id}`,
      kind: "INVOICE_ISSUED",
      who: i.organizationName,
      what: `invoice ${money(i.amount, i.currency)} · ${i.status}`,
      when: i.createdAt,
      portal: "Corporate" as const,
    })),
  ]
    .filter((e) => e.when > 0)
    .sort((a, b) => b.when - a.when)
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Finance & Config</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Analytics & audit.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            Platform-wide totals across Consumer, Employer, Partner, Corporate. Every write-bearing action is traceable.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Audit export to CSV ships with W5."
          className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Export CSV
          <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W5</span>
        </button>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={money(successFeeTotal, primaryCur)}      l="Hire success fees"    sub={`${hires.length} hires · 8%`}       tone="gilt" />
        <Kpi n={money(marketplaceFeeTotal, primaryCur)} l="Marketplace fees"    sub={`${payouts.length} payouts · 5%`}  />
        <Kpi n={money(corporateTotal, primaryCur)}      l="Corporate invoiced"  sub={`${invoices.length} invoices`}     tone="lagoon" />
        <Kpi n={`${events.length}`}                      l="Audit events"        sub="last 20 shown"                     />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Platform totals" />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricBlock Icon={Briefcase} title="Hiring" rows={[
            { label: "Companies",        v: `${companies.length}` },
            { label: "Verified",         v: `${companies.filter((c) => c.verified).length}` },
            { label: "Active jobs",      v: `${jobs.active}` },
            { label: "Total jobs ever",  v: `${jobs.total}` },
            { label: "Applications",     v: `${pipeline.totalApplications}` },
            { label: "Hires",            v: `${hires.length}` },
          ]} />
          <MetricBlock Icon={Plane} title="Consumer" rows={[
            { label: "Accounts",         v: `${users}` },
            { label: "Active relocations", v: `${activeRelocations}` },
            { label: "Total relocations", v: `${relocations.length}` },
            { label: "Avg milestones",    v: relocations.length > 0 ? `${Math.round(relocations.reduce((a, r) => a + r.totalCount, 0) / relocations.length)}` : "—" },
          ]} />
          <MetricBlock Icon={Wallet} title="Marketplace" rows={[
            { label: "Partners",         v: `${partners.length}` },
            { label: "Approved",         v: `${partners.filter((p) => p.verificationStatus === "APPROVED").length}` },
            { label: "Bookings",         v: `${bookings.length}` },
            { label: "Payouts released", v: `${payouts.filter((p) => p.status === "RELEASED").length}` },
            { label: "Orgs on contract", v: `${orgs.length}` },
          ]} />
        </div>
      </section>

      <section>
        <SectionHead num="02" label="Audit feed" />
        {events.length === 0 ? (
          <EmptyState title="No events yet." body="Write-bearing actions across portals will stream here." />
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            {events.map((e, i) => (
              <div key={e.id} className={`flex flex-wrap items-center gap-4 px-5 py-3.5 md:px-6 md:py-4 ${i < events.length - 1 ? "border-b border-ink-100" : ""}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${portalCls(e.portal)}`}>
                  <EventIcon kind={e.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${portalBadge(e.portal)}`}>
                      {e.portal}
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{e.kind}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-800">
                    <strong className="font-semibold text-ink-900">{e.who}</strong>{" "}
                    <span className="text-ink-600">{e.what}</span>
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                  {formatDateTime(e.when)}
                </span>
              </div>
            ))}
          </div>
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

function Kpi({ n, l, sub, tone }: { n: string; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

type IconCmp = LucideIcon;

function MetricBlock({ Icon, title, rows }: { Icon: IconCmp; title: string; rows: { label: string; v: string }[] }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-parchment">
          <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
        </span>
        <h3 className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between border-b border-ink-100 pb-2 last:border-0 last:pb-0">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{r.label}</span>
            <span className="font-sans text-[15px] font-semibold text-ink-900">{r.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function portalCls(p: AuditEvent["portal"]): string {
  switch (p) {
    case "Consumer":  return "bg-lagoon-100 text-lagoon-700";
    case "Employer":  return "bg-ink-100 text-ink-800";
    case "Partner":   return "bg-gilt-100 text-gilt-800";
    case "Corporate": return "bg-warning-100 text-warning-800";
    case "Admin":     return "bg-ink-900 text-parchment";
  }
}

function portalBadge(p: AuditEvent["portal"]): string {
  switch (p) {
    case "Consumer":  return "border-lagoon-200 bg-lagoon-50 text-lagoon-800";
    case "Employer":  return "border-ink-200 bg-ink-50 text-ink-700";
    case "Partner":   return "border-gilt-200 bg-gilt-50 text-gilt-800";
    case "Corporate": return "border-warning-200 bg-warning-50 text-warning-800";
    case "Admin":     return "border-ink-900 bg-ink-900 text-parchment";
  }
}

function EventIcon({ kind }: { kind: string }) {
  const cls = "h-3.5 w-3.5";
  const sw = 2;
  if (kind === "HIRE_CLOSED")         return <Briefcase    className={cls} strokeWidth={sw} />;
  if (kind === "RELOCATION_STARTED")  return <Plane        className={cls} strokeWidth={sw} />;
  if (kind === "PARTNER_APPROVED")    return <ShieldCheck  className={cls} strokeWidth={sw} />;
  if (kind === "BOOKING_CONFIRMED")   return <CheckCircle2 className={cls} strokeWidth={sw} />;
  if (kind === "INVOICE_ISSUED")      return <FileDown     className={cls} strokeWidth={sw} />;
  return <TrendingUp className={cls} strokeWidth={sw} />;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <LineChart className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
