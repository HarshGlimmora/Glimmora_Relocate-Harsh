"use client";

import * as React from "react";
import {
  ConfidenceDot,
  DeltaPill,
  FingerprintBadge,
  RankBadge,
  ScoreBar,
  ScoreStrip,
  WeightSlider,
} from "@/components/country/visual";
import { COUNTRIES, countryName } from "@/lib/countries";
import type {
  ShortlistRankedCountry,
  ShortlistResponse,
  ShortlistWeights,
} from "@/lib/backend/types";
import {
  persistShortlistAction,
  runShortlistAction,
} from "./shortlist-actions";

type Lever = "career" | "cost" | "family" | "lifestyle" | "speed";

const DEFAULT_WEIGHTS: ShortlistWeights = {
  career: 3,
  cost: 3,
  family: 3,
  lifestyle: 3,
  speed: 3,
};

const ADD_OPTIONS = COUNTRIES.filter((c) =>
  ["DE", "NL", "IE", "GB", "FR", "ES", "PT", "IT", "SE", "CH", "EE",
   "CA", "US", "AU", "NZ", "AE", "QA", "SA", "IL", "SG", "JP", "KR",
   "HK", "MY"].includes(c.code),
);

export function CountryDecisionBoard({
  initialShortlist,
  initialResponse,
  initialWeights,
}: {
  initialShortlist: string[];
  initialResponse: ShortlistResponse | null;
  initialWeights: ShortlistWeights;
}) {
  const [shortlist, setShortlist] = React.useState<string[]>(initialShortlist);
  const [weights, setWeights] = React.useState<ShortlistWeights>(initialWeights);
  const [response, setResponse] = React.useState<ShortlistResponse | null>(
    initialResponse,
  );
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  // Re-rank on any weight change. Debounce is unnecessary — backend is
  // deterministic and sub-50ms.
  React.useEffect(() => {
    if (shortlist.length < 2) return;
    setError(null);
    start(async () => {
      const r = await runShortlistAction({ countries: shortlist, weights });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResponse(r.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlist.join(","), weights.career, weights.cost, weights.family, weights.lifestyle, weights.speed]);

  function setLever(l: Lever, v: number) {
    setWeights((w) => ({ ...w, [l]: v }));
  }

  function removeCountry(code: string) {
    if (shortlist.length <= 2) return;
    setShortlist((c) => c.filter((x) => x !== code));
  }

  function addCountry(code: string) {
    if (shortlist.includes(code) || shortlist.length >= 5) return;
    setShortlist((c) => [...c, code]);
    setAdding(false);
  }

  async function pinShortlist() {
    setError(null);
    if (response) {
      // Persist with the winner first so target_country is the top pick.
      const ordered = [
        response.countries[0].code,
        ...response.countries.slice(1).map((c) => c.code),
      ];
      const r = await persistShortlistAction({
        countries: ordered,
        weights,
      });
      if (!r.ok) setError(r.error);
    }
  }

  return (
    <div className="space-y-5" data-country-decision-board>
      <ShortlistRow
        codes={shortlist}
        onRemove={removeCountry}
        onAddRequested={() => setAdding((v) => !v)}
        addOpen={adding}
      />
      {adding ? (
        <AddCountryGrid
          existing={shortlist}
          options={ADD_OPTIONS.map((c) => ({ code: c.code, name: c.name }))}
          onPick={addCountry}
        />
      ) : null}

      <WeightsRow weights={weights} onSet={setLever} pending={pending} />

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[12.5px] text-danger-800">
          {error}
        </div>
      ) : null}

      {response ? (
        <>
          <FingerprintBadge
            style={response.fingerprint.style}
            label={response.fingerprint.label}
            oneLine={response.fingerprint.one_line}
            weights={response.fingerprint.weight_distribution}
          />
          <RankingBoard ranked={response.countries} />
          <CategoryWinnersBar winners={response.category_winners} />
          <CounterfactualBoard counterfactuals={response.counterfactuals} />
          {response.transitions.length ? (
            <TransitionBoard transitions={response.transitions} />
          ) : null}
          <FinalCard
            final={response.final}
            sourceMeta={response.source}
            assumptions={response.assumptions}
            onPin={pinShortlist}
            pending={pending}
          />
        </>
      ) : pending ? (
        <p className="text-[13px] text-ink-500">Scoring shortlist…</p>
      ) : null}
    </div>
  );
}

// ---- Sub-components ------------------------------------------------------

function ShortlistRow({
  codes,
  onRemove,
  onAddRequested,
  addOpen,
}: {
  codes: string[];
  onRemove: (code: string) => void;
  onAddRequested: () => void;
  addOpen: boolean;
}) {
  return (
    <section
      data-country-shortlist
      className="rounded-2xl border border-ink-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Shortlist · {codes.length}/5
        </p>
        <button
          type="button"
          onClick={onAddRequested}
          disabled={codes.length >= 5}
          data-add-country
          className="rounded-full border border-ink-200 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400 disabled:opacity-50"
        >
          {addOpen ? "Cancel" : "+ Add country"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {codes.map((code) => (
          <span
            key={code}
            data-shortlist-code={code}
            className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-parchment/40 px-3 py-1 text-[12.5px] text-ink-900"
          >
            <span>{countryName(code)}</span>
            {codes.length > 2 ? (
              <button
                type="button"
                onClick={() => onRemove(code)}
                aria-label={`Remove ${countryName(code)}`}
                className="font-mono text-[11px] text-ink-500 hover:text-danger-600"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}

function AddCountryGrid({
  options,
  existing,
  onPick,
}: {
  options: { code: string; name: string }[];
  existing: string[];
  onPick: (code: string) => void;
}) {
  return (
    <section
      data-add-country-grid
      className="rounded-2xl border border-ink-200 bg-white p-3"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
        {options.map((c) => {
          const disabled = existing.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              disabled={disabled}
              onClick={() => onPick(c.code)}
              data-add-option={c.code}
              className={
                "rounded-full border px-3 py-1 text-[12px] " +
                (disabled
                  ? "border-ink-100 bg-ink-50 text-ink-400"
                  : "border-ink-200 bg-white text-ink-800 hover:border-ink-400")
              }
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeightsRow({
  weights,
  onSet,
  pending,
}: {
  weights: ShortlistWeights;
  onSet: (l: Lever, v: number) => void;
  pending?: boolean;
}) {
  return (
    <section data-weights-row data-module-panel="country">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          What matters most? · the ranking shifts as you tune these
        </p>
        <button
          type="button"
          data-panel-apply
          data-panel-status={pending ? "pending" : "applied"}
          // Recomputation runs automatically on every change; the button
          // re-asserts the same effect for explicit user / Playwright triggers.
          onClick={() => onSet("career", weights.career)}
          className="rounded-full bg-ink-900 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-parchment hover:bg-ink-800 disabled:opacity-50"
          disabled={pending}
        >
          {pending ? "Re-ranking…" : "Re-rank"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        <WeightSlider testid="career" label="Career" value={weights.career} onChange={(v) => onSet("career", v)} />
        <WeightSlider testid="cost" label="Cost" value={weights.cost} onChange={(v) => onSet("cost", v)} />
        <WeightSlider testid="family" label="Family" value={weights.family} onChange={(v) => onSet("family", v)} />
        <WeightSlider testid="lifestyle" label="Lifestyle" value={weights.lifestyle} onChange={(v) => onSet("lifestyle", v)} />
        <WeightSlider testid="speed" label="Speed" value={weights.speed} onChange={(v) => onSet("speed", v)} />
      </div>
    </section>
  );
}

function RankingBoard({ ranked }: { ranked: ShortlistRankedCountry[] }) {
  return (
    <section data-ranking-board>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Ranking
      </p>
      <ul className="space-y-2">
        {ranked.map((c) => (
          <li
            key={c.code}
            data-ranked-country={c.code}
            data-rank={c.rank}
            className={
              "rounded-2xl border-2 p-4 " +
              (c.rank === 1
                ? "border-ink-900 bg-parchment/40"
                : "border-ink-200 bg-white")
            }
          >
            <div className="flex items-start gap-3">
              <RankBadge rank={c.rank} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink-900">
                    {c.name}
                  </p>
                  <span className="font-mono text-[12px] tabular-nums text-ink-700">
                    {c.weighted_score}/100
                  </span>
                  <ConfidenceDot value={c.confidence} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px]">
                  <span className="text-ink-700">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success-700">strength </span>
                    {c.top_strength}
                  </span>
                  <span className="text-ink-700">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700">risk </span>
                    {c.top_risk}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreStrip
                    breakdown={c.breakdown as unknown as Record<string, number>}
                    testid={c.code}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryWinnersBar({
  winners,
}: {
  winners: { category: string; winner_name: string; winning_score: number; margin: number }[];
}) {
  return (
    <section data-category-winners>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Who wins on what
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {winners.map((w) => (
          <div
            key={w.category}
            data-category-row={w.category}
            className="rounded-xl border border-ink-200 bg-white p-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              {w.category}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-ink-900">
              {w.winner_name}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-ink-600">
              {w.winning_score}/100
              {w.margin > 0 ? <span className="text-ink-400"> · +{w.margin} ahead</span> : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CounterfactualBoard({
  counterfactuals,
}: {
  counterfactuals: ShortlistResponse["counterfactuals"];
}) {
  return (
    <section data-counterfactuals>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        What would change the result?
      </p>
      {counterfactuals.length === 0 ? (
        <p
          data-counterfactual-empty
          className="rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
        >
          The current top pick is robust to small weight shifts.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {counterfactuals.map((cf, i) => (
            <li
              key={i}
              data-counterfactual={i}
              data-cf-lever={cf.lever}
              data-cf-direction={cf.direction}
              className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3"
            >
              <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                {cf.lever}
              </span>
              <p className="flex-1 text-[13px] leading-[1.4] text-ink-800">
                {cf.one_line}
              </p>
              <span
                data-cf-threshold={cf.threshold_pct}
                className="font-mono text-[10.5px] tabular-nums text-ink-500"
              >
                {cf.direction === "increase" ? "+" : "−"}
                {cf.threshold_pct}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TransitionBoard({
  transitions,
}: {
  transitions: ShortlistResponse["transitions"];
}) {
  return (
    <section data-transitions>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Origin → destination · what changes
      </p>
      <ul className="space-y-2">
        {transitions.map((t) => (
          <li
            key={t.destination_code}
            data-transition={t.destination_code}
            className="rounded-xl border border-ink-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-[13.5px] font-semibold text-ink-900">
                {t.origin_name} <span className="text-ink-400">→</span>{" "}
                {t.destination_name}
              </p>
              <span className="font-mono text-[10.5px] text-success-700">{t.headline_gain}</span>
              <span className="font-mono text-[10.5px] text-danger-700">{t.headline_loss}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.deltas
                .filter((d) => Math.abs(d.delta) > 4)
                .slice(0, 8)
                .map((d) => (
                  <DeltaPill key={d.metric} delta={d.delta} metric={d.metric} />
                ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinalCard({
  final,
  sourceMeta,
  assumptions,
  onPin,
  pending,
}: {
  final: ShortlistResponse["final"];
  sourceMeta: ShortlistResponse["source"];
  assumptions: string[];
  onPin: () => Promise<void> | void;
  pending: boolean;
}) {
  const [pinning, start] = React.useTransition();
  const [pinned, setPinned] = React.useState(false);
  return (
    <section
      data-final-recommendation
      data-value-lead
      data-emphasis="good"
      className="rounded-2xl border-2 border-ink-900 bg-ink-900 p-5 text-parchment"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-300">
        Recommended next step
      </p>
      <p className="mt-2 text-[22px] font-semibold tracking-[-0.01em]">
        {final.winner_name}
      </p>
      <p className="mt-1 text-[13px] leading-[1.5] text-white/80">
        {final.why_one_line}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={final.next_action_href}
          data-final-cta
          className="rounded-full bg-parchment px-4 py-2 text-[13px] font-medium text-ink-900 hover:bg-white"
        >
          {final.next_action_label} →
        </a>
        <button
          type="button"
          onClick={() => {
            start(async () => {
              await onPin();
              setPinned(true);
            });
          }}
          disabled={pinning || pending}
          data-pin-shortlist
          className="rounded-full border border-white/30 px-4 py-2 text-[12.5px] text-parchment hover:border-white/60 disabled:opacity-50"
        >
          {pinned ? "Saved to profile" : pinning ? "Saving…" : "Save shortlist to profile"}
        </button>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
          {sourceMeta.source} · {sourceMeta.last_updated} · {sourceMeta.availability}
        </span>
      </div>
      {assumptions.length ? (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
            Assumptions ({assumptions.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[12px] text-white/80">
            {assumptions.map((a, i) => (
              <li key={i}>· {a}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
