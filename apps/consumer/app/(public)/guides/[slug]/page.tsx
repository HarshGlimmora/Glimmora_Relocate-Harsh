import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, BookOpen, Info } from "lucide-react";
import { getGuide, GUIDES } from "@/lib/public-data/guides";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = getGuide(params.slug);
  if (!g) return { title: "Not found" };
  return { title: g.title, description: g.subtitle };
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const more = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <main className="mx-auto max-w-[860px] px-6 pt-16 pb-24 md:px-10 md:pt-24">
      <Link href="/guides" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to guides
      </Link>

      <article className="mt-8">
        <header className="mb-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full border border-lagoon-100 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
              {guide.category}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              <Clock className="h-3 w-3" /> {guide.readMinutes} min read
            </span>
          </div>
          <h1 className="mt-5 font-sans text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
            {guide.title}
          </h1>
          <p className="mt-5 text-[17px] leading-[1.6] text-ink-700">{guide.subtitle}</p>
          <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-ink-200 bg-white px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white text-[9px] font-semibold">
              {guide.authorName.split(" ").map((p) => p[0]).join("").toUpperCase()}
            </span>
            {guide.authorName} · Published {new Date(guide.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </header>

        {guide.heroBullets.length > 0 ? (
          <aside className="mb-12 rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">The essentials</p>
            <ul className="mt-3 space-y-2">
              {guide.heroBullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14px] text-ink-800 leading-[1.55]">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-ink-900 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="prose-body space-y-6">
          {guide.body.map((b, i) => {
            if (b.kind === "h2") return <h2 key={i} className="mt-10 font-sans text-[24px] font-semibold tracking-tight text-ink-900">{b.text}</h2>;
            if (b.kind === "p")  return <p key={i} className="text-[16px] leading-[1.7] text-ink-800">{b.text}</p>;
            if (b.kind === "list") return (
              <ul key={i} className="space-y-2">
                {b.items!.map((it) => (
                  <li key={it} className="flex items-start gap-3 text-[15px] leading-[1.6] text-ink-800">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ink-900 shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
            if (b.kind === "callout") return (
              <aside key={i} className="flex items-start gap-3 rounded-xl border border-gilt-200 bg-gilt-50/60 p-5 text-[14px] leading-[1.6] text-ink-800">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gilt-500 text-white shrink-0">
                  <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span>{b.text}</span>
              </aside>
            );
            return null;
          })}
        </div>
      </article>

      <section className="mt-20 rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <BookOpen className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[22px] font-semibold leading-[1.15] tracking-[-0.015em]">
              Want this, personalised?
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              Start a plan in 3 minutes. Glimmora will tailor every step to your passport, family, and field.
            </p>
          </div>
          <Link href="/sign-up" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
            Get my plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {more.length > 0 ? (
        <section className="mt-16">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">Keep reading</span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {more.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="group block h-full rounded-2xl border border-ink-200 bg-white p-5 hover:border-ink-900">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">{g.category}</p>
                  <p className="mt-2 font-sans text-[15px] font-semibold text-ink-900 leading-[1.25]">{g.title}</p>
                  <p className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    <Clock className="h-3 w-3" /> {g.readMinutes} min
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
