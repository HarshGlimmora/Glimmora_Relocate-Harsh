/**
 * Current plan visual card — replaces the static dark hero with a
 * richer dashboard view: countdown ring to renewal date + status
 * badges + a payment-method tile.
 *
 * Read-only — actions stay W4-gated as in the original page.
 */

import * as React from "react";
import {
  ArrowUpRight,
  CreditCard,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type TierKey = "FREE" | "BASE" | "PREMIUM";

interface Props {
  currentTier: TierKey;
  status?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

const PLAN_NAMES: Record<TierKey, string> = {
  FREE: "Explore",
  BASE: "Glimmora Base",
  PREMIUM: "Premium",
};

const PLAN_PRICES: Record<TierKey, string> = {
  FREE: "$0",
  BASE: "$100 / year",
  PREMIUM: "$240 / year",
};

const PLAN_DESC: Record<TierKey, string> = {
  FREE: "Free tier — explore without commitment.",
  BASE: "Full Copilot + plan execution + marketplace.",
  PREMIUM: "Base + Verified Human Experts + priority support.",
};

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function CurrentPlanCard({
  currentTier,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: Props) {
  const dr = daysUntil(currentPeriodEnd ?? null);
  // Renewal ring shows progress through the cycle. We don't store
  // period_start, so anchor to a 365-day annual cycle for a sane visual.
  const cycleLen = 365;
  const elapsed = dr == null ? 0 : Math.min(cycleLen, Math.max(0, cycleLen - dr));
  const ringPct = cycleLen > 0 ? (elapsed / cycleLen) * 100 : 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ringPct / 100) * circumference;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gilt-500/20 blur-[60px]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300">
              Current plan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-300">
              <CheckCircle2 className="h-3 w-3" />
              {status ?? "active"}
            </span>
            {cancelAtPeriodEnd ? (
              <span className="rounded-full bg-danger-500/20 border border-danger-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-danger-200">
                Cancels at period end
              </span>
            ) : null}
          </div>

          <h2 className="mt-5 font-sans text-[28px] font-semibold tracking-tight">
            {PLAN_NAMES[currentTier]}
          </h2>
          <p className="mt-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">
            {PLAN_PRICES[currentTier]}
          </p>
          <p className="mt-3 max-w-md text-[14px] text-white/70">
            {PLAN_DESC[currentTier]}
          </p>

          {/* Stat row: renewal ring + cancellation block */}
          <div className="mt-7 grid items-center gap-5 border-t border-white/10 pt-6 sm:grid-cols-[auto_1fr_1fr]">
            {/* Renewal countdown ring */}
            {currentPeriodEnd ? (
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 76 76" className="h-16 w-16 -rotate-90" aria-hidden="true">
                  <circle cx="38" cy="38" r={radius} className="fill-none stroke-white/15" strokeWidth="6" />
                  <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    className="fill-none stroke-gilt-400"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                    {dr === 0 ? "Renews today" : "Days to renew"}
                  </p>
                  <p className="mt-0.5 font-sans text-[22px] font-semibold leading-none">
                    {dr ?? "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/50">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                    Renewal
                  </p>
                  <p className="mt-0.5 text-[14px]">No upcoming renewal</p>
                </div>
              </div>
            )}

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">
                Renews
              </p>
              <p className="mt-1 text-[14px]">{currentPeriodEnd ? formatDate(currentPeriodEnd) : "—"}</p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">
                Cancellation
              </p>
              <p className="mt-1 text-[14px]">
                {cancelAtPeriodEnd ? "Ends at period close" : "Not scheduled"}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {currentTier === "FREE" ? (
              <button
                type="button"
                disabled
                title="Subscription upgrades ship with W4 (Stripe Connect)."
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed"
              >
                Upgrade to Base <ArrowUpRight className="h-4 w-4" />
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">
                  W4
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  title="Subscription management ships with W4 (Stripe Connect)."
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed"
                >
                  Manage plan
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">
                    W4
                  </span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Subscription management ships with W4 (Stripe Connect)."
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[13.5px] font-medium text-white/60 cursor-not-allowed"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <p className="mt-5 text-[11px] text-white/40">
            Stripe Connect integration ships in W4 — actions are UI-ready.
          </p>
        </div>
      </div>

      {/* Payment method tile */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          Payment method
        </p>
        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
          <CreditCard className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
        </div>
        <p className="mt-5 font-sans text-[17px] font-semibold tracking-tight text-ink-900">
          No card on file
        </p>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-600">
          Add a payment method when you upgrade. Stripe handles storage — your card never touches our servers.
        </p>

        {/* Trust signal chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 border border-success-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-800">
            <CheckCircle2 className="h-2.5 w-2.5" /> PCI-compliant
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 border border-success-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-800">
            <CheckCircle2 className="h-2.5 w-2.5" /> Stripe-hosted
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 border border-success-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-800">
            <CheckCircle2 className="h-2.5 w-2.5" /> Cancel anytime
          </span>
        </div>

        <button
          type="button"
          disabled
          title="Payment method storage ships with W4 (Stripe Connect)."
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white text-[13px] font-medium text-ink-500 cursor-not-allowed"
        >
          Add payment method
          <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">
            W4
          </span>
        </button>
      </div>
    </section>
  );
}
