import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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
      { error: "Invalid verification payload." },
      { status: 400 },
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
    parsed.data;

  const plan = getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured on the server." },
      { status: 500 },
    );
  }

  // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const sigBuf = Buffer.from(razorpay_signature, "utf8");
  const expBuf = Buffer.from(expectedSignature, "utf8");
  const valid =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  if (!valid) {
    return NextResponse.json(
      { error: "Payment signature mismatch." },
      { status: 400 },
    );
  }

  // Mark the user as paid by upgrading their subscription tier.
  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      tier: plan.subscriptionTier,
      status: "active",
    },
    update: {
      tier: plan.subscriptionTier,
      status: "active",
    },
  });

  return NextResponse.json({
    ok: true,
    planId: plan.id,
    tier: plan.subscriptionTier,
  });
}
