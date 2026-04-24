import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Sparkles, ArrowUpRight, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Finance" };

const corridors = [
  { r: "IN → DE", gross: "€85k",  net: "€4,280", rent: "€1,340", savings: "€1,620", top: true },
  { r: "IN → NL", gross: "€95k",  net: "€5,100", rent: "€1,720", savings: "€1,890" },
  { r: "IN → PT", gross: "€65k",  net: "€3,420", rent: "€980",   savings: "€1,210" },
];

const breakdown = [
  { l: "Housing (family flat, Prenzlauer Berg)", v: "€1,340", pct: 31 },
  { l: "Health insurance (family)",              v: "€480",   pct: 11 },
  { l: "Groceries + dining",                     v: "€720",   pct: 17 },
  { l: "Transport (BVG family pass)",            v: "€110",   pct: 3  },
  { l: "School (Ananya — international)",        v: "€0",     pct: 0  },
  { l: "Discretionary",                          v: "€500",   pct: 12 },
  { l: "Saved",                                  v: "€1,620", pct: 38 },
];

const years = [8, 16, 28, 44, 62];

export default function FinancePage() {
  const max = Math.max(...years);
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Finance</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            The numbers of your move, <br className="hidden md:block" /> honestly.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Tax, cost of living, FX, savings. Grounded answers for your situation.
          </p>
        </div>
        <Link href="/salary" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 pl-5 pr-4 text-[13.5px] font-medium text-parchment hover:bg-ink-800">
          <TrendingUp className="h-4 w-4" /> Open salary simulator
        </Link>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Headline n="€4,280" l="Take-home" sub="/ month in Berlin" tone="ink" />
        <Headline n="€1,620" l="Monthly savings" sub="After rent + essentials" tone="gilt" />
        <Headline n="36%" l="Effective tax" sub="Including social" />
        <Headline n="+8%" l="FX impact" sub="vs your current currency" />
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Compare corridors</span>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <div className="hidden grid-cols-5 gap-0 border-b border-ink-100 bg-parchment px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
            <span>Route</span>
            <span>Gross</span>
            <span>Net / mo</span>
            <span>Rent</span>
            <span className="text-right">Saved</span>
          </div>
          {corridors.map((c, i) => (
            <div key={i} className={`grid gap-2 px-6 py-4 md:grid-cols-5 md:items-center md:py-5 ${i < corridors.length - 1 ? "border-b border-ink-100" : ""} ${c.top ? "bg-gilt-50/60" : ""}`}>
              <div className="flex items-center justify-between md:block">
                <span className="font-mono text-[13px] font-semibold text-ink-900">{c.r}</span>
                {c.top ? <span className="rounded-full bg-gilt-500 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white md:ml-3">Top fit</span> : null}
              </div>
              <Cell mLabel="Gross" v={c.gross} />
              <Cell mLabel="Net" v={c.net} strong />
              <Cell mLabel="Rent" v={c.rent} />
              <Cell mLabel="Saved" v={c.savings} tone={c.top ? "gilt" : undefined} strong right />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Monthly breakdown · Berlin</p>
          <h3 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Where the money goes</h3>
          <ul className="mt-6 space-y-4 text-[13.5px]">
            {breakdown.map((row, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-700">{row.l}</span>
                  <span className="font-sans text-[15px] font-semibold text-ink-900">{row.v}</span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full ${row.l === "Saved" ? "bg-gilt-500" : "bg-ink-900"}`} style={{ width: `${row.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-ink-900 p-6 text-parchment md:p-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">5-year outlook</p>
          <h3 className="mt-2 font-sans text-[22px] font-semibold tracking-tight">Savings trajectory</h3>
          <div className="mt-8 flex items-end justify-between gap-2 h-[160px]">
            {years.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-gradient-to-t from-gilt-500 to-gilt-300" style={{ height: `${(h / max) * 140}px` }} />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/45">Y{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-2 border-t border-white/10 pt-5 text-[13px]">
            <p className="flex items-center gap-2 text-white/80">
              <Banknote className="h-4 w-4 text-gilt-300" /> <strong className="text-parchment">€97,200</strong> saved over 5 years
            </p>
            <p className="text-[12px] text-white/45">Assumes 2% rent growth, 3% salary growth</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-gilt-50 border border-gilt-200 p-10 md:p-12">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink-900">
              Run the numbers with your real offer.
            </h3>
            <p className="mt-2 max-w-lg text-[14px] text-ink-700 leading-[1.6]">
              Update your Twin with your actual salary and Glimmora recalculates every line.
            </p>
          </div>
          <Link href="/app/profile" className="btn-primary inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
            Update Twin <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Headline({ n, l, sub, tone }: { n: string; l: string; sub: string; tone?: "ink" | "gilt" }) {
  if (tone === "ink") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 text-parchment">
        <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gilt-500/20 blur-[50px]" />
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">{l}</p>
        <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em]">{n}</p>
        <p className="mt-2 text-[12px] text-white/60">{sub}</p>
      </div>
    );
  }
  if (tone === "gilt") {
    return (
      <div className="rounded-2xl border border-gilt-200 bg-gilt-50 p-5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">{l}</p>
        <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
        <p className="mt-2 text-[12px] text-ink-700">{sub}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{l}</p>
      <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-500">{sub}</p>
    </div>
  );
}

function Cell({ mLabel, v, strong, right, tone }: { mLabel: string; v: string; strong?: boolean; right?: boolean; tone?: "gilt" }) {
  return (
    <div className={`flex items-center justify-between md:block ${right ? "md:text-right" : ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">{mLabel}</span>
      <span className={`font-sans ${strong ? "text-[15px] font-semibold" : "text-[14px] font-medium"} ${tone === "gilt" ? "text-gilt-800" : "text-ink-900"}`}>{v}</span>
    </div>
  );
}
