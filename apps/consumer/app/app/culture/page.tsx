import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Languages, Handshake, Utensils, Play, BookOpen, Clock, Sparkles, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Culture & Language" };

const modules = [
  { t: "German basics — survival phrases",       dur: "20 min", cat: "Language",    icon: Languages, progress: 0 },
  { t: "Workplace communication in Germany",     dur: "15 min", cat: "Workplace",   icon: Handshake, progress: 0 },
  { t: "Food & shopping — what to expect",       dur: "10 min", cat: "Daily life",  icon: Utensils,  progress: 0 },
  { t: "Housing norms & renting etiquette",      dur: "12 min", cat: "Daily life",  icon: BookOpen,  progress: 0 },
];

export default function CulturePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Culture &amp; Language</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Arrive ready.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Short daily modules that teach language basics, social norms, and workplace behaviour for your destination. Paced so you absorb, not cram.
        </p>
      </header>

      {/* Hero learning path */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300">
                🇩🇪 Germany · Berlin life
              </span>
              <h2 className="mt-5 font-sans text-[26px] font-semibold leading-[1.2] tracking-[-0.015em]">
                Your path: A2 German in six weeks.
              </h2>
              <p className="mt-3 max-w-md text-[14px] leading-[1.6] text-white/70">
                15 minutes a day gets you comfortable ordering at a bakery, signing a rental contract with help, and decoding most letters from the Bürgeramt.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-white/75">
                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gilt-300" /> 15 min / day</span>
                <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-gilt-300" /> 24 modules</span>
                <span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-gilt-300" /> CEFR A2</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              title="Language modules ship with W4."
              className="inline-flex h-12 items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 pl-5 pr-4 text-[13.5px] font-semibold text-white/60 cursor-not-allowed md:self-end"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" /> Start module 01
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">W4</span>
            </button>
          </div>

          <div className="relative mt-8 h-[3px] w-full rounded-full bg-white/10">
            <div className="h-full w-[0%] rounded-full bg-gradient-to-r from-gilt-400 to-gilt-300" />
          </div>
          <p className="relative mt-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/50 font-medium">
            0 of 24 modules · 0%
          </p>
        </div>
      </section>

      {/* Module cards */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Start with these four</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <article key={i} className="group rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:bg-ink-50/40">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-parchment text-ink-700">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full bg-ink-50 border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                    {m.cat}
                  </span>
                </div>
                <h3 className="mt-5 font-sans text-[17px] font-semibold leading-[1.3] tracking-tight text-ink-900">
                  {m.t}
                </h3>
                <div className="mt-4 flex items-center justify-between text-[12px] text-ink-500">
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {m.dur}</span>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">
                    W4
                  </span>
                </div>
                <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full bg-ink-900" style={{ width: `${m.progress}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Copilot coach */}
      <section className="rounded-[28px] bg-gilt-50 border border-gilt-200 p-10 md:p-12">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink-900">
              Let the Copilot personalise your path.
            </h3>
            <p className="mt-2 max-w-lg text-[14px] text-ink-700 leading-[1.6]">
              Based on your destination, timeline, and family, the Copilot will sequence modules for maximum retention.
            </p>
          </div>
          <Link href="/app/messages" className="btn-primary inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
            Ask the Copilot <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
