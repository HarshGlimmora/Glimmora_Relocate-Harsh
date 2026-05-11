import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PaymentClient } from "./payment-client";

export const metadata: Metadata = { title: "Choose your plan" };
export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?from=/payment");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    redirect("/sign-in?from=/payment");
  }

  // Note: we deliberately do NOT short-circuit paid users away from /payment.
  // The product flow is "login → payment page → dashboard"; the real access
  // gate lives in /app/layout.tsx, which still blocks unpaid users.
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

  return (
    <PaymentClient
      user={{ id: user.id, email: user.email, name: user.name }}
      razorpayKeyId={razorpayKeyId}
    />
  );
}
