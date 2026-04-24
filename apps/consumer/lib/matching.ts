// MOCK matching heuristic — the backend team will replace with the real AI scoring engine.
// The contract stays the same: given (candidate twin, job), return a 0-100 match score and a visa fit.

import type { EmployerJob, EmployerJobDetail } from "./employer-api";

export type TwinForMatching = {
  passport?: string | null;
  currentCountry?: string | null;
  profession?: string | null;
  yearsExp?: number | null;
  targetCountries?: string[];
};

const seniorityMinYears: Record<string, number> = {
  junior: 0,
  mid: 2,
  senior: 5,
  staff: 8,
  principal: 10,
};

export function scoreMatch(twin: TwinForMatching, job: EmployerJob | EmployerJobDetail): number {
  let score = 50;

  if (twin.profession && job.title) {
    const p = twin.profession.toLowerCase();
    const t = job.title.toLowerCase();
    // overlap of meaningful words
    const words = p.split(/\s+/).filter((w) => w.length > 3);
    const hit = words.some((w) => t.includes(w));
    if (hit) score += 20;
  }

  if (twin.yearsExp != null && job.seniority) {
    const needed = seniorityMinYears[job.seniority.toLowerCase()] ?? 0;
    if (twin.yearsExp >= needed) score += 15;
    else score -= 8;
  }

  if (twin.passport && job.eligiblePassports.length > 0) {
    if (job.eligiblePassports.includes(twin.passport.toUpperCase())) score += 10;
  }

  if (twin.targetCountries?.length && job.location) {
    const m = job.location.match(/,\s*([A-Z]{2})\s*$/);
    const jobCountry = m?.[1];
    if (jobCountry && twin.targetCountries.includes(jobCountry)) score += 5;
  }

  return Math.max(0, Math.min(99, Math.round(score)));
}

export function computeVisaFit(
  twin: TwinForMatching,
  job: Pick<EmployerJob, "eligiblePassports" | "visaSponsorship">
): "yes" | "maybe" | "no" | "unknown" {
  if (!twin.passport) return "unknown";
  if (job.eligiblePassports.includes(twin.passport.toUpperCase())) return "yes";
  if (job.visaSponsorship) return "maybe";
  return "no";
}
