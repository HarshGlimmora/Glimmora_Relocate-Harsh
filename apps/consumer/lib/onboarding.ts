/**
 * Multi-step onboarding model.
 *
 * The product flow is data-first: we collect rich context in a sequence
 * of small steps before the user lands on any analysis page. Each step
 * has a required-field test; the gate (`requireOnboardingComplete`)
 * redirects to the first incomplete step.
 *
 *   1. goal        — relocation_goal (intent) + reason_for_moving
 *   2. resume      — upload + apply (auto-fills most identity/career)
 *   3. profile     — identity gaps the resume couldn't fill
 *   4. destination — target_country + target_city + alternates
 *   5. jobs        — target_role, work_preference, focus, sponsorship
 *   6. family      — family_status + moving_with_family + children
 *   7. visa        — nationality + current_country + visa status
 *   8. budget      — current/expected salary + savings + cost_sensitivity
 *
 * After step 8 (or whenever every required field is populated), the
 * user is allowed into /app/* analysis pages.
 *
 * Pure module: types + a single pure function. No I/O, no `server-only`
 * — `requirePrereqs` (which IS server-only) calls `evaluateOnboarding`
 * after it has the profile in hand. Marking this file `server-only`
 * accidentally taints the NextAuth /api/auth/* pages-router chain.
 */

import type { BackendProfile } from "@/lib/backend/types";

export type OnboardingStepId =
  | "goal"
  | "resume"
  | "profile"
  | "destination"
  | "jobs"
  | "family"
  | "visa"
  | "budget";

export interface OnboardingStep {
  id: OnboardingStepId;
  /** URL of the step. */
  href: string;
  /** Number shown to the user (1..N). */
  index: number;
  /** Short label for the stepper. */
  label: string;
  /** One-line description of what's collected here. */
  blurb: string;
  /**
   * Returns the missing-field IDs for this step, given the current profile
   * + intent. An empty array means the step is satisfied.
   */
  missing: (input: { profile: BackendProfile; hasIntent: boolean; resumeUploaded: boolean }) => string[];
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "goal",
    href: "/app/onboarding/goal",
    index: 1,
    label: "Goal",
    blurb: "What kind of move is this — and why?",
    missing: ({ hasIntent, profile }) => {
      const out: string[] = [];
      if (!hasIntent) out.push("relocation_goal");
      // reason_for_moving is encouraged but not required to advance
      if (!profile.reason_for_moving) out.push("reason_for_moving?");
      return out.filter((k) => !k.endsWith("?"));
    },
  },
  {
    id: "resume",
    href: "/app/onboarding/resume",
    index: 2,
    label: "Resume",
    blurb: "Auto-fill most of your profile from a PDF or DOCX.",
    missing: ({ resumeUploaded, profile }) => {
      // Resume is optional — but we mark it satisfied either when one was
      // uploaded OR when the user has manually filled the things it would
      // have filled.
      if (resumeUploaded) return [];
      const hasIdentity = !!(profile.full_name && profile.current_role);
      return hasIdentity ? [] : ["resume_or_identity"];
    },
  },
  {
    id: "profile",
    href: "/app/onboarding/profile",
    index: 3,
    label: "Profile",
    blurb: "Confirm what we got. Fill what's still missing.",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (!profile.full_name) out.push("full_name");
      if (!profile.current_role) out.push("current_role");
      if (profile.years_experience == null) out.push("years_experience");
      if (!profile.seniority) out.push("seniority");
      return out;
    },
  },
  {
    id: "destination",
    href: "/app/onboarding/destination",
    index: 4,
    label: "Destination",
    blurb: "Where do you want to land — and what alternates?",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (!profile.target_country) out.push("target_country");
      return out;
    },
  },
  {
    id: "jobs",
    href: "/app/onboarding/jobs",
    index: 5,
    label: "Jobs",
    blurb: "Your career angle.",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (!profile.target_role && !profile.current_role) out.push("target_role");
      if (!profile.work_preference) out.push("work_preference");
      if (profile.needs_visa_sponsorship == null) out.push("needs_visa_sponsorship");
      return out;
    },
  },
  {
    id: "family",
    href: "/app/onboarding/family",
    index: 6,
    label: "Family",
    blurb: "Who's coming with you.",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (!profile.family_status) out.push("family_status");
      if (profile.moving_with_family == null) out.push("moving_with_family");
      return out;
    },
  },
  {
    id: "visa",
    href: "/app/onboarding/visa",
    index: 7,
    label: "Visa",
    blurb: "Passport + current visa situation.",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (!profile.nationality) out.push("nationality");
      if (!profile.current_country) out.push("current_country");
      return out;
    },
  },
  {
    id: "budget",
    href: "/app/onboarding/budget",
    index: 8,
    label: "Budget",
    blurb: "Salary, savings, comfort margin.",
    missing: ({ profile }) => {
      const out: string[] = [];
      if (profile.current_salary == null) out.push("current_salary");
      if (!profile.salary_currency) out.push("salary_currency");
      if (!profile.cost_sensitivity) out.push("cost_sensitivity");
      return out;
    },
  },
];

export interface OnboardingStatus {
  /** First step whose `missing` returned a non-empty array, or null if done. */
  nextStep: OnboardingStep | null;
  /** Per-step missing-fields map, in order. */
  missingByStep: { step: OnboardingStep; missing: string[] }[];
  /** Convenience: completion 0..100 across the gate. */
  completionRatio: number;
}

export function evaluateOnboarding(input: {
  profile: BackendProfile;
  hasIntent: boolean;
  resumeUploaded: boolean;
}): OnboardingStatus {
  const missingByStep = ONBOARDING_STEPS.map((step) => ({
    step,
    missing: step.missing(input),
  }));
  const completedSteps = missingByStep.filter((m) => m.missing.length === 0).length;
  const completionRatio = Math.round(
    (completedSteps / ONBOARDING_STEPS.length) * 100,
  );
  const next = missingByStep.find((m) => m.missing.length > 0);
  return {
    nextStep: next?.step ?? null,
    missingByStep,
    completionRatio,
  };
}
