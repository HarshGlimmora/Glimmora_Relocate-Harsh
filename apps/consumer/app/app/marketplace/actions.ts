"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { submitPartnerBooking } from "@/lib/partner-api";

type Result =
  | { ok: true; bookingId: string; alreadyBooked: boolean }
  | { ok: false; error: string };

export async function bookListingAction(input: {
  listingId: string;
  amount: number;
  currency: string;
  note?: string | null;
  startDate?: string | null;
}): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  try {
    const res = await submitPartnerBooking({
      listingId: input.listingId,
      customerEmail: user.email,
      customerName: user.name ?? user.email,
      customerCountry: user.profile?.currentCountry ?? null,
      customerPassport: user.profile?.nationality ?? null,
      note: input.note ?? null,
      startDate: input.startDate ?? null,
      amount: input.amount,
      currency: input.currency,
    });
    revalidatePath("/app/marketplace");
    return { ok: true, bookingId: res.bookingId, alreadyBooked: res.alreadyBooked };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create booking";
    return { ok: false, error: msg };
  }
}
