import type { Metadata } from "next";
import { Wallet, ShieldCheck, ArrowUpRight, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { listPartnerBookings } from "@/lib/xdb";

export const metadata: Metadata = { title: "Escrow & refunds" };

function money(n: number, cur: string) {
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function ago(ms: number) {
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1d";
  return `${d}d`;
}

export default function EscrowPage() {
  const bookings = listPartnerBookings();

  const held     = bookings.filter((b) => b.escrowState === "HELD");
  const released = bookings.filter((b) => b.escrowState === "RELEASED");
  const refunded = bookings.filter((b) => b.escrowState === "REFUNDED");
  const pending  = bookings.filter((b) => b.escrowState === "PENDING");

  const sumBy = (rows: typeof bookings) => rows.reduce<Record<string, number>>((acc, b) => {
    acc[b.currency] = (acc[b.currency] ?? 0) + b.amount;
    return acc;
  }, {});
  const heldTotals = sumBy(held);
  const releasedTotals = sumBy(released);
  const primaryCur = Object.keys(heldTotals)[0] ?? Object.keys(releasedTotals)[0] ?? "EUR";

  const exceptions = bookings.filter(
    (b) => b.escrowState === "HELD" && (b.status === "CANCELLED" || b.status === "DECLINED")
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Finance & Config</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Escrow & refunds.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          Customer funds in escrow, exceptions, and reconciliation across the Partner marketplace. Fulfilment triggers automatic release; disputes freeze the hold.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={money(heldTotals[primaryCur] ?? 0, primaryCur)} l="Currently held" sub={`${held.length} bookings`} tone="gilt" />
        <Kpi n={money(releasedTotals[primaryCur] ?? 0, primaryCur)} l="Released" sub={`${released.length} settled`} tone="lagoon" />
        <Kpi n={`${refunded.length}`} l="Refunded" sub="customer-side returns" />
        <Kpi n={`${exceptions.length}`} l="Exceptions" sub="held + cancelled" tone="warn" />
      </section>

      {exceptions.length > 0 ? (
        <section className="mb-10">
          <SectionHead num="01" label="Exceptions — escrow held but booking cancelled" />
          <div className="rounded-2xl border border-warning-200 bg-warning-50/40 overflow-hidden">
            {exceptions.map((b, i) => (
              <div
                key={b.id}
                className={`flex flex-wrap items-center gap-4 px-5 py-4 md:px-6 ${i < exceptions.length - 1 ? "border-b border-warning-200/60" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-800">
                  <AlertCircle className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[14px] font-semibold text-ink-900">
                    {b.customerName} · {b.listingTitle}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                    {b.partnerName} · {b.status} · {ago(b.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[14px] font-semibold text-ink-900">{money(b.amount, b.currency)}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-warning-700 font-medium">HELD</p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Manual escrow release ships with W4."
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12px] font-medium text-ink-500 cursor-not-allowed"
                >
                  <RefreshCw className="h-3 w-3" /> Reconcile <span className="rounded-full bg-ink-100 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-600">W4</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHead num={exceptions.length > 0 ? "02" : "01"} label="Escrow ledger" />
        {bookings.length === 0 ? (
          <EmptyState title="No bookings yet." body="Partner marketplace bookings and their escrow state appear here." />
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-ink-100 bg-parchment/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
              <span>Booking</span>
              <span>Partner</span>
              <span>Amount</span>
              <span>Booking</span>
              <span>Escrow</span>
              <span className="text-right">Age</span>
            </div>
            {bookings.map((b, i) => (
              <div
                key={b.id}
                className={`grid gap-2 px-5 py-3.5 md:grid-cols-[1.4fr_1fr_0.8fr_0.6fr_0.6fr_0.6fr] md:items-center md:py-4 ${i < bookings.length - 1 ? "border-b border-ink-100" : ""}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{b.customerName}</p>
                  <p className="truncate text-[12px] text-ink-500">{b.listingTitle}</p>
                </div>
                <Cell label="Partner" v={b.partnerName} />
                <Cell label="Amount" v={money(b.amount, b.currency)} />
                <Cell label="Status">
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700 font-medium">
                    {b.status}
                  </span>
                </Cell>
                <Cell label="Escrow">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${escrowCls(b.escrowState)}`}>
                    {b.escrowState === "HELD" ? <Clock className="h-2.5 w-2.5" strokeWidth={2.5} /> : null}
                    {b.escrowState === "RELEASED" ? <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} /> : null}
                    {b.escrowState === "REFUNDED" ? <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} /> : null}
                    {b.escrowState}
                  </span>
                </Cell>
                <div className="flex items-center justify-between md:justify-end">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">Age</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">{ago(b.createdAt)}</span>
                </div>
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

function Kpi({ n, l, sub, tone }: { n: string | number; l: string; sub: string; tone?: "gilt" | "lagoon" | "warn" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : tone === "warn"
    ? "border-warning-200 bg-warning-50 text-warning-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function Cell({ label, v, children }: { label: string; v?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between md:block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">{label}</span>
      {children ?? <span className="font-sans text-[13px] font-medium text-ink-900">{v}</span>}
    </div>
  );
}

function escrowCls(state: string): string {
  switch (state) {
    case "HELD":     return "border-gilt-200 bg-gilt-50 text-gilt-800";
    case "RELEASED": return "border-lagoon-200 bg-lagoon-50 text-lagoon-800";
    case "REFUNDED": return "border-ink-200 bg-ink-50 text-ink-700";
    case "PENDING":  return "border-ink-200 bg-parchment text-ink-600";
    default: return "border-ink-200 bg-ink-50 text-ink-700";
  }
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <Wallet className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
