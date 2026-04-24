import type { Metadata } from "next";
import { Banknote, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { listPartnerPayouts, listPartners } from "@/lib/xdb";

export const metadata: Metadata = { title: "Partner payouts" };

function money(n: number, cur: string) {
  const s = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function formatDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PayoutsPage() {
  const payouts = listPartnerPayouts();
  const partners = listPartners();

  const byStatus = payouts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const sumBy = (status: string) => payouts
    .filter((p) => p.status === status)
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
      return acc;
    }, {});

  const released = sumBy("RELEASED");
  const pending = sumBy("PENDING");
  const primaryCur = Object.keys(released)[0] ?? Object.keys(pending)[0] ?? "EUR";
  const totalFees = payouts.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.platformFee;
    return acc;
  }, {});

  // Aggregate per partner
  const perPartner = new Map<string, { partnerName: string; total: number; currency: string; count: number }>();
  for (const p of payouts) {
    const existing = perPartner.get(p.partnerId);
    if (existing) {
      existing.total += p.amount;
      existing.count += 1;
    } else {
      perPartner.set(p.partnerId, { partnerName: p.partnerName, total: p.amount, currency: p.currency, count: 1 });
    }
  }
  const topPartners = [...perPartner.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Finance & Config</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Partner payouts.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          Marketplace fee is 5% on paid bookings. Payouts release in a weekly batch once fulfilment is confirmed. Every hold, release, and failure logs here.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={money(released[primaryCur] ?? 0, primaryCur)} l="Released YTD" sub={`${byStatus.RELEASED ?? 0} payouts`} tone="lagoon" />
        <Kpi n={money(pending[primaryCur] ?? 0, primaryCur)}  l="Pending" sub={`${byStatus.PENDING ?? 0} awaiting batch`} tone="gilt" />
        <Kpi n={money(totalFees[primaryCur] ?? 0, primaryCur)} l="Platform fees" sub="5% marketplace fee" />
        <Kpi n={`${byStatus.FAILED ?? 0}`} l="Failed" sub="needs intervention" tone="warn" />
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHead num="01" label="Payout ledger" />
          {payouts.length === 0 ? (
            <EmptyState title="No payouts yet." body="Payouts appear here when a partner marks a booking fulfilled and escrow releases." />
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
              <div className="hidden grid-cols-[1.3fr_0.8fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-ink-100 bg-parchment/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
                <span>Partner</span>
                <span>Amount</span>
                <span>Fee</span>
                <span>Status</span>
                <span className="text-right">Released</span>
              </div>
              {payouts.map((p, i) => (
                <div
                  key={p.id}
                  className={`grid gap-2 px-5 py-3.5 md:grid-cols-[1.3fr_0.8fr_0.6fr_0.6fr_0.6fr] md:items-center md:py-4 ${i < payouts.length - 1 ? "border-b border-ink-100" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{p.partnerName}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      Booking {p.bookingId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Cell label="Amount" v={money(p.amount, p.currency)} />
                  <Cell label="Fee" v={money(p.platformFee, p.currency)} />
                  <Cell label="Status">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${payoutCls(p.status)}`}>
                      <PayoutIcon status={p.status} /> {p.status}
                    </span>
                  </Cell>
                  <div className="flex items-center justify-between md:justify-end">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">Released</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">{formatDate(p.releasedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHead num="02" label="Top partners" />
          {topPartners.length === 0 ? (
            <EmptyState title="No activity yet." body="Top-earning partners will show here." />
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <ul className="space-y-4">
                {topPartners.map((t, i) => (
                  <li key={t.partnerName} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-[11px] font-semibold text-parchment">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{t.partnerName}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                        {t.count} payout{t.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="font-sans text-[13.5px] font-semibold text-ink-900">{money(t.total, t.currency)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-parchment/60 border border-ink-100 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Live partners: {partners.filter((p) => p.verificationStatus === "APPROVED").length}
                </p>
              </div>
            </div>
          )}
        </div>
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

function payoutCls(status: string): string {
  switch (status) {
    case "RELEASED": return "border-lagoon-200 bg-lagoon-50 text-lagoon-800";
    case "PENDING":  return "border-gilt-200 bg-gilt-50 text-gilt-800";
    case "HELD":     return "border-ink-200 bg-ink-50 text-ink-700";
    case "FAILED":   return "border-danger-200 bg-danger-50 text-danger-700";
    default: return "border-ink-200 bg-ink-50 text-ink-700";
  }
}

function PayoutIcon({ status }: { status: string }) {
  if (status === "RELEASED") return <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} />;
  if (status === "PENDING") return <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />;
  if (status === "FAILED") return <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />;
  return null;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <Banknote className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
