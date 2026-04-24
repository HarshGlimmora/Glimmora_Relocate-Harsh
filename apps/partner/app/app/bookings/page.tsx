import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock, ArrowRight, MapPin, AlertCircle, CheckCircle2, Clock,
  MessageSquare, Wallet,
} from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };

const stageMeta: Record<string, { label: string; cls: string }> = {
  REQUESTED:    { label: "Requested",    cls: "bg-gilt-50 border-gilt-200 text-gilt-800" },
  CONFIRMED:    { label: "Confirmed",    cls: "bg-plum-50 border-plum-200 text-plum-800" },
  IN_PROGRESS:  { label: "In progress",  cls: "bg-plum-100 border-plum-200 text-plum-900" },
  FULFILLED:    { label: "Fulfilled",    cls: "bg-success-50 border-success-200 text-success-700" },
  DECLINED:     { label: "Declined",     cls: "bg-ink-50 border-ink-200 text-ink-500" },
  CANCELLED:    { label: "Cancelled",    cls: "bg-danger-50 border-danger-200 text-danger-700" },
};

export default async function BookingsPage() {
  const { partner } = await requirePartnerSession();

  const bookings = await prisma.booking.findMany({
    where: { partnerId: partner.id },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      listing: { select: { title: true, kind: true, city: true, country: true } },
      _count: { select: { messages: true } },
    },
  });

  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const active = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS");
  const fulfilled = bookings.filter((b) => b.status === "FULFILLED");
  const closed = bookings.filter((b) => b.status === "DECLINED" || b.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Bookings</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Every booking. Every status.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Respond to new requests within 24 hours to keep your quality score. Escrow is held until fulfilment.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <StatCard n={requested.length} label="Requested" tone={requested.length > 0 ? "gilt" : undefined} sub="needs your reply" />
        <StatCard n={active.length} label="In progress" tone={active.length > 0 ? "plum" : undefined} sub="confirmed + active" />
        <StatCard n={fulfilled.length} label="Fulfilled" sub="lifetime" tone={fulfilled.length > 0 ? "lagoon" : undefined} />
        <StatCard n={closed.length} label="Closed" sub="declined or cancelled" />
      </section>

      {requested.length > 0 ? (
        <Section num="01" label="Needs your response" tone="gilt">
          <ul className="space-y-3">
            {requested.map((b) => <BookingRow key={b.id} booking={b} />)}
          </ul>
        </Section>
      ) : null}

      {active.length > 0 ? (
        <Section num={requested.length > 0 ? "02" : "01"} label="In progress" tone="plum">
          <ul className="space-y-3">
            {active.map((b) => <BookingRow key={b.id} booking={b} />)}
          </ul>
        </Section>
      ) : null}

      {fulfilled.length > 0 ? (
        <Section num="—" label="Fulfilled" tone="lagoon">
          <ul className="space-y-3">
            {fulfilled.map((b) => <BookingRow key={b.id} booking={b} muted />)}
          </ul>
        </Section>
      ) : null}

      {closed.length > 0 ? (
        <Section num="—" label="Closed">
          <ul className="space-y-3">
            {closed.map((b) => <BookingRow key={b.id} booking={b} muted />)}
          </ul>
        </Section>
      ) : null}

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <CalendarClock className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No bookings yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Publish listings to start attracting booking requests from relocating professionals.
          </p>
          <Link
            href="/app/listings"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-plum-600 pl-5 pr-4 text-[13.5px] font-semibold text-white hover:bg-plum-700"
          >
            Open listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  n, label, sub, tone,
}: { n: number; label: string; sub: string; tone?: "gilt" | "plum" | "lagoon" }) {
  const bg =
    tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
    tone === "plum"   ? "bg-plum-50 border-plum-100" :
    tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
    "bg-white border-ink-200";
  return (
    <div className={cn("rounded-2xl border p-5", bg)}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{n}</p>
      <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p>
    </div>
  );
}

function Section({ num, label, tone, children }: { num: string; label: string; tone?: "gilt" | "plum" | "lagoon"; children: React.ReactNode }) {
  const labelCls =
    tone === "gilt"   ? "text-gilt-800" :
    tone === "plum"   ? "text-plum-700" :
    tone === "lagoon" ? "text-lagoon-700" :
    "text-ink-700";
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className={cn("font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium", labelCls)}>{label}</span>
      </div>
      {children}
    </section>
  );
}

function BookingRow({ booking: b, muted }: { booking: Awaited<ReturnType<typeof prisma.booking.findMany>>[number] & { listing: { title: string; kind: string; city: string; country: string }; _count: { messages: number } }; muted?: boolean }) {
  const stage = stageMeta[b.status] ?? stageMeta.REQUESTED;
  return (
    <li>
      <Link
        href={`/app/bookings/${b.id}`}
        className={cn(
          "group block rounded-2xl border bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6",
          muted ? "border-ink-200 opacity-85" : "border-ink-200",
        )}
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12.5px] font-semibold text-parchment">
                {b.customerName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-sans text-[15px] font-semibold text-ink-900">{b.customerName}</p>
                  <span className={cn("inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", stage.cls)}>
                    {stage.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                  {b.listing.title}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 text-[12.5px] text-ink-600">
            <p className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-ink-400" /> {b.listing.city}, {b.listing.country}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              {b.startDate ? <><Clock className="h-3 w-3" /> Move-in {b.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</> : null}
              {b._count.messages > 0 ? <><span className="text-ink-300">·</span><MessageSquare className="h-3 w-3" /> {b._count.messages} msg{b._count.messages === 1 ? "" : "s"}</> : null}
            </p>
          </div>

          <div className="flex items-center gap-4 md:justify-end">
            <div className="text-right">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Amount</p>
              <p className="mt-0.5 font-sans text-[14px] font-semibold text-ink-900">{money(b.amount, b.currency)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Escrow</p>
              <p className={cn("mt-0.5 inline-flex items-center gap-1 font-sans text-[11.5px] font-semibold",
                b.escrowState === "RELEASED" ? "text-lagoon-700" : b.escrowState === "HELD" ? "text-gilt-800" : "text-ink-600",
              )}>
                <Wallet className="h-3 w-3" /> {b.escrowState}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 border-t border-ink-100 pt-2.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
          <span>Requested {relativeTime(b.createdAt)}</span>
          <span className="inline-flex items-center gap-1 text-ink-700 group-hover:text-ink-900 font-medium">Open booking <ArrowRight className="h-3 w-3" /></span>
        </p>
      </Link>
    </li>
  );
}
