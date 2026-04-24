import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { GUIDES } from "@/lib/public-data/guides";

export const metadata: Metadata = {
  title: "Guides & blog",
  description: "Field-tested playbooks on EU visas, moving with family, tax regimes, and settling into new countries.",
};

const categoryCls: Record<string, string> = {
  Visa:    "bg-lagoon-50 border-lagoon-100 text-lagoon-800",
  Moving:  "bg-gilt-50 border-gilt-200 text-gilt-800",
  Tax:     "bg-ink-50 border-ink-200 text-ink-700",
  Family:  "bg-gilt-50 border-gilt-200 text-gilt-800",
  Housing: "bg-ink-50 border-ink-200 text-ink-700",
};

export default function GuidesPage() {
  const [featured, ...rest] = GUIDES;

  return (
    <main>
      <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-12">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Guides & blog</p>
        <h1 className="mt-4 font-sans text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          The playbooks <br />we wish we'd had.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-[1.65] text-ink-700">
          Every guide is written by someone who's done the move. No platitudes — just the order of operations, the hidden costs, and the things that actually block you.
        </p>
      </section>

      {/* Featured */}
      {featured ? (
        <section className="mx-auto max-w-[1280px] px-6 pb-10 md:px-10">
          <Link href={`/guides/${featured.slug}`} className="group grid gap-8 rounded-[28px] border border-ink-200 bg-white p-8 transition-all hover:border-ink-900 hover:shadow-[0_8px_40px_-16px_rgba(14,18,28,0.2)] md:grid-cols-[1.4fr_1fr] md:p-12">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${categoryCls[featured.category] ?? "bg-ink-50 border-ink-200 text-ink-700"}`}>
                  {featured.category}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Featured</span>
              </div>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900 group-hover:text-ink-900">
                {featured.title}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-700">{featured.subtitle}</p>
              <p className="mt-5 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                <Clock className="h-3 w-3" /> {featured.readMinutes} min read · by {featured.authorName}
              </p>
            </div>
            <ul className="space-y-3 rounded-2xl border border-ink-100 bg-parchment/50 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">What's inside</p>
              {featured.heroBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-ink-700 leading-[1.5]">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-ink-400 shrink-0" />
                  {b}
                </li>
              ))}
              <p className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-700 font-medium group-hover:text-ink-900">
                Read the playbook <ArrowRight className="h-3 w-3" />
              </p>
            </ul>
          </Link>
        </section>
      ) : null}

      {/* Rest of the guides */}
      {rest.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-6 pb-20 md:px-10">
          <div className="mb-6 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">More guides</span>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group block h-full rounded-2xl border border-ink-200 bg-white p-6 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]"
                >
                  <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${categoryCls[g.category] ?? "bg-ink-50 border-ink-200 text-ink-700"}`}>
                    {g.category}
                  </span>
                  <h3 className="mt-4 font-sans text-[18px] font-semibold leading-[1.2] tracking-tight text-ink-900">{g.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-600">{g.subtitle}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 border-t border-ink-100 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 w-full">
                    <Clock className="h-3 w-3" /> {g.readMinutes} min · {g.authorName}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* CTA */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
          <div className="relative grid gap-5 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <BookOpen className="h-4 w-4" />
              </span>
              <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
                The best guide is the one Glimmora writes for you.
              </h2>
              <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-white/70">
                A personalised plan keyed to your passport, family, profession, and target country. More precise than any blog post.
              </p>
            </div>
            <Link href="/sign-up" className="inline-flex h-12 items-center gap-2 rounded-full bg-parchment pl-6 pr-5 text-[14px] font-semibold text-ink-900 hover:bg-white self-start md:self-center">
              Get my plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
