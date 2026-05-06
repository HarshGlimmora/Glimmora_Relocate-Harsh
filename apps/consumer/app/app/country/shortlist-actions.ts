"use server";

import { country, patchProfile } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import type { ShortlistRequest, ShortlistResponse } from "@/lib/backend/types";

/**
 * Run the deterministic shortlist scoring for a 2–5 country list.
 * Returns the chart-ready response or a string error.
 */
export async function runShortlistAction(
  request: ShortlistRequest,
): Promise<
  { ok: true; data: ShortlistResponse } | { ok: false; error: string }
> {
  try {
    const { caseId } = await requirePrereqs();
    const data = await country.shortlist(caseId, request);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Persist the user's shortlist on the profile so reloads come back to
 * the same list. Saves: target_country (winner), alternatives (rest),
 * priority_ranking from the heaviest weights.
 */
export async function persistShortlistAction(input: {
  countries: string[];
  weights: { career: number; cost: number; family: number; lifestyle: number; speed: number };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const [first, ...rest] = input.countries;
    const sortedLevers = (Object.entries(input.weights) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k as "career" | "cost" | "family" | "lifestyle" | "speed");
    await patchProfile({
      target_country: first ?? null,
      alternatives: rest.slice(0, 5),
      open_to_alternatives: rest.length > 0,
      priority_ranking: sortedLevers,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
