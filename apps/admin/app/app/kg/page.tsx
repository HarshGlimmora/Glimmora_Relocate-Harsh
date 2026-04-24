import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, Edit3, ShieldCheck, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { COUNTRIES } from "@/lib/kg/countries";

export const metadata: Metadata = { title: "Country KG" };

export default function KgStudioPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Knowledge & Support</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Country Knowledge Graph.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            The source of truth behind every Copilot answer. Visa, tax, cost-of-living, schools — curators here, live everywhere.
          </p>
        </div>
        <Link href="/app/ai-updates" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-800 hover:border-ink-400">
          <Sparkles className="h-4 w-4" /> Review AI updates <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={COUNTRIES.length} l="Countries in KG" sub="live corridors" tone="lagoon" />
        <Kpi n={COUNTRIES.filter((c) => c.englishAtWork === "widely").length} l="English-at-work" sub="primary language" />
        <Kpi n={Math.min(...COUNTRIES.map((c) => c.effectiveTaxPct))} l="Lowest tax %"   sub="effective rate" tone="gilt" />
        <Kpi n={Math.max(...COUNTRIES.map((c) => c.techJobsIndex))}   l="Top tech index" sub="100 = best" />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Country directory" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {COUNTRIES.map((c) => (
            <article key={c.code} className="rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-ink-400">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-[16px] font-semibold tracking-tight text-ink-900">
                    <span className="mr-2 text-[18px]">{c.flag}</span>{c.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                    {c.code} · {c.capital}
                  </p>
                </div>
                <span className="rounded-full border border-ink-200 bg-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700 font-medium">
                  {c.visaRoute}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                <DtDd t="Median €" v={`€${c.medianSalaryEUR.toLocaleString("en-GB")}`} />
                <DtDd t="Eff tax" v={`${c.effectiveTaxPct}%`} />
                <DtDd t="Rent /mo" v={`€${c.rentMedianEUR.toLocaleString("en-GB")}`} />
                <DtDd t="CoL idx" v={`${c.costOfLivingIndex}`} />
                <DtDd t="Path PR" v={c.pathToPermanent} />
                <DtDd t="Path cit." v={c.pathToCitizenship} />
              </dl>

              <p className="mt-4 text-[12px] text-ink-600 leading-[1.55]">
                <strong className="font-semibold text-ink-900">Highlight:</strong> {c.highlight}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                  {c.eligibleFrom.length} passports eligible
                </span>
                <span
                  title="Inline KG editing ships with W4."
                  className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium cursor-not-allowed"
                >
                  <Edit3 className="h-2.5 w-2.5" /> Edit · W4
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lagoon-500/20 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lagoon-500/20 border border-lagoon-400/30 text-lagoon-300">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-sans text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]">
              The Copilot only knows what the KG tells it.
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              When a visa rule changes, a curator promotes the update and every Copilot answer worldwide shifts within seconds. The AI Updates queue is where source-driven proposals land for human sign-off.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-[13px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 font-medium">Editorial links</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/app/ai-updates" className="flex items-center justify-between text-white/85 hover:text-parchment"><span>AI Updates queue</span><ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link href="/app/audit" className="flex items-center justify-between text-white/85 hover:text-parchment"><span>Promotion history</span><ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><a href="https://glimmora.ai" className="flex items-center justify-between text-white/60 cursor-not-allowed" aria-disabled title="KG editor ships with W4."><span>Edit entry</span><span className="font-mono text-[10px]">W4</span></a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number | string; l: string; sub: string; tone?: "lagoon" | "gilt" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function DtDd({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{t}</dt>
      <dd className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">{v}</dd>
    </div>
  );
}
