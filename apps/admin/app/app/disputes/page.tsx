import type { Metadata } from "next";
import { Scale, FileText, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listPartnerBookings } from "@/lib/xdb";

export const metadata: Metadata = { title: "Disputes" };

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

export default function DisputesPage() {
  // Disputes table doesn't exist yet. Use CANCELLED/DECLINED bookings
  // with HELD escrow as candidates for the dispute queue.
  const bookings = listPartnerBookings();
  const candidates = bookings.filter(
    (b) => (b.status === "CANCELLED" || b.status === "DECLINED") && b.escrowState === "HELD"
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Verification & Trust</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Dispute resolution.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            Escrow freezes when a customer raises a dispute. Ops gathers evidence from both sides and decides: refund user, release to partner, or split.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gilt-200 bg-gilt-50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
          Full workflow · W4
        </span>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={candidates.length} l="Candidate disputes" sub="cancelled + escrow held" tone="warn" />
        <Kpi n={0} l="In mediation"   sub="awaiting evidence"          />
        <Kpi n={0} l="Resolved today" sub="refund / release / split"   tone="lagoon" />
        <Kpi n={0} l="Avg resolution" sub="business days"              />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Dispute queue" />
        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Scale className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">No disputes.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">
              Every cancelled booking cleared escrow cleanly. When a consumer raises a dispute, it lands here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            {candidates.map((b, i) => (
              <div key={b.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 md:px-6 ${i < candidates.length - 1 ? "border-b border-ink-100" : ""}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-700">
                  <AlertCircle className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[14px] font-semibold text-ink-900">
                    {b.customerName} · {b.listingTitle}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                    {b.partnerName} · {b.status} · escrow {b.escrowState} · {ago(b.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[14px] font-semibold text-ink-900">{money(b.amount, b.currency)}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Held</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead num="02" label="Resolution outcomes" />
        <div className="grid gap-4 md:grid-cols-3">
          <Outcome
            Icon={TrendingDown}
            title="Refund user"
            body="Release held amount back to the customer. Logs a trust-score penalty on the partner."
            tone="danger"
          />
          <Outcome
            Icon={TrendingUp}
            title="Release partner"
            body="Release held amount to the partner. Trust score unchanged. Customer gets written response."
            tone="lagoon"
          />
          <Outcome
            Icon={Scale}
            title="Split"
            body="Proportional allocation to each side. Penalty weight scales with partner share of fault."
          />
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

function Kpi({ n, l, sub, tone }: { n: number | string; l: string; sub: string; tone?: "warn" | "lagoon" }) {
  const toneCls = tone === "warn"
    ? "border-warning-200 bg-warning-50 text-warning-800"
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

function Outcome({ Icon, title, body, tone }: { Icon: LucideIcon; title: string; body: string; tone?: "danger" | "lagoon" }) {
  const iconCls = tone === "danger"
    ? "bg-danger-500 text-white"
    : tone === "lagoon"
    ? "bg-lagoon-500 text-white"
    : "bg-ink-900 text-parchment";
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-6">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconCls}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-sans text-[15.5px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mt-2 text-[13px] text-ink-600 leading-[1.55]">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
        Decision UI · W4
      </span>
    </article>
  );
}
