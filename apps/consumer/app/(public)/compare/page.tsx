import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare countries",
  description: "Compare European countries by visa route, salary, tax, rent, and cost of living. Find the best fit for your move.",
};

export default function ComparePage() {
  return (
    <main>
      <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-12">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Compare countries</p>
        <h1 className="mt-4 font-sans text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Where you land <br />matters most.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-[1.65] text-ink-700">
          Salary, tax, rent, visa speed, language. We put the 8 most-relocated-to European countries side by side. No spin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up" className="btn-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-medium">
            Get a personalised shortlist <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/salary" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 text-[13.5px] font-medium text-ink-800 hover:border-ink-900">
            Try the salary simulator
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <CompareClient />
      </section>

      {/* Copilot callout */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/20 blur-[80px]" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
                Let the Copilot shortlist for you.
              </h2>
              <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-white/70">
                Tell us your passport, family size, field, and ambitions. Glimmora filters these eight countries down to the two that fit your life — and drafts your move plan.
              </p>
            </div>
            <Link href="/sign-up" className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white self-start md:self-center">
              Start my plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
