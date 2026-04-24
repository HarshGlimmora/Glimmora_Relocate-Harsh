"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePartnerSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const statusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["CONFIRMED", "DECLINED", "IN_PROGRESS", "FULFILLED", "CANCELLED"]),
});

export async function setBookingStatus(bookingId: string, status: string): Promise<Result> {
  const parsed = statusSchema.safeParse({ bookingId, status });
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { partner, user } = await requirePartnerSession();

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.partnerId !== partner.id) return { ok: false, error: "Not authorised" };

  const now = new Date();
  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "CONFIRMED" && !booking.confirmedAt) data.confirmedAt = now;
  if (parsed.data.status === "FULFILLED") {
    data.fulfilledAt = now;
    data.escrowState = "RELEASED";
  }
  if (parsed.data.status === "CANCELLED") data.cancelledAt = now;

  await prisma.booking.update({ where: { id: parsed.data.bookingId }, data });

  // If fulfilled, release the escrow payout
  if (parsed.data.status === "FULFILLED") {
    const payout = await prisma.payout.findUnique({ where: { bookingId: booking.id } });
    if (payout && payout.status !== "RELEASED") {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: "RELEASED", releasedAt: now, note: `Released on fulfilment by ${user.name ?? user.email}` },
      });
    }
  }

  // System message for audit trail
  const systemMessage: Record<string, string> = {
    CONFIRMED: `${user.name ?? "Partner"} confirmed the booking. Escrow stays held until fulfilment.`,
    DECLINED: `${user.name ?? "Partner"} declined the booking. Funds will be refunded.`,
    IN_PROGRESS: `${user.name ?? "Partner"} marked the booking in progress.`,
    FULFILLED: `${user.name ?? "Partner"} marked fulfilled. Escrow released to payout.`,
    CANCELLED: `${user.name ?? "Partner"} cancelled the booking.`,
  };
  if (systemMessage[parsed.data.status]) {
    await prisma.message.create({
      data: {
        bookingId: booking.id,
        sender: "SYSTEM",
        author: "Glimmora",
        body: systemMessage[parsed.data.status],
      },
    });
  }

  revalidatePath("/app/bookings");
  revalidatePath(`/app/bookings/${bookingId}`);
  revalidatePath("/app");
  revalidatePath("/app/payouts");
  return { ok: true };
}

const messageSchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export async function sendMessage(bookingId: string, body: string): Promise<Result> {
  const parsed = messageSchema.safeParse({ bookingId, body });
  if (!parsed.success) return { ok: false, error: "Message can't be empty." };

  const { partner, user } = await requirePartnerSession();

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.partnerId !== partner.id) return { ok: false, error: "Not authorised" };

  await prisma.message.create({
    data: {
      bookingId: booking.id,
      sender: "PARTNER",
      author: user.name ?? partner.name,
      body: parsed.data.body.trim(),
    },
  });

  revalidatePath(`/app/bookings/${bookingId}`);
  revalidatePath("/app/messages");
  return { ok: true };
}
