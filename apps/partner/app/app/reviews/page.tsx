import type { Metadata } from "next";
import { Star, TrendingUp, Clock, Target } from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "SLAs & Reviews" };

export default async function ReviewsPage() {
  const { partner } = await requirePartnerSession();

  const [reviews, bookings] = await Promise.all([
    prisma.review.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      include: { booking: { include: { listing: { select: { title: true } } } } },
    }),
    prisma.booking.findMany({
      where: { partnerId: partner.id },
    }),
  ]);

  // SLA derivations
  const confirmedCount = bookings.filter((b) => b.confirmedAt).length;
  const totalRequested = bookings.length;
  const confirmRate = totalRequested > 0 ? Math.round((confirmedCount / totalRequested) * 100) : 0;

  // Average confirmation time (hours) for bookings that have it
  const confirmTimes = bookings
    .filter((b) => b.confirmedAt)
    .map((b) => (b.confirmedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60));
  const avgConfirmHours = confirmTimes.length > 0
    ? Math.round(confirmTimes.reduce((s, t) => s + t, 0) / confirmTimes.length)
    : 0;

  const fulfilledCount = bookings.filter((b) => b.status === "FULFILLED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED" || b.status === "DECLINED").length;
  const fulfilmentRate = totalRequested > 0
    ? Math.round((fulfilledCount / (totalRequested - bookings.filter((b) => b.status === "REQUESTED" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS").length)) * 100 || 0)
    : 0;

  // Rating breakdown
  const breakdown = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">SLAs · Reviews</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Your quality signal.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Glimmora ranks listings by your quality tier. Response time, fulfilment rate, and reviews move you up or down.
        </p>
      </header>

      {/* SLA KPIs */}
      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <KPI
          Icon={Star}
          label="Average rating"
          value={partner.rating.toFixed(1)}
          sub={`${partner.reviewCount} reviews total`}
          tone="gilt"
        />
        <KPI
          Icon={Clock}
          label="Avg. response"
          value={avgConfirmHours > 0 ? `${avgConfirmHours}h` : "—"}
          sub="target: under 6h"
          tone={avgConfirmHours > 0 && avgConfirmHours < 6 ? "lagoon" : undefined}
        />
        <KPI
          Icon={Target}
          label="Fulfilment rate"
          value={`${(partner.fulfilmentRateBps / 100).toFixed(1)}%`}
          sub={`${fulfilledCount} fulfilled · ${cancelledCount} cancelled`}
          tone="plum"
        />
        <KPI
          Icon={TrendingUp}
          label="Confirm rate"
          value={`${confirmRate}%`}
          sub="of all requests"
        />
      </section>

      {/* Rating breakdown */}
      <section className="mb-10 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
            <Star className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Rating breakdown</p>
            <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">What customers are saying</h2>
          </div>
        </div>
        {reviews.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-6 text-center text-[13px] text-ink-500">
            No reviews yet. Customers rate after a fulfilled booking.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {breakdown.map(({ r, count }) => {
              const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <li key={r} className="flex items-center gap-3">
                  <div className="flex w-12 items-center gap-1 font-sans text-[13px] font-semibold text-ink-900">
                    {r} <Star className="h-3 w-3 fill-gilt-500 text-gilt-500" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-gilt-500" style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <div className="w-14 text-right font-mono text-[11px] text-ink-500">
                    {count} · {pct}%
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Review list */}
      <section>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Recent reviews</span>
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <p className="text-[13px] text-ink-500">
              No reviews yet. Once a booking is fulfilled, customers can leave a rating.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((rev) => (
              <li key={rev.id} className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star
                          key={n}
                          className={cn("h-4 w-4", n <= rev.rating ? "fill-gilt-500 text-gilt-500" : "text-ink-200")}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    {rev.body ? (
                      <p className="mt-3 text-[14px] leading-[1.6] text-ink-800">"{rev.body}"</p>
                    ) : null}
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      — {rev.authorName} · {rev.booking.listing.title} · {relativeTime(rev.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({ Icon, label, value, sub, tone }: { Icon: typeof Star; label: string; value: string; sub: string; tone?: "lagoon" | "gilt" | "plum" }) {
  const bg =
    tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
    tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
    tone === "plum"   ? "bg-plum-50 border-plum-100" :
    "bg-white border-ink-200";
  const iconBg =
    tone === "lagoon" ? "bg-lagoon-500 text-white" :
    tone === "gilt"   ? "bg-gilt-500 text-ink-900" :
    tone === "plum"   ? "bg-plum-500 text-white" :
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
