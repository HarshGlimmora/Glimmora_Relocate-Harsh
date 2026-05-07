"use client";

import * as React from "react";
import {
  ConfidenceDot,
  DeltaPill,
  FingerprintBadge,
  RankBadge,
  ScoreStrip,
  WeightSlider,
} from "@/components/country/visual";
import {
  LineChart,
  MultiBarRow,
  RadarChart,
  ThresholdBar,
} from "@/components/country/charts";
import { COUNTRIES, countryName } from "@/lib/countries";
import {
  SHORTLIST_MAX,
  type ShortlistComparisonSeries,
  type ShortlistDimensionWinner,
  type ShortlistRankedCountry,
  type ShortlistResponse,
  type ShortlistSwitchabilityRow,
  type ShortlistWeights,
} from "@/lib/backend/types";
import {
  persistShortlistAction,
  runShortlistAction,
} from "./shortlist-actions";

type Lever = "career" | "cost" | "family" | "lifestyle" | "speed";

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
  // Cap initial shortlist at SHORTLIST_MAX in case page-helpers seeded more.
  const seededShortlist = React.useMemo(
    () => initialShortlist.slice(0, SHORTLIST_MAX),
    [initialShortlist],
  );
  const [shortlist, setShortlist] = React.useState<string[]>(seededShortlist);
  const [weights, setWeights] = React.useState<ShortlistWeights>(initialWeights);
  const [response, setResponse] = React.useState<ShortlistResponse | null>(
    initialResponse,
  );
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [shortlistMessage, setShortlistMessage] = React.useState<string | null>(
    null,
  );
  const [expandedCode, setExpandedCode] = React.useState<string | null>(null);

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
    setShortlistMessage(null);
    if (expandedCode === code) setExpandedCode(null);
  }

  function addCountry(code: string) {
    if (shortlist.includes(code)) return;
    if (shortlist.length >= SHORTLIST_MAX) {
      setShortlistMessage(
        `Shortlist is capped at ${SHORTLIST_MAX} countries — remove one to add a new one.`,
      );
      return;
    }
    setShortlist((c) => [...c, code]);
    setShortlistMessage(null);
    setAdding(false);
  }

  async function pinShortlist() {
    setError(null);
    if (response) {
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

  function toggleExpanded(code: string) {
    setExpandedCode((cur) => (cur === code ? null : code));
  }

  return (
    <div className="space-y-5" data-country-decision-board>
      <ShortlistRow
        codes={shortlist}
        onRemove={removeCountry}
        onAddRequested={() => {
          if (shortlist.length >= SHORTLIST_MAX) {
            setShortlistMessage(
              `Shortlist is capped at ${SHORTLIST_MAX} countries — remove one to add a new one.`,
            );
            return;
          }
          setShortlistMessage(null);
          setAdding((v) => !v);
        }}
        addOpen={adding}
        message={shortlistMessage}
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
          <RankingBoard
            ranked={response.countries}
            expandedCode={expandedCode}
            onToggle={toggleExpanded}
          />
          <ComparisonChart
            dimensionLabels={response.dimension_labels}
            series={response.comparison_series}
          />
          <DimensionWinnersPanel winners={response.dimension_winners} />
          <SwitchabilityPanel
            counterfactuals={response.counterfactuals}
            switchability={response.switchability}
          />
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
  message,
}: {
  codes: string[];
  onRemove: (code: string) => void;
  onAddRequested: () => void;
  addOpen: boolean;
  message: string | null;
}) {
  const atCap = codes.length >= SHORTLIST_MAX;
  return (
    <section
      data-country-shortlist
      data-shortlist-cap={SHORTLIST_MAX}
      data-shortlist-at-cap={atCap ? "true" : "false"}
      className="rounded-2xl border border-ink-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Shortlist · {codes.length}/{SHORTLIST_MAX}
        </p>
        <button
          type="button"
          onClick={onAddRequested}
          data-add-country
          aria-disabled={atCap && !addOpen}
          className={
            "rounded-full border px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] " +
            (atCap && !addOpen
              ? "cursor-not-allowed border-ink-200 text-ink-400"
              : "border-ink-200 text-ink-700 hover:border-ink-400")
          }
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
                data-shortlist-remove={code}
                className="font-mono text-[11px] text-ink-500 hover:text-danger-600"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {message ? (
        <p
          data-shortlist-message
          className="mt-2 rounded-md bg-gilt-50 px-2 py-1 font-mono text-[10.5px] text-gilt-900"
        >
          {message}
        </p>
      ) : null}
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
  const atCap = existing.length >= SHORTLIST_MAX;
  return (
    <section
      data-add-country-grid
      className="rounded-2xl border border-ink-200 bg-white p-3"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
        {options.map((c) => {
          const disabled = existing.includes(c.code) || atCap;
          return (
            <button
              key={c.code}
              type="button"
              disabled={disabled}
              onClick={() => onPick(c.code)}
              data-add-option={c.code}
              data-add-option-disabled={disabled ? "true" : "false"}
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

function RankingBoard({
  ranked,
  expandedCode,
  onToggle,
}: {
  ranked: ShortlistRankedCountry[];
  expandedCode: string | null;
  onToggle: (code: string) => void;
}) {
  return (
    <section data-ranking-board>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Ranking · click any country to drill in
      </p>
      <ul className="space-y-2">
        {ranked.map((c) => {
          const expanded = expandedCode === c.code;
          return (
            <li
              key={c.code}
              data-ranked-country={c.code}
              data-rank={c.rank}
              data-expanded={expanded ? "true" : "false"}
              className={
                "rounded-2xl border-2 " +
                (c.rank === 1
                  ? "border-ink-900 bg-parchment/40"
                  : "border-ink-200 bg-white")
              }
            >
              <button
                type="button"
                onClick={() => onToggle(c.code)}
                aria-expanded={expanded}
                data-country-toggle={c.code}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
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
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {expanded ? "Hide drilldown ↑" : "Drill down ↓"}
                    </span>
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
              </button>
              {expanded ? <CountryDrilldownPanel ranked={c} ranking={ranked} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- Country drilldown ---------------------------------------------------

function CountryDrilldownPanel({
  ranked,
  ranking,
}: {
  ranked: ShortlistRankedCountry[][number];
  ranking: ShortlistRankedCountry[];
}) {
  const d = ranked.drilldown;
  const sensCurves = d.sensitivity_curves;
  const xLabels = sensCurves[0]?.points.map((p) => `${Math.round(p.weight * 100)}%`) ?? [];
  return (
    <section
      data-country-drilldown={ranked.code}
      className="border-t border-ink-200 px-4 pb-4 pt-3"
    >
      <p
        data-drilldown-summary
        className="mb-3 text-[13px] leading-[1.5] text-ink-800"
      >
        {d.summary_one_line}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div data-drilldown-block="composition">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Score composition
          </p>
          <RadarChart
            testid={`composition-${ranked.code}`}
            axes={["Career", "Cost", "Family", "Lifestyle", "Speed", "Visa"]}
            values={[
              d.lever_scores.career,
              d.lever_scores.cost,
              d.lever_scores.family,
              d.lever_scores.lifestyle,
              d.lever_scores.speed,
              d.lever_scores.visa,
            ]}
            caption={`${ranked.name} across the 6 lever axes`}
          />
        </div>

        <div data-drilldown-block="sensitivity">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Score sensitivity · how the score moves as a lever&apos;s weight sweeps 0→100%
          </p>
          <LineChart
            testid={`sensitivity-${ranked.code}`}
            xLabels={xLabels}
            yMin={0}
            yMax={100}
            yAxisLabel="Score"
            xAxisLabel="Lever weight share"
            series={sensCurves.map((c) => {
              const crossIdx =
                c.crossover_weight == null
                  ? null
                  : c.points.findIndex(
                      (p) => Math.abs(p.weight - (c.crossover_weight ?? -1)) < 1e-3,
                    );
              return {
                label: c.lever,
                values: c.points.map((p) => p.score),
                highlightX: crossIdx == null || crossIdx < 0 ? null : crossIdx,
              };
            })}
            caption={ranked.name}
          />
        </div>

        <div data-drilldown-block="components" className="md:col-span-2">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            What drives the weighted score
          </p>
          <MultiBarRow
            testid={`components-${ranked.code}`}
            rows={d.score_components.map((c) => ({
              label: `${capitalize(c.lever)} · raw ${c.raw_score} × w ${(c.weight * 100).toFixed(0)}%`,
              value: c.contribution,
            }))}
            max={Math.max(40, ...d.score_components.map((c) => c.contribution))}
          />
        </div>

        <div data-drilldown-block="comparison" className="md:col-span-2">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Compared to the rest of the shortlist
          </p>
          <LineChart
            testid={`comparison-${ranked.code}`}
            xLabels={ranking.map((r) => r.name)}
            yMin={0}
            yMax={100}
            yAxisLabel="Lever score"
            series={[
              {
                label: "Career",
                values: ranking.map((r) => r.lever_scores.career),
              },
              {
                label: "Cost",
                values: ranking.map((r) => r.lever_scores.cost),
              },
              {
                label: "Family",
                values: ranking.map((r) => r.lever_scores.family),
              },
              {
                label: "Speed",
                values: ranking.map((r) => r.lever_scores.speed),
              },
            ]}
            caption="lever score by country"
          />
        </div>

        {d.transition_curve.length ? (
          <div data-drilldown-block="transition" className="md:col-span-2">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Origin → {ranked.name} · what shifts in your day-to-day
            </p>
            <LineChart
              testid={`transition-${ranked.code}`}
              xLabels={d.transition_curve.map((p) => p.metric)}
              yMin={0}
              yMax={100}
              yAxisLabel="Score"
              series={[
                {
                  label: "Origin",
                  values: d.transition_curve.map((p) => p.origin),
                },
                {
                  label: ranked.name,
                  values: d.transition_curve.map((p) => p.destination),
                },
              ]}
              caption="0–100 across each metric"
            />
          </div>
        ) : null}

        {d.rank_change_thresholds.length ? (
          <div data-drilldown-block="thresholds" className="md:col-span-2">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              What would move {ranked.name} up the ranking?
            </p>
            <ul className="space-y-1.5">
              {d.rank_change_thresholds.map((t, i) => (
                <li
                  key={i}
                  data-rank-threshold={t.lever}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-white p-2.5"
                >
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                    {t.lever}
                  </span>
                  <ThresholdBar
                    threshold_pct={t.threshold_pct}
                    direction={t.direction}
                  />
                  <span className="text-[12px] text-ink-700">{t.one_line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ---- Cross-shortlist comparison line chart -------------------------------

function ComparisonChart({
  dimensionLabels,
  series,
}: {
  dimensionLabels: string[];
  series: ShortlistComparisonSeries[];
}) {
  if (series.length === 0) return null;
  return (
    <section data-comparison-chart>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Country comparison · all dimensions, side by side
      </p>
      <LineChart
        testid="cross-shortlist"
        xLabels={dimensionLabels}
        yMin={0}
        yMax={100}
        yAxisLabel="Score"
        series={series.map((s) => ({ label: s.name, values: s.values }))}
        caption="curated 2026-Q1 dataset"
      />
    </section>
  );
}

// ---- Dimension winners (who-wins-on-what, with parameter reasoning) ----

function DimensionWinnersPanel({
  winners,
}: {
  winners: ShortlistDimensionWinner[];
}) {
  const [openDim, setOpenDim] = React.useState<string | null>(null);
  return (
    <section data-dimension-winners>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Who wins on what · click a row for the parameters and reasoning
      </p>
      <ul className="grid gap-2 md:grid-cols-2">
        {winners.map((w) => {
          const open = openDim === w.dimension;
          return (
            <li
              key={w.dimension}
              data-dimension-row={w.dimension}
              data-dimension-open={open ? "true" : "false"}
              className="rounded-xl border border-ink-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenDim(open ? null : w.dimension)}
                aria-expanded={open}
                data-dimension-toggle={w.dimension}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    {w.label}
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold text-ink-900">
                    {w.winner_name}
                  </p>
                  <p className="font-mono text-[11px] tabular-nums text-ink-600">
                    {w.winning_score}/100
                    {w.margin > 0 && w.runner_up_name ? (
                      <span className="text-ink-400">
                        {" "}
                        · +{w.margin} ahead of {w.runner_up_name}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  {open ? "Hide ↑" : "Why? ↓"}
                </span>
              </button>
              {open ? <DimensionDrilldown winner={w} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DimensionDrilldown({ winner }: { winner: ShortlistDimensionWinner }) {
  return (
    <div
      data-dimension-drilldown={winner.dimension}
      className="border-t border-ink-200 px-3 pb-3 pt-2.5"
    >
      <p className="mb-2 text-[12.5px] leading-[1.4] text-ink-800">
        {winner.reason_one_line}
      </p>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Per-country score on {winner.label.toLowerCase()}
      </p>
      <MultiBarRow
        testid={`dim-${winner.dimension}`}
        rows={winner.series.map((s) => ({
          label: s.name,
          value: s.score,
          highlighted: s.code === winner.winner_code,
        }))}
      />

      <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Underlying parameters
      </p>
      <ul className="space-y-2">
        {winner.contributing_metrics.map((m) => (
          <li
            key={m.metric_key}
            data-dimension-metric={m.metric_key}
            className="rounded-lg bg-ink-50/60 p-2"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-medium text-ink-800">
                {m.metric_label}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink-500">
                weight {(m.weight * 100).toFixed(0)}%
              </span>
            </div>
            <MultiBarRow
              testid={`dim-metric-${m.metric_key}`}
              rows={m.series.map((s) => ({
                label: s.name,
                value: s.score,
                highlighted: s.code === winner.winner_code,
              }))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Switchability panel (the unique feature) ---------------------------

function SwitchabilityPanel({
  counterfactuals,
  switchability,
}: {
  counterfactuals: ShortlistResponse["counterfactuals"];
  switchability: ShortlistSwitchabilityRow[];
}) {
  const [showMatrix, setShowMatrix] = React.useState(false);

  // Group switchability rows by challenger.
  const byChallenger = React.useMemo(() => {
    const groups: Record<
      string,
      { challenger_name: string; over_name: string; rows: ShortlistSwitchabilityRow[] }
    > = {};
    for (const row of switchability) {
      groups[row.challenger_code] ||= {
        challenger_name: row.challenger_name,
        over_name: row.over_name,
        rows: [],
      };
      groups[row.challenger_code].rows.push(row);
    }
    return groups;
  }, [switchability]);

  return (
    <section data-switchability>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Switchability · what would have to change for another country to win
        </p>
        {switchability.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowMatrix((v) => !v)}
            data-switchability-toggle
            className="rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            {showMatrix ? "Hide full matrix" : "Show full matrix"}
          </button>
        ) : null}
      </div>

      {/* Headlines: the smallest-flip counterfactual per challenger. */}
      {counterfactuals.length === 0 ? (
        <p
          data-counterfactual-empty
          className="rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
        >
          The current top pick is robust to any single-lever weight shift.
        </p>
      ) : (
        <ul data-counterfactuals className="space-y-1.5">
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

      {showMatrix && switchability.length > 0 ? (
        <div
          data-switchability-matrix
          className="mt-3 space-y-3 rounded-2xl border border-ink-200 bg-white p-3"
        >
          {Object.entries(byChallenger).map(([code, g]) => (
            <div key={code} data-switchability-challenger={code}>
              <p className="mb-1.5 text-[12.5px] font-medium text-ink-900">
                For {g.challenger_name} to overtake {g.over_name}
              </p>
              <ul className="space-y-1">
                {g.rows.map((r) => (
                  <li
                    key={r.lever}
                    data-switchability-row={r.lever}
                    className="flex flex-wrap items-center gap-3 rounded-lg bg-ink-50/60 p-2"
                  >
                    <span className="w-24 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
                      {r.lever}
                    </span>
                    <ThresholdBar
                      threshold_pct={r.threshold_pct}
                      direction={r.direction}
                    />
                    <span className="flex-1 text-[12px] text-ink-700">
                      {r.one_line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
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

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
