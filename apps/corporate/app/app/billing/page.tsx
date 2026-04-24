import type { Metadata } from "next";
import {
  Receipt, CheckCircle2, Clock, AlertTriangle, FileText, Download,
} from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, formatDate, relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const { organization } = await requireCorporateSession();
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: organization.id },
    orderBy: { issuedAt: "desc" },
  });

  const paid = invoices.filter((i) => i.status === "PAID");
  const open = invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE");
  const ytdPaid = paid.reduce((s, i) => s + i.total, 0);
  const openTotal = open.reduce((s, i) => s + i.total, 0);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Billing & Contracts</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Your agreement, your invoices.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Master service agreement, success-fee model, quarterly invoicing against closed hires.
        </p>
      </header>

      {/* Contract hero */}
      <section className="mb-8 relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-moss-500/25 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-500/20 border border-moss-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-moss-300 font-semibold">
                <FileText className="h-3 w-3" /> Master agreement
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-500/20 border border-success-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success-300">
                Active
              </span>
            </div>
            <h2 className="mt-5 font-sans text-[26px] font-semibold tracking-tight leading-[1.15]">
              {organization.contractTier === "ENTERPRISE" ? "Enterprise" : organization.contractTier.toLowerCase()} contract
            </h2>
            <p className="mt-2 text-[14px] text-white/70 max-w-lg">
              Success-fee + marketplace model. 8% of first-year salary per closed hire, plus 5% marketplace spread on partner bookings.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/60">
              Next renewal · 31 December 2026
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Paid YTD</p>
            <p className="mt-2 font-sans text-[40px] font-semibold leading-none tracking-[-0.025em] text-parchment">{money(ytdPaid, "EUR")}</p>
            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
              <Row label="Open invoices" value={`${open.length} · ${money(openTotal, "EUR")}`} />
              <Row label="Paid to date" value={`${paid.length} invoices`} />
              <Row label="Account" value={organization.billingEmail ?? "—"} />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <KPI Icon={CheckCircle2} label="Paid" value={String(paid.length)} sub={money(ytdPaid, "EUR")} tone="success" />
        <KPI Icon={Clock}         label="Open"  value={String(open.length)}  sub={money(openTotal, "EUR")} tone={open.length > 0 ? "gilt" : undefined} />
        <KPI Icon={AlertTriangle} label="Overdue" value={String(invoices.filter((i) => i.status === "OVERDUE").length)} sub="past due date" tone={invoices.some((i) => i.status === "OVERDUE") ? "danger" : undefined} />
      </section>

      {/* Invoices */}
      <section>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Invoices</span>
        </div>
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Receipt className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No invoices yet.</h3>
          </div>
        ) : (
          <ul className="space-y-3">
            {invoices.map((i) => <InvoiceRow key={i.id} invoice={i} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function InvoiceRow({ invoice: i }: { invoice: Awaited<ReturnType<typeof prisma.invoice.findMany>>[number] }) {
  const statusCls =
    i.status === "PAID"     ? "bg-success-50 border-success-200 text-success-700" :
    i.status === "OVERDUE"  ? "bg-danger-50 border-danger-200 text-danger-700" :
    i.status === "DISPUTED" ? "bg-gilt-50 border-gilt-200 text-gilt-800" :
    i.status === "VOID"     ? "bg-ink-50 border-ink-200 text-ink-500" :
    "bg-moss-50 border-moss-200 text-moss-800";

  const items: Array<{ desc: string; amount: number }> = JSON.parse(i.lineItems || "[]");

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-sans text-[15px] font-semibold text-ink-900">{i.number}</p>
            <span className={cn("inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", statusCls)}>
              {i.status.toLowerCase()}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-500">{i.period}</p>
          {items.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-[12px] text-ink-600">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{it.desc}</span>
                  <span className="font-mono text-ink-500">{money(it.amount, i.currency)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="text-[12.5px] text-ink-600">
          <p>Issued {formatDate(i.issuedAt)}</p>
          <p className="mt-0.5">Due {formatDate(i.dueAt)} · <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">{relativeTime(i.dueAt)}</span></p>
          {i.paidAt ? <p className="mt-0.5 text-success-700">Paid {relativeTime(i.paidAt)}</p> : null}
        </div>

        <div className="flex items-center gap-3 md:justify-end">
          <p className="font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
            {money(i.total, i.currency)}
          </p>
          <button
            disabled
            title="PDF download arrives with W4."
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 text-[12px] font-medium text-ink-500 cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" /> PDF
            <span className="ml-1 rounded-full bg-ink-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-600">W4</span>
          </button>
        </div>
      </div>
    </li>
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

function KPI({ Icon, label, value, sub, tone }: { Icon: typeof Receipt; label: string; value: string; sub: string; tone?: "success" | "gilt" | "danger" }) {
  const bg =
    tone === "success" ? "bg-success-50 border-success-200" :
    tone === "gilt"    ? "bg-gilt-50 border-gilt-200" :
    tone === "danger"  ? "bg-danger-50 border-danger-200" :
    "bg-white border-ink-200";
  const iconBg =
    tone === "success" ? "bg-success-500 text-white" :
    tone === "gilt"    ? "bg-gilt-500 text-ink-900" :
    tone === "danger"  ? "bg-danger-500 text-white" :
    "bg-ink-900 text-parchment";
  return (
    <div className={cn("rounded-2xl border p-5", bg)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
          <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{value}</p>
          <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}
