"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanId } from "@/lib/plans";
import { adminBypassAction } from "./actions";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface PaymentClientProps {
  user: { id: string; email: string; name: string | null };
  razorpayKeyId: string;
}

export function PaymentClient({ user, razorpayKeyId }: PaymentClientProps) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = React.useState<PlanId | null>(null);
  const [adminPending, startAdminTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

  async function handlePay(planId: PlanId) {
    setError(null);

    if (!razorpayKeyId) {
      setError(
        "Razorpay isn't configured yet. Add RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env, or use the admin bypass below.",
      );
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      setError("Payment SDK is still loading. Try again in a moment.");
      return;
    }

    setPendingPlan(planId);

    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => null);
        throw new Error(body?.error ?? "Could not create order.");
      }

      const order: {
        orderId: string;
        amount: number;
        currency: string;
        planName: string;
      } = await orderRes.json();

      const options: RazorpayCheckoutOptions = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Glimmora Relocate",
        description: `${order.planName} plan`,
        order_id: order.orderId,
        prefill: {
          name: user.name ?? undefined,
          email: user.email,
        },
        notes: { planId },
        theme: { color: "#5E3613" },
        modal: {
          ondismiss: () => setPendingPlan(null),
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payment/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            });

            if (!verifyRes.ok) {
              const body = await verifyRes.json().catch(() => null);
              throw new Error(body?.error ?? "Payment verification failed.");
            }

            router.push("/app");
            router.refresh();
          } catch (err) {
            setPendingPlan(null);
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support.",
            );
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPendingPlan(null);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    }
  }

  function handleAdminBypass() {
    setError(null);
    startAdminTransition(async () => {
      const result = await adminBypassAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className="w-full max-w-[1100px]">
        {/* Heading */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
            <Sparkles className="h-3 w-3 text-gilt-500" />
            One step before your Twin starts
          </div>
          <h1 className="mt-6 font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Choose your plan
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">
            Unlock the full relocation workflow — country, visa, finance, family, and
            culture analyses, plus your AI Twin's synthesis verdict.
          </p>
        </div>

        {error ? (
          <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
            {error}
          </div>
        ) : null}

        {/* Plan grid */}
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isPending = pendingPlan === plan.id;
            const disabled = pendingPlan !== null || adminPending;
            return (
              <article
                key={plan.id}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-white p-7 transition-all duration-200",
                  "hover:-translate-y-1 hover:shadow-elev-lg",
                  plan.recommended
                    ? "border-caramel-700/40 shadow-elev-md ring-1 ring-caramel-700/15"
                    : "border-ink-200 shadow-elev-sm",
                )}
              >
                {plan.recommended ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-parchment">
                    Recommended
                  </span>
                ) : null}

                <p className="mono-label">{plan.tagline}</p>
                <h2 className="mt-1.5 font-sans text-[26px] font-semibold tracking-[-0.02em] text-ink-900">
                  {plan.name}
                </h2>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-sans text-[40px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    / one-time
                  </span>
                </div>

                <p className="mt-4 text-[13.5px] leading-[1.55] text-ink-600">
                  {plan.description}
                </p>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-[13px] text-ink-800"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          plan.recommended
                            ? "bg-caramel-700 text-parchment"
                            : "bg-ink-900 text-parchment",
                        )}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handlePay(plan.id)}
                  disabled={disabled}
                  className={cn(
                    "group/btn mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold transition-all",
                    plan.recommended ? "btn-primary" : "btn-ghost",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening checkout…
                    </>
                  ) : (
                    <>
                      Pay now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {/* Trust line */}
        <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5 text-lagoon-600" />
          Secure payment via Razorpay · Test mode
        </div>

        {/* Dev / testing bypass */}
        <div className="mx-auto mt-10 max-w-md">
          <div className="soft-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-600">
              Development only
            </p>
            <p className="text-[12.5px] leading-[1.5] text-ink-700">
              Skip checkout and go straight to the dashboard. This shortcut
              exists for testing the post-payment flow.
            </p>
            <button
              type="button"
              onClick={handleAdminBypass}
              disabled={adminPending || pendingPlan !== null}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-ink-300 bg-white px-5 text-[13px] font-medium text-ink-800 transition-all hover:border-ink-900 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Granting access…
                </>
              ) : (
                <>Login as Admin (Free)</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
