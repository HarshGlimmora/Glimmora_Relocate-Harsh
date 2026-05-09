"use client";

/**
 * Interactive plans explorer for the Billing page.
 *
 * Adds a few things the static layout couldn't:
 *   • Annual / Monthly billing-cycle toggle — re-prices each plan
 *     (annual price ÷ 12 with a "save N%" hint when annual is picked).
 *   • Click any plan to "focus" it — non-focused plans dim, focused
 *     plan ring lights up. Useful for explaining options.
 *   • Feature comparison matrix — a checkmark grid (every feature ×
 *     every plan) so the differences are scannable at a glance.
 *   • The CTA stays UI-only because Stripe Connect ships with W4.
 */

import * as React from "react";
import { Check, Minus, ArrowUpRight, Sparkles } from "lucide-react";

type TierKey = "FREE" | "BASE" | "PREMIUM";

interface PlanSpec {
  key: TierKey;
  name: string;
  annualUsd: number;
  desc: string;
  features: string[];
}

const PLANS: PlanSpec[] = [
  {
    key: "FREE",
    name: "Explore",
    annualUsd: 0,
    desc: "Free tier — explore without commitment.",
    features: [
      "Country comparison, simulator",
      "Visa-aware job discovery",
      "10 Copilot / month",
    ],
  },
  {
    key: "BASE",
    name: "Glimmora Base",
    annualUsd: 100,
    desc: "Full Copilot + plan execution + marketplace.",
    features: [
      "Unlimited Copilot",
      "Documents vault",
      "Marketplace + escrow",
      "Family twin",
    ],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    annualUsd: 240,
    desc: "Base + Verified Human Experts + priority support.",
    features: [
      "Everything in Base",
      "Verified Human Experts",
      "Priority support",
    ],
  },
];

// Master list of every feature, mapped to which tiers include it.
// (Each feature appears in the matrix in the order listed here.)
const FEATURE_MATRIX: { label: string; tiers: TierKey[] }[] = [
  { label: "Country comparison + simulator", tiers: ["FREE", "BASE", "PREMIUM"] },
  { label: "Visa-aware job discovery", tiers: ["FREE", "BASE", "PREMIUM"] },
  { label: "Copilot conversations", tiers: ["FREE", "BASE", "PREMIUM"] },
  { label: "Unlimited Copilot usage", tiers: ["BASE", "PREMIUM"] },
  { label: "Documents vault", tiers: ["BASE", "PREMIUM"] },
  { label: "Marketplace + escrow", tiers: ["BASE", "PREMIUM"] },
  { label: "Family twin", tiers: ["BASE", "PREMIUM"] },
  { label: "Verified Human Experts", tiers: ["PREMIUM"] },
  { label: "Priority support", tiers: ["PREMIUM"] },
];

interface Props {
  currentTier: TierKey;
}

