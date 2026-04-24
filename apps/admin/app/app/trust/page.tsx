import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Star, TrendingDown, Timer, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { listPartners, listPartnerReviews, listPartnerBookings } from "@/lib/xdb";

export const metadata: Metadata = { title: "Trust & fraud" };

function ago(ms: number | null) {
  if (!ms) return "—";
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1d";
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

export default function TrustPage() {
  const partners = listPartners();
  const reviews = listPartnerReviews(30);
  const bookings = listPartnerBookings();

  const approvedPartners = partners.filter((p) => p.verificationStatus === "APPROVED");
  const avgFulfilment = approvedPartners.length
    ? Math.round(approvedPartners.reduce((acc, p) => acc + p.fulfilmentRateBps, 0) / approvedPartners.length / 100)
    : 0;

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const lowRated = reviews.filter((r) => r.rating <= 2);
  const cancellations = bookings.filter((b) => b.status === "CANCELLED" || b.status === "DECLINED");

  const incidents = [
    ...lowRated.map((r) => ({
      kind: "LOW_REVIEW" as const,
      partner: r.partnerName,
      partnerId: r.partnerId,
      body: `${r.rating}★ from ${r.authorName}: "${r.body?.slice(0, 90) ?? "—"}${(r.body?.length ?? 0) > 90 ? "…" : ""}"`,
      when: r.createdAt,
      severity: r.rating <= 1 ? "high" : "medium" as "high" | "medium" | "low",
    })),
    ...cancellations.map((b) => ({
      kind: "CANCELLED" as const,
      partner: b.partnerName,
      partnerId: b.partnerId,
      body: `${b.status === "DECLINED" ? "Declined booking" : "Cancelled booking"}: ${b.listingTitle}`,
      when: b.createdAt,
      severity: "medium" as const,
    })),
  ]
    .sort((a, b) => b.when - a.when)
    .slice(0, 10);

  // Under-performing partners: fulfilment < 95% or rating < 4
  const atRisk = approvedPartners.filter(
    (p) => (p.fulfilmentRateBps > 0 && p.fulfilmentRateBps < 9500) || (p.reviewCount > 0 && p.rating < 4)
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Verification & Trust</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Trust & fraud.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          SLA dashboards, incidents, and auto-pause signals. Partners trip thresholds → listings pause and an incident opens here for investigation.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={`${avgFulfilment}%`} l="Avg fulfilment" sub="across approved partners" tone="lagoon" />
        <Kpi n={avgRating ? `${avgRating}★` : "—"} l="Avg rating"     sub={`${reviews.length} reviews`}          tone="gilt"   />
        <Kpi n={atRisk.length}       l="At-risk partners" sub="rating < 4 or SLA < 95%" tone="warn"   />
        <Kpi n={incidents.length}    l="Open incidents"   sub="awaiting investigation"                />
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-warning-500" />
            <h3 className="font-sans text-[17px] font-semibold tracking-tight text-ink-900">Incidents feed</h3>
          </div>
          {incidents.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
              Quiet on the trust front. No incidents to investigate.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-ink-100">
              {incidents.map((inc, i) => (
                <li key={i} className="flex items-start gap-3 py-3.5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sevCls(inc.severity)}`}>
                    {inc.kind === "LOW_REVIEW" ? <Star className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[13.5px] font-semibold text-ink-900">{inc.partner}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-600 leading-[1.5]">{inc.body}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{ago(inc.when)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-ink-700" />
            <h3 className="font-sans text-[17px] font-semibold tracking-tight text-ink-900">At-risk partners</h3>
          </div>
          {atRisk.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-4 text-center text-[13px] text-ink-500">
              All partners above threshold.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {atRisk.map((p) => (
                <li key={p.id} className="rounded-xl border border-warning-200/60 bg-warning-50/40 p-3">
                  <p className="font-sans text-[13.5px] font-semibold text-ink-900">{p.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-600">
                    {p.rating}★ · fulfilment {(p.fulfilmentRateBps / 100).toFixed(0)}% · {p.reviewCount} reviews
                  </p>
                  <Link href="/app/verification/partners" className="mt-2 inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-warning-700 hover:text-warning-900 font-semibold">
                    Inspect <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHead num="01" label="Partner SLA matrix" />
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <div className="hidden grid-cols-[1.3fr_0.6fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-ink-100 bg-parchment/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
            <span>Partner</span>
            <span>Rating</span>
            <span>Reviews</span>
            <span>Fulfilment</span>
            <span className="text-right">Status</span>
          </div>
          {approvedPartners.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-ink-500">No approved partners yet.</p>
          ) : (
            approvedPartners.map((p, i) => {
              const fulPct = (p.fulfilmentRateBps / 100).toFixed(0);
              const risk = (p.fulfilmentRateBps > 0 && p.fulfilmentRateBps < 9500) || (p.reviewCount > 0 && p.rating < 4);
              return (
                <div
                  key={p.id}
                  className={`grid gap-2 px-5 py-3.5 md:grid-cols-[1.3fr_0.6fr_0.6fr_0.6fr_0.6fr] md:items-center md:py-4 ${i < approvedPartners.length - 1 ? "border-b border-ink-100" : ""}`}
                >
                  <div>
                    <p className="font-sans text-[13.5px] font-semibold text-ink-900">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      {p.category} · {p.hqCity ?? "—"}, {p.hqCountry ?? "—"}
                    </p>
                  </div>
                  <Cell label="Rating" v={p.rating > 0 ? `${p.rating}★` : "—"} />
                  <Cell label="Reviews" v={`${p.reviewCount}`} />
                  <Cell label="Fulfilment" v={p.fulfilmentRateBps > 0 ? `${fulPct}%` : "—"} />
                  <div className="flex md:justify-end">
                    {risk ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-warning-700 font-medium">
                        At risk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-lagoon-200 bg-lagoon-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
                        <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> Healthy
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          <Shield className="h-3 w-3" /> Auto-pause triggers when a partner drops below 90% fulfilment or receives 2 {"<"}2★ reviews in 30 days.
        </p>
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
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function Cell({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex items-center justify-between md:block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">{label}</span>
      <span className="font-sans text-[13.5px] font-medium text-ink-900">{v}</span>
    </div>
  );
}

function sevCls(sev: "high" | "medium" | "low"): string {
  if (sev === "high") return "bg-danger-500 text-white";
  if (sev === "medium") return "bg-warning-500 text-white";
  return "bg-ink-400 text-white";
}
