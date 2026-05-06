import type { Metadata } from "next";
import Link from "next/link";
import { country } from "@/lib/backend/client";
import { requirePrereqs } from "@/lib/backend/page-helpers";
import {
  EnvelopeMeta,
  PageHeader,
} from "@/components/backend/envelope-shell";
import { framingFor } from "@/lib/intent";
import { CountryDecisionBoard } from "./decision-board";
import type {
  ShortlistResponse,
  ShortlistWeights,
} from "@/lib/backend/types";

export const metadata: Metadata = { title: "Country comparison" };
export const dynamic = "force-dynamic";

const FALLBACK_DESTINATIONS = ["DE", "NL", "AE", "SG"];

export default async function CountryPage() {
  const { caseId, profile, intent } = await requirePrereqs();

  // Build the initial shortlist: target_country first, then alternatives
  // from the profile, then fallback destinations to fill to at least 3.
  const seen = new Set<string>();
  const initialShortlist: string[] = [];
  const push = (c: string | null | undefined) => {
    if (!c) return;
    const upper = c.toUpperCase();
    if (seen.has(upper)) return;
    seen.add(upper);
    initialShortlist.push(upper);
  };
  push(profile.target_country);
  for (const alt of profile.alternatives ?? []) push(alt);
  for (const fb of FALLBACK_DESTINATIONS) {
    if (initialShortlist.length >= 3) break;
    push(fb);
  }

  const initialWeights: ShortlistWeights = {
    career: 3,
    cost: 3,
    family: 3,
    lifestyle: 3,
    speed: 3,
  };
  // Bias toward the profile's saved priority_ranking (top → 5, next → 4, …).
  const ranking = profile.priority_ranking ?? [];
  ranking.forEach((lever, i) => {
    if (lever === "career" || lever === "cost" || lever === "family"
        || lever === "lifestyle" || lever === "speed") {
      initialWeights[lever] = Math.max(1, 5 - i);
    }
  });

  // Server-side prefetch the first ranking so the page paints instantly.
  let initialResponse: ShortlistResponse | null = null;
  if (initialShortlist.length >= 2) {
    try {
      initialResponse = await country.shortlist(caseId, {
        countries: initialShortlist,
        weights: initialWeights,
      });
    } catch {
      // Swallow — the client will retry on first interaction.
      initialResponse = null;
    }
  }

  // Wrap a synthetic "row" for EnvelopeMeta so the meta strip stays
  // consistent with other module pages.
  const fauxRow = {
    id: "shortlist",
    case_id: caseId,
    kind: "country_comparison" as const,
    status: "ready" as const,
    envelope: {
      status: "ready" as const,
      score: initialResponse?.countries[0]?.weighted_score ?? null,
      summary: "",
      reasoning: "",
      risks: [],
      next_actions: [],
      confidence: initialResponse?.fingerprint
        ? Math.round(initialResponse.source.confidence * 100) / 100
        : 0.7,
      metadata: {
        generated_at: new Date().toISOString(),
        model: initialResponse?.source.source ?? "shortlist_engine",
      },
      detail: {},
      analysis_version: 1,
      stale: false,
      recompute_required: false,
      stale_reason: null,
      input_hash: "shortlist",
      assumptions: [],
    },
    analysis_version: 1,
    stale: false,
    recompute_required: false,
    stale_reason: null,
    cached: true,
    model: initialResponse?.source.source ?? null,
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 flex items-center justify-between gap-4">
        <PageHeader
          eyebrow="01 · Country comparison"
          title="Pick your shortlist. We rank it."
          description="Drop 2–5 countries in. Tune what matters most. The board re-ranks instantly and tells you what would have to change for a different country to win."
          intentFraming={framingFor("country", intent)}
        />
        <Link href="/app/jobs" className="text-[13px] text-ink-600 underline-offset-4 hover:underline">
          Next: Job fit →
        </Link>
      </div>
      <EnvelopeMeta row={fauxRow as never} />

      <div className="mt-6">
        <CountryDecisionBoard
          initialShortlist={initialShortlist}
          initialResponse={initialResponse}
          initialWeights={initialWeights}
        />
      </div>
    </div>
  );
}
