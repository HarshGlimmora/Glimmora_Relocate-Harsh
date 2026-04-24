import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ArrowRight, Clock, User } from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { partner } = await requirePartnerSession();

  // Threads — one per booking, with latest message preview
  const bookings = await prisma.booking.findMany({
    where: { partnerId: partner.id, messages: { some: {} } },
    include: {
      listing: { select: { title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const threads = bookings
    .map((b) => ({
      booking: b,
      latest: b.messages[0] ?? null,
      count: b._count.messages,
    }))
    .filter((t) => t.latest);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Messages</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          All conversations.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Every message tied to a booking. Reply here or inside a booking — they stay in sync.
        </p>
      </header>

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <MessageSquare className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No messages yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            When a customer books one of your listings, the conversation starts here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {threads.map(({ booking, latest, count }) => (
            <li key={booking.id}>
              <Link
                href={`/app/bookings/${booking.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50/60 md:gap-6 md:px-6"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12.5px] font-semibold text-parchment">
                  {booking.customerName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <p className="truncate font-sans text-[14.5px] font-semibold text-ink-900">{booking.customerName}</p>
                    <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {relativeTime(new Date(latest!.createdAt))}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                    {booking.listing.title}
                  </p>
                  <p className={cn(
                    "mt-1.5 truncate text-[13px]",
                    latest!.sender === "PARTNER" ? "text-ink-500" : "font-medium text-ink-800"
                  )}>
                    {latest!.sender === "PARTNER" ? "You: " : ""}{latest!.body}
                  </p>
                </div>
                <div className="hidden text-right md:block">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">Thread</p>
                  <p className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">{count} msg{count === 1 ? "" : "s"}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 group-hover:text-ink-900" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
