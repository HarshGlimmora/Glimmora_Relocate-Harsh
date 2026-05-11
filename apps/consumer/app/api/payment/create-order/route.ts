import { NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { getPlan } from "@/lib/plans";

const bodySchema = z.object({
  planId: z.enum(["basic", "pro", "premium"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plan." },
      { status: 400 },
    );
  }

  const plan = getPlan(parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured on the server." },
      { status: 500 },
    );
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // Razorpay amount is in the smallest currency unit (paise for INR).
  const amountPaise = plan.priceInr * 100;

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `glm_${session.user.id.slice(0, 12)}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId: plan.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan.id,
      planName: plan.name,
    });
  } catch (err) {
    console.error("[razorpay] create-order failed", err);
    return NextResponse.json(
      { error: "Could not create Razorpay order." },
      { status: 502 },
    );
  }
}
