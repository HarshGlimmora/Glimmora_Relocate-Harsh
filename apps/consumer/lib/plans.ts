/**
 * Glimmora Relocate — paid plans.
 *
 * Prices are in INR (smallest unit handled in the Razorpay order route).
 * `subscriptionTier` maps to the Prisma Subscription.tier values so a
 * successful payment can upgrade the user record from "FREE" → BASE/PREMIUM.
 */

export type PlanId = "basic" | "pro" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  priceInr: number;
  tagline: string;
  description: string;
  features: string[];
  recommended?: boolean;
  subscriptionTier: "BASE" | "PREMIUM";
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    priceInr: 999,
    tagline: "Get started",
    description:
      "Run your country, visa, and job-fit analyses with the AI Twin. One destination, one cycle.",
    features: [
      "1 destination country",
      "Country & visa scoring",
      "Job-fit conviction read",
      "Email support",
    ],
    subscriptionTier: "BASE",
  },
  {
    id: "pro",
    name: "Pro",
    priceInr: 2499,
    tagline: "Most popular",
    description:
      "The full relocation workflow — finance, documents, family, culture — across multiple countries.",
    features: [
      "Up to 5 destinations",
      "Full 9-module workflow",
      "Family & finance modelling",
      "Synthesis verdict",
      "Priority support",
    ],
    recommended: true,
    subscriptionTier: "PREMIUM",
  },
  {
    id: "premium",
    name: "Premium",
    priceInr: 4999,
    tagline: "Concierge",
    description:
      "Everything in Pro plus partner introductions, document review, and 1:1 relocation coaching.",
    features: [
      "Unlimited destinations",
      "Partner-lawyer intros",
      "Document QA review",
      "1:1 coaching sessions",
      "24/7 support",
    ],
    subscriptionTier: "PREMIUM",
  },
];

export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}
