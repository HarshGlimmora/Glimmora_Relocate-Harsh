"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import { COUNTRIES, type CountryData } from "@/lib/public-data/countries";

type SortKey = "techJobsIndex" | "effectiveTaxPct" | "rentMedianEUR" | "medianSalaryEUR" | "costOfLivingIndex";

const sortLabels: Record<SortKey, string> = {
  techJobsIndex: "Best tech job market",
  medianSalaryEUR: "Highest salary",
  effectiveTaxPct: "Lowest tax",
  rentMedianEUR: "Lowest rent",
  costOfLivingIndex: "Cheapest overall",
};

const filters: Array<{ key: "all" | "english" | "family" | "fastVisa" | "affordable"; label: string; test: (c: CountryData) => boolean }> = [
  { key: "all",       label: "All countries",                test: () => true },
  { key: "english",   label: "English at work",              test: (c) => c.englishAtWork === "widely" },
  { key: "family",    label: "Great for families",           test: (c) => c.familyFriendly >= 5 },
  { key: "fastVisa",  label: "Fast visa (≤4w)",              test: (c) => /^(2-4|3-4|2)/.test(c.visaTurnaround) },
  { key: "affordable",label: "Affordable (CoL <100)",        test: (c) => c.costOfLivingIndex < 100 },
];

export function CompareClient() {
  const [sort, setSort] = React.useState<SortKey>("techJobsIndex");
  const [filter, setFilter] = React.useState<typeof filters[number]["key"]>("all");

  const active = filters.find((f) => f.key === filter)!;
  const list = [...COUNTRIES]
    .filter(active.test)
    .sort((a, b) => {
      // Lower is better for tax / rent / costOfLivingIndex; higher is better for the others
      if (sort === "effectiveTaxPct" || sort === "rentMedianEUR" || sort === "costOfLivingIndex") return a[sort] - b[sort];
      return b[sort] - a[sort];
    });

  return (
    <>
      {/* Controls */}
      <div className="mb-10 rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Sort by</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(sortLabels) as SortKey[]).map((k) => {
                const on = sort === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSort(k)}
                    className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                      on ? "border-ink-900 bg-ink-900 text-parchment" : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    {sortLabels[k]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-10 w-px bg-ink-200 hidden md:block" />
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Filter</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.map((f) => {
                const on = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                      on ? "border-gilt-500 bg-gilt-50 text-gilt-900" : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <p className="font-sans text-[15px] font-semibold text-ink-900">No countries match that filter.</p>
          <p className="mt-1 text-[12.5px] text-ink-500">Try removing a filter or changing the sort.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((c, i) => (
            <CountryCard key={c.code} c={c} rank={i + 1} sort={sort} />
          ))}
        </ul>
      )}
    </>
  );
}

function CountryCard({ c, rank, sort }: { c: CountryData; rank: number; sort: SortKey }) {
  const sym = c.medianSalaryEUR.toLocaleString("en-GB");
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-6 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none">{c.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-[22px] font-semibold tracking-tight text-ink-900">{c.name}</h3>
              {rank <= 3 && sort === "techJobsIndex" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gilt-50 border border-gilt-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
                  <Star className="h-2.5 w-2.5 fill-gilt-500 text-gilt-500" /> #{rank} pick
                </span>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
              {c.capital} · {c.visaRoute}
            </p>
          </div>
        </div>
        <Link
          href={`/sign-up?target=${c.code}`}
          aria-label={`Plan a move to ${c.name}`}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-ink-200 bg-white px-3 text-[12px] font-medium text-ink-800 hover:border-ink-900 shrink-0"
        >
          Plan move <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-ink-100 pt-4 text-[12.5px]">
        <Stat label="Median salary" value={`€${sym}`} sub="for your role band" />
        <Stat label="Effective tax" value={`${c.effectiveTaxPct}%`} sub="at median" />
        <Stat label="Rent (1BR)" value={`€${c.rentMedianEUR}/mo`} sub="city center" />
      </dl>

      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-ink-100 pt-4 text-[12.5px]">
        <Stat label="Visa turnaround" value={c.visaTurnaround} />
        <Stat label="To permanent" value={c.pathToPermanent} />
        <Stat label="Tech job index" value={`${c.techJobsIndex}/100`} sub={sort === "techJobsIndex" && rank <= 3 ? "top tier" : undefined} />
      </dl>

      <div className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-[13px]">
        <p className="inline-flex items-start gap-2 text-ink-700">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 text-lagoon-600 shrink-0" />
          <span><strong>Why go:</strong> {c.highlight}</span>
        </p>
        <p className="inline-flex items-start gap-2 text-ink-600">
          <span className="mt-0.5 inline-block h-3.5 w-3.5 rounded-full bg-gilt-100 text-gilt-800 text-center text-[10px] leading-[14px] font-semibold shrink-0">!</span>
          <span><strong>Watch out:</strong> {c.watchout}</span>
        </p>
      </div>
    </li>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</dt>
      <dd className="mt-1 font-sans text-[14.5px] font-semibold text-ink-900">{value}</dd>
      {sub ? <p className="mt-0.5 font-mono text-[9.5px] text-ink-400">{sub}</p> : null}
    </div>
  );
}