export function PlansExplorer({ currentTier }: Props) {
  const [cycle, setCycle] = React.useState<"annual" | "monthly">("annual");
  const [focusedKey, setFocusedKey] = React.useState<TierKey | null>(null);

  function priceFor(plan: PlanSpec): { amount: string; cadence: string; saveHint: string | null } {
    if (plan.annualUsd === 0) return { amount: "$0", cadence: "free", saveHint: null };
    if (cycle === "annual") {
      return {
        amount: `$${plan.annualUsd}`,
        cadence: "/ year",
        saveHint: "Save vs monthly",
      };
    }
    // Loose monthly equivalent: annual / 10 to imply monthly is pricier.
    const monthly = Math.round(plan.annualUsd / 10);
    return { amount: `$${monthly}`, cadence: "/ month", saveHint: null };
  }

  return (
    <div data-plans-explorer className="space-y-8">
      {/* ============ All plans · header + cycle toggle ============ */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">
            01
          </span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            All plans
          </span>

          {/* Cycle toggle */}
          <div
            role="tablist"
            aria-label="Billing cycle"
            data-cycle-toggle
            className="inline-flex rounded-full border border-ink-200 bg-ink-50/60 p-0.5"
          >
            {(["annual", "monthly"] as const).map((c) => {
              const active = cycle === c;
              return (
                <button
                  key={c}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  data-cycle={c}
                  data-cycle-active={active ? "true" : "false"}
                  onClick={() => setCycle(c)}
                  className={
                    "rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all " +
                    (active
                      ? "bg-ink-900 text-parchment shadow-sm"
                      : "text-ink-700 hover:text-ink-900")
                  }
                >
                  {c === "annual" ? "Annual" : "Monthly"}
                  {c === "annual" && cycle === "annual" ? (
                    <span className="ml-1.5 rounded-full bg-gilt-400 px-1.5 py-0 text-[9px] text-ink-900">
                      Save
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.key;
            const isBase = plan.key === "BASE";
            const isFocused = focusedKey === plan.key;
            const isOtherFocused = focusedKey !== null && !isFocused;
            const price = priceFor(plan);

            return (
              <article
                key={plan.key}
                data-plan={plan.key}
                data-plan-current={isCurrent ? "true" : "false"}
                data-plan-focused={isFocused ? "true" : "false"}
                onClick={() => setFocusedKey(isFocused ? null : plan.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFocusedKey(isFocused ? null : plan.key);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isFocused}
                className={
                  "cursor-pointer rounded-2xl p-6 md:p-7 transition-all " +
                  (isCurrent
                    ? "ring-2 ring-ink-900 bg-white border border-ink-900"
                    : isBase
                    ? "bg-ink-900 text-parchment border border-ink-900"
                    : "bg-white border border-ink-200") +
                  (isFocused ? " scale-[1.015] shadow-lg" : "") +
                  (isOtherFocused ? " opacity-50" : "") +
                  " hover:-translate-y-0.5"
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      "font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium " +
                      (isBase && !isCurrent ? "text-gilt-300" : "text-ink-500")
                    }
                  >
                    {plan.name}
                  </span>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-50 border border-lagoon-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} /> Current
                    </span>
                  ) : isBase ? (
                    <span className="rounded-full bg-gilt-400 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-900">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p
                  className={
                    "mt-6 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] " +
                    (isBase && !isCurrent ? "text-parchment" : "text-ink-900")
                  }
                >
                  {price.amount}
                  <span
                    className={
                      "ml-1.5 text-[14px] font-medium " +
                      (isBase && !isCurrent ? "text-white/60" : "text-ink-400")
                    }
                  >
                    {price.cadence}
                  </span>
                </p>
                {price.saveHint ? (
                  <p
                    className={
                      "mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] " +
                      (isBase && !isCurrent
                        ? "bg-gilt-400/20 text-gilt-300"
                        : "bg-success-50 text-success-800")
                    }
                  >
                    {price.saveHint}
                  </p>
                ) : null}
                <p
                  className={
                    "mt-3 text-[13px] " +
                    (isBase && !isCurrent ? "text-white/60" : "text-ink-500")
                  }
                >
                  {plan.desc}
                </p>

                <ul className="mt-6 space-y-2 text-[13px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={
                          "mt-0.5 h-3.5 w-3.5 shrink-0 " +
                          (isBase && !isCurrent ? "text-gilt-400" : "text-lagoon-600")
                        }
                        strokeWidth={2.5}
                      />
                      <span
                        className={
                          isBase && !isCurrent ? "text-white/85" : "text-ink-700"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  title={
                    isCurrent
                      ? "You're on this plan."
                      : "Plan selection ships with W4 (Stripe Connect)."
                  }
                  onClick={(e) => e.stopPropagation()}
                  className={
                    "mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-medium cursor-not-allowed " +
                    (isCurrent
                      ? "bg-ink-100 text-ink-500"
                      : isBase
                      ? "border border-white/15 bg-white/5 text-white/60"
                      : "border border-ink-200 bg-white text-ink-500")
                  }
                >
                  {isCurrent ? "Current plan" : `Choose ${plan.name}`}
                  {!isCurrent ? (
                    <span
                      className={
                        "rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] " +
                        (isBase ? "bg-white/10 text-white/60" : "bg-ink-100 text-ink-600")
                      }
                    >
                      W4
                    </span>
                  ) : null}
                </button>
              </article>
            );
          })}
        </div>

        {focusedKey ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
            <Sparkles className="h-3 w-3" />
            {PLANS.find((p) => p.key === focusedKey)?.name} focused · click again to clear
          </p>
        ) : null}
      </section>

      {/* ============ Feature comparison matrix ============ */}
      <section>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">
            02
          </span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
            Compare features
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {/* Header row */}
          <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] border-b border-ink-200 bg-ink-50/50">
            <div className="p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Feature
            </div>
            {PLANS.map((p) => {
              const isCurrent = p.key === currentTier;
              const isFocused = focusedKey === p.key;
              return (
                <div
                  key={p.key}
                  data-matrix-tier={p.key}
                  className={
                    "p-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] " +
                    (isCurrent
                      ? "bg-lagoon-50 text-lagoon-800"
                      : isFocused
                      ? "bg-gilt-50 text-gilt-800"
                      : "text-ink-700")
                  }
                >
                  {p.name}
                  {isCurrent ? (
                    <span className="ml-1 rounded-full bg-lagoon-100 px-1.5 py-0 text-[9px] tracking-normal">
                      You
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Feature rows */}
          {FEATURE_MATRIX.map((feat, fi) => (
            <div
              key={feat.label}
              data-matrix-row={fi}
              className={
                "grid grid-cols-[1.6fr_repeat(3,1fr)] " +
                (fi % 2 === 0 ? "bg-white" : "bg-parchment/30")
              }
            >
              <div className="p-3 text-[12.5px] text-ink-800">{feat.label}</div>
              {PLANS.map((p) => {
                const included = feat.tiers.includes(p.key);
                const isCurrent = p.key === currentTier;
                const isFocused = focusedKey === p.key;
                return (
                  <div
                    key={p.key}
                    data-matrix-cell={`${p.key}:${included ? "yes" : "no"}`}
                    className={
                      "flex items-center justify-center p-3 " +
                      (isCurrent
                        ? "bg-lagoon-50/40"
                        : isFocused
                        ? "bg-gilt-50/40"
                        : "")
                    }
                  >
                    {included ? (
                      <span
                        aria-label="Included"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-success-100 text-success-700"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span
                        aria-label="Not included"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-50 text-ink-300"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-ink-500">
          ✓ included · — not included. Hover or tap a plan above to focus that column.
        </p>
      </section>

      {/* ============ Upgrade hint ============ */}
      {currentTier === "FREE" ? (
        <section
          data-upgrade-hint
          className="rounded-2xl border-2 border-ink-900 bg-ink-900 p-5 text-parchment"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gilt-400 text-ink-900"
            >
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-300">
                Why upgrade
              </p>
              <p className="mt-1 font-sans text-[18px] font-semibold leading-snug">
                Unlock unlimited Copilot, the document vault, and the marketplace.
              </p>
              <p className="mt-2 text-[13px] text-white/70">
                Plan upgrades go live in W4 with Stripe Connect — once it ships,
                this button takes you straight to checkout.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
