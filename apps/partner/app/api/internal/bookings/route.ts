import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// POST /api/internal/bookings — Consumer creates a booking
// GET  /api/internal/bookings?email= — Consumer reads customer's bookings

const postSchema = z.object({
  listingId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(160),
  customerCountry: z.string().length(2).optional().nullable(),
  customerPassport: z.string().length(2).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

function authorized(req: Request) {
  const auth = req.headers.get("authorization");
  return !!process.env.INTERNAL_API_KEY && auth === `Bearer ${process.env.INTERNAL_API_KEY}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: b.listingId },
    include: { partner: true },
  });
  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }
  if (listing.partner.verificationStatus !== "APPROVED") {
    return NextResponse.json({ error: "Partner not verified" }, { status: 403 });
  }

  // Idempotency: if the same customer already has a REQUESTED booking for this listing, return it.
  const existing = await prisma.booking.findFirst({
    where: {
      listingId: b.listingId,
      customerEmail: b.customerEmail,
      status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
    },
  });
  if (existing) {
    return NextResponse.json({ ok: true, bookingId: existing.id, status: existing.status, alreadyBooked: true });
  }

  const booking = await prisma.booking.create({
    data: {
      partnerId: listing.partnerId,
      listingId: listing.id,
      customerEmail: b.customerEmail,
      customerName: b.customerName,
      customerCountry: b.customerCountry ?? null,
      customerPassport: b.customerPassport ?? null,
      note: b.note ?? null,
      startDate: b.startDate ? new Date(b.startDate) : null,
      endDate: b.endDate ? new Date(b.endDate) : null,
      amount: b.amount,
      currency: b.currency,
      escrowState: "HELD",
      status: "REQUESTED",
    },
  });

  // Seed the message thread with the customer's note
  if (b.note) {
    await prisma.message.create({
      data: {
        bookingId: booking.id,
        sender: "CUSTOMER",
        author: b.customerName,
        body: b.note,
      },
    });
  }

  // Create a held payout skeleton
  const platformFee = Math.round(b.amount * 0.05);
  await prisma.payout.create({
    data: {
      partnerId: listing.partnerId,
      bookingId: booking.id,
      amount: b.amount - platformFee,
      platformFee,
      currency: b.currency,
      status: "HELD",
      note: "Releases on booking fulfilment.",
    },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, status: booking.status, alreadyBooked: false });
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email query required" }, { status: 400 });

  const bookings = await prisma.booking.findMany({
    where: { customerEmail: email.toLowerCase() },
    include: {
      listing: { select: { id: true, title: true, kind: true, city: true, country: true } },
      partner: { select: { id: true, name: true, slug: true, category: true } },
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, sender: true, author: true, body: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      escrowState: b.escrowState,
      amount: b.amount,
      currency: b.currency,
      startDate: b.startDate?.toISOString() ?? null,
      endDate: b.endDate?.toISOString() ?? null,
      note: b.note,
      createdAt: b.createdAt.toISOString(),
      confirmedAt: b.confirmedAt?.toISOString() ?? null,
      fulfilledAt: b.fulfilledAt?.toISOString() ?? null,
      listing: b.listing,
      partner: b.partner,
      messages: b.messages.map((m) => ({
        id: m.id, sender: m.sender, author: m.author, body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
  });
}
