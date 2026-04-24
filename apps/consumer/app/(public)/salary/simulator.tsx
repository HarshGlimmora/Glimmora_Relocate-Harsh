"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Home, Utensils, Bus, Wifi } from "lucide-react";
import { COUNTRIES, getCountry, purchasingPowerRatio } from "@/lib/public-data/countries";

// Very rough progressive-tax estimator per country. MOCK — backend replaces with accurate tax engine per jurisdiction + employer NI, etc.
function estimateNet(gross: number, country: string): number {
  const c = getCountry(country);
  if (!c) return gross;
  // Flat approximation at effective rate
  const eff = c.effectiveTaxPct / 100;
  return Math.round(gross * (1 - eff));
}

function money(n: number, currency = "EUR") {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${n.toLocaleString("en-GB")}`;
}

export function SalarySimulator() {
  const [gross, setGross] = React.useState(85000);
  const [fromCountry, setFromCountry] = React.useState("IE");
  const [toCountry, setToCountry] = React.useState("DE");

  const from = getCountry(fromCountry);
  const to = getCountry(toCountry);

  const toNet = estimateNet(gross, toCountry);
  // Adjust net by cost-of-living ratio to show purchasing-power equivalent in "from" country
  const ppr = purchasingPowerRatio(fromCountry, toCountry);
  const purchasingEquivalent = Math.round(toNet * ppr);

  const monthlyRent = to?.rentMedianEUR ?? 0;
  const afterRent = Math.round(toNet / 12 - monthlyRent);
  const savingsPct = afterRent > 0 ? Math.round((afterRent / (toNet / 12)) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Form */}
      <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Your numbers</p>
        <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Punch them in.</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="gross" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Target gross (annual, EUR)</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-ink-200 bg-white shadow-sm focus-within:ring-4 focus-within:border-ink-900 focus-within:ring-ink-900/15">
              <span className="pl-4 font-sans text-[16px] text-ink-500">€</span>
              <input
                id="gross"
                type="number"
                min={20000}
                max={500000}
                step={1000}
                value={gross}
                onChange={(e) => setGross(Math.max(20000, Math.min(500000, parseInt(e.target.value, 10) || 0)))}
                className="flex-1 rounded-xl bg-transparent px-2 py-3 text-[16px] font-sans font-semibold text-ink-900 focus:outline-none"
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-ink-500">Pre-tax. A typical senior engineer in this range.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="from" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">You're coming from</label>
              <select
                id="from"
                value={fromCountry}
                onChange={(e) => setFromCountry(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-900 shadow-sm focus:outline-none focus:ring-4 focus:border-ink-900 focus:ring-ink-900/15"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="to" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Moving to</label>
              <select
                id="to"
                value={toCountry}
                onChange={(e) => setToCountry(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-900 shadow-sm focus:outline-none focus:ring-4 focus:border-ink-900 focus:ring-ink-900/15"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-ink-100 bg-parchment/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Scoring is a mock heuristic</p>
          <p className="mt-1.5 text-[12.5px] text-ink-600 leading-[1.55]">
            Tax uses a flat effective rate per country. Real calculations (expat regimes, 30%-ruling, Beckham law, family status) plug into the production engine at W5.
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="relative overflow-hidden rounded-[28px] bg-ink-900 p-6 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/20 blur-[80px]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-3xl leading-none">{to?.flag}</span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">In {to?.name}</p>
              <p className="mt-0.5 font-sans text-[13px] text-white/70">{to?.capital} · {to?.visaRoute}</p>
            </div>
          </div>

          <p className="mt-6 font-sans text-[clamp(3rem,6vw,4.5rem)] font-semibold leading-none tracking-[-0.035em]">
            {money(toNet)}
          </p>
          <p className="mt-2 text-[13.5px] text-white/65">
            take-home per year · {money(Math.round(toNet / 12))}/month
          </p>

          <div className="mt-6 flex items-baseline gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            {ppr === 1 ? (
              <Minus className="h-5 w-5 text-white/50" />
            ) : ppr > 1 ? (
              <TrendingUp className="h-5 w-5 text-success-300" />
            ) : (
              <TrendingDown className="h-5 w-5 text-danger-200" />
            )}
            <div>
              <p className="font-sans text-[18px] font-semibold">
                {money(purchasingEquivalent)} {from?.flag ?? ""} equivalent
              </p>
              <p className="mt-1 text-[12.5px] text-white/65 leading-[1.5]">
                {ppr > 1
                  ? `Your EUR goes ${Math.round((ppr - 1) * 100)}% further in ${to?.name} than in ${from?.name}.`
                  : ppr < 1
                  ? `Costs are ${Math.round((1 - ppr) * 100)}% higher in ${to?.name} than in ${from?.name}.`
                  : `Cost of living is roughly equivalent between ${from?.name} and ${to?.name}.`}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <Budget Icon={Home}     label="Rent (1BR)"   value={`${money(monthlyRent)}/mo`} />
            <Budget Icon={Utensils} label="Groceries"    value={`${money(Math.round(monthlyRent * 0.25))}/mo`} />
            <Budget Icon={Bus}      label="Transport"    value={`${money(Math.round(monthlyRent * 0.08))}/mo`} />
            <Budget Icon={Wifi}     label="Utilities"    value={`${money(Math.round(monthlyRent * 0.15))}/mo`} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 font-medium">After typical rent</p>
            <p className="mt-2 font-sans text-[22px] font-semibold text-parchment">
              {money(Math.max(0, afterRent))}/month free
            </p>
            <p className="mt-1 text-[12.5px] text-white/65">
              {savingsPct > 35 ? "Strong savings runway" : savingsPct > 20 ? "Comfortable headroom" : "Budget-first lifestyle"}
            </p>
          </div>

          <Link
            href={`/sign-up?target=${toCountry}`}
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white"
          >
            Plan this move <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Budget({ Icon, label, value }: { Icon: typeof Home; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{label}</p>
        <p className="font-sans text-[12.5px] font-semibold text-parchment">{value}</p>
      </div>
    </div>
  );
}
