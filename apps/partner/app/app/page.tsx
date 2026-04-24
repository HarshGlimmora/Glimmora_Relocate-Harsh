import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Home, CalendarClock, MessageSquare, Star, Wallet,
  TrendingUp, ShieldCheck, AlertCircle, Plus, Sparkles,
} from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PartnerDashboard() {
  const { partner } = await requirePartnerSession();

  const [listings, bookings, payouts, reviews, unreadMessages] = await Promise.all([
    prisma.listing.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { partnerId: partner.id },
      orderBy: { updatedAt: "desc" },
      include: { listing: { select: { title: true, kind: true } } },
      take: 20,
    }),
    prisma.payout.findMany({
      where: { partnerId: partner.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.review.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.message.count({
      where: { booking: { partnerId: partner.id }, sender: "CUSTOMER" },
    }),
  ]);

  const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
  const draftListings = listings.filter((l) => l.status === "DRAFT").length;
  const pendingBookings = bookings.filter((b) => b.status === "REQUESTED").length;
  const inProgress = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS").length;
  const fulfilled = bookings.filter((b) => b.status === "FULFILLED").length;

  const payoutsHeldByCurrency: Record<string, number> = {};
  const payoutsReleasedByCurrency: Record<string, number> = {};
  for (const p of payouts) {
    if (p.status === "HELD") payoutsHeldByCurrency[p.currency] = (payoutsHeldByCurrency[p.currency] ?? 0) + p.amount;
    if (p.status === "RELEASED") payoutsReleasedByCurrency[p.currency] = (payoutsReleasedByCurrency[p.currency] ?? 0) + p.amount;
  }
  const heldPrimary = Object.entries(payoutsHeldByCurrency)[0];
  const releasedPrimary = Object.entries(payoutsReleasedByCurrency)[0];

  const recentRequests = bookings.filter((b) => b.status === "REQUESTED").slice(0, 3);
  const verified = partner.verificationStatus === "APPROVED";

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Dashboard</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Good work, {partner.name}.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Your listings are the first thing relocating professionals see when they plan their move. Keep inventory fresh and respond quickly to booking requests.
        </p>
      </header>

      {!verified ? (
        <section className="mb-8 rounded-2xl border border-gilt-200 bg-gilt-50 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gilt-500 text-ink-900">
              <AlertCircle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[15px] font-semibold text-ink-900">Finish verification to go live.</p>
              <p className="mt-0.5 text-[13px] text-ink-700">Listings stay in preview mode until KYB is approved. Typical turnaround is 2–3 business days.</p>
            </div>
            <Link href="/app/verification" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-5 text-[13px] font-medium text-parchment hover:bg-ink-800">
              Continue verification <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* KPI row */}
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <KPICard
          Icon={Home}
          label="Active listings"
          value={activeListings}
          sub={draftListings > 0 ? `${draftListings} draft${draftListings === 1 ? "" : "s"}` : "all live"}
        />
        <KPICard
          Icon={CalendarClock}
          label="New requests"
          value={pendingBookings}
          sub={pendingBookings > 0 ? "awaiting your reply" : "all responded"}
          tone={pendingBookings > 0 ? "gilt" : undefined}
        />
        <KPICard
          Icon={TrendingUp}
          label="In progress"
          value={inProgress}
          sub={`${fulfilled} fulfilled all-time`}
          tone={inProgress > 0 ? "plum" : undefined}
        />
        <KPICard
          Icon={Wallet}
          label="Held in escrow"
          value={heldPrimary ? money(heldPrimary[1], heldPrimary[0]) : "—"}
          sub={releasedPrimary ? `${money(releasedPrimary[1], releasedPrimary[0])} released` : "no payouts yet"}
          tone="lagoon"
        />
      </section>

      {/* Hero + pipeline */}
      <section className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-plum-500/25 blur-[70px]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-plum-500/20 border border-plum-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-plum-300 font-semibold">
                <ShieldCheck className="h-3 w-3" /> Quality score
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                across {partner.reviewCount} reviews
              </span>
            </div>
            <p className="mt-6 flex items-baseline gap-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">
              {partner.rating.toFixed(1)}<span className="text-[18px] font-normal text-white/50"> / 5.0</span>
            </p>
            <p className="mt-3 text-[13.5px] text-white/65 max-w-md">
              {partner.rating >= 4.8 ? "Elite tier. You rank in the top 10% of partners on the platform." :
               partner.rating >= 4.5 ? "Strong performance. Keep response times under 6h to stay here." :
               "Focus on response time and review collection to move up a tier."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/app/listings/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white"
              >
                <Plus className="h-4 w-4" /> Add listing
              </Link>
              <Link
                href="/app/bookings"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-[13.5px] font-medium text-parchment hover:bg-white/10"
              >
                Open bookings <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-[28px] border border-ink-200 bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
              <MessageSquare className="h-[16px] w-[16px]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Inbox</p>
              <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                {unreadMessages} message{unreadMessages === 1 ? "" : "s"} from customers
              </h2>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {bookings.slice(0, 4).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/app/bookings/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-parchment/40 px-4 py-2.5 hover:border-ink-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[13px] font-semibold text-ink-900">{b.customerName}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-500">{b.listing.title}</p>
                  </div>
                  <StatusDot status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pending requests */}
      {recentRequests.length > 0 ? (
        <section className="mb-10">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Needs action</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Booking requests</span>
          </div>
          <ul className="space-y-3">
            {recentRequests.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-gilt-200 bg-gilt-50/40 p-5 md:p-6"
              >
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-sans text-[15px] font-semibold text-ink-900">{b.customerName}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">{b.listing.title}</p>
                    {b.note ? (
                      <p className="mt-2 text-[12.5px] italic text-ink-700 border-l-2 border-gilt-300 pl-3">
                        "{b.note}"
                      </p>
                    ) : null}
                  </div>
                  <div className="text-[12.5px] text-ink-600">
                    <p>Requested {relativeTime(b.createdAt)}</p>
                    {b.startDate ? (
                      <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
                        Move-in {b.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/app/bookings/${b.id}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[13px] font-medium text-parchment hover:bg-ink-800"
                  >
                    Review <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <section>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">Latest reviews</span>
            <span className="h-px flex-1 bg-ink-200" />
            <Link href="/app/reviews" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium">
              See all →
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star
                      key={n}
                      className={cn("h-3.5 w-3.5", n <= r.rating ? "fill-gilt-500 text-gilt-500" : "text-ink-200")}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                {r.body ? (
                  <p className="mt-3 text-[13px] leading-[1.5] text-ink-700">"{r.body}"</p>
                ) : null}
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  — {r.authorName} · {relativeTime(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function KPICard({
  Icon, label, value, sub, tone,
}: { Icon: typeof Home; label: string; value: number | string; sub: string; tone?: "plum" | "gilt" | "lagoon" }) {
  const bg =
    tone === "plum"   ? "bg-plum-50 border-plum-100" :
    tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
    tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
    "bg-white border-ink-200";
  const iconBg =
    tone === "plum"   ? "bg-plum-500 text-white" :
    tone === "gilt"   ? "bg-gilt-500 text-ink-900" :
    tone === "lagoon" ? "bg-lagoon-500 text-white" :
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

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    REQUESTED:   "bg-gilt-500",
    CONFIRMED:   "bg-plum-500",
    IN_PROGRESS: "bg-plum-600",
    FULFILLED:   "bg-success-500",
    DECLINED:    "bg-ink-300",
    CANCELLED:   "bg-danger-400",
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", map[status] ?? "bg-ink-300")} />
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}
