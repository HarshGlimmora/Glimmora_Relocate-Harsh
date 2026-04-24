import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin, Wallet, User, Globe2, BadgeCheck,
  ShieldCheck, MessageSquare, CalendarClock,
} from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";
import { StageActions } from "./stage-actions";
import { MessageThread } from "./message-thread";

export const metadata: Metadata = { title: "Booking" };

const stageMeta: Record<string, { label: string; cls: string; dark: string }> = {
  REQUESTED:   { label: "Requested",   cls: "bg-gilt-500/20 border-gilt-400/30 text-gilt-300",         dark: "text-gilt-300"   },
  CONFIRMED:   { label: "Confirmed",   cls: "bg-plum-500/20 border-plum-400/30 text-plum-300",         dark: "text-plum-300"   },
  IN_PROGRESS: { label: "In progress", cls: "bg-plum-500/30 border-plum-400/40 text-plum-200",         dark: "text-plum-200"   },
  FULFILLED:   { label: "Fulfilled",   cls: "bg-success-500/20 border-success-400/30 text-success-300",dark: "text-success-300"},
  DECLINED:    { label: "Declined",    cls: "bg-white/10 border-white/15 text-white/60",               dark: "text-white/60"   },
  CANCELLED:   { label: "Cancelled",   cls: "bg-danger-500/20 border-danger-400/30 text-danger-200",   dark: "text-danger-200" },
};

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const { partner } = await requirePartnerSession();

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      messages: { orderBy: { createdAt: "asc" } },
      payout: true,
    },
  });
  if (!booking || booking.partnerId !== partner.id) notFound();

  const stage = stageMeta[booking.status] ?? stageMeta.REQUESTED;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10 md:py-10">
      <Link href="/app/bookings" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to bookings
      </Link>

      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-plum-500/25 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold", stage.cls)}>
                <BadgeCheck className="h-3 w-3" /> {stage.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                {booking.listing.kind.toLowerCase().replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              {booking.customerName}
            </h1>
            <p className="mt-3 text-[14px] text-white/70">
              wants <span className="text-parchment font-semibold">{booking.listing.title}</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {booking.customerEmail}</span>
              {booking.customerCountry ? (<><span className="h-3 w-px bg-white/20" /><span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> from {booking.customerCountry}</span></>) : null}
              {booking.customerPassport ? (<><span className="h-3 w-px bg-white/20" /><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {booking.customerPassport} passport</span></>) : null}
            </div>
            {booking.note ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] italic leading-[1.55] text-white/80">
                "{booking.note}"
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Financials</p>
            <p className="mt-3 font-sans text-[40px] font-semibold leading-none tracking-[-0.025em] text-parchment">
              {money(booking.amount, booking.currency)}
            </p>
            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
              <Row label="Escrow" value={booking.escrowState} />
              {booking.payout ? (
                <Row label="Partner take" value={money(booking.payout.amount, booking.payout.currency)} />
              ) : null}
              {booking.payout ? (
                <Row label="Platform fee" value={money(booking.payout.platformFee, booking.payout.currency)} />
              ) : null}
              {booking.startDate ? (
                <Row label="Move-in" value={booking.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Stage actions strip */}
      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Stage actions</p>
            <p className="mt-1 font-sans text-[14px] text-ink-800">
              {booking.status === "REQUESTED" ? "Confirm this booking to hold the slot, or decline to refund the customer." :
               booking.status === "CONFIRMED" ? "Next, mark in progress when service starts, or fulfilled when done." :
               booking.status === "IN_PROGRESS" ? "Mark fulfilled when the customer's service is complete. Escrow releases on fulfilment." :
               booking.status === "FULFILLED" ? "Booking completed. Payout released to your queue." :
               "Booking is closed."}
            </p>
          </div>
          <StageActions bookingId={booking.id} status={booking.status} customerName={booking.customerName} />
        </div>
      </section>

      {/* Body grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Messages */}
        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
              <MessageSquare className="h-[16px] w-[16px]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Conversation</p>
              <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Messages</h2>
            </div>
          </div>
          <MessageThread bookingId={booking.id} messages={booking.messages} partnerName={partner.name} />
        </section>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Listing</p>
            <p className="mt-2 font-sans text-[14px] font-semibold text-ink-900">{booking.listing.title}</p>
            <dl className="mt-3 space-y-2 text-[12.5px] text-ink-600">
              <Detail label="Location" value={`${booking.listing.city}, ${booking.listing.country}`} Icon={MapPin} />
              <Detail label="Capacity" value={`${booking.listing.capacity - booking.listing.capacityTaken}/${booking.listing.capacity}`} Icon={User} />
            </dl>
            <Link
              href={`/app/listings/${booking.listingId}/edit`}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-800 hover:border-ink-900"
            >
              Open listing
            </Link>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Timeline</p>
            <ul className="mt-3 space-y-2.5 text-[12.5px] text-ink-600">
              <TimelineRow label="Requested" when={booking.createdAt} />
              {booking.confirmedAt ? <TimelineRow label="Confirmed" when={booking.confirmedAt} /> : null}
              {booking.fulfilledAt ? <TimelineRow label="Fulfilled" when={booking.fulfilledAt} /> : null}
              {booking.cancelledAt ? <TimelineRow label="Cancelled" when={booking.cancelledAt} /> : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
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

function Detail({ label, value, Icon }: { label: string; value: string; Icon: typeof MapPin }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="font-sans text-[12.5px] font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function TimelineRow({ label, when }: { label: string; when: Date }) {
  return (
    <li className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
        <CalendarClock className="h-3 w-3" /> {label}
      </span>
      <span className="font-mono text-[10.5px] text-ink-700">{relativeTime(when)}</span>
    </li>
  );
}
