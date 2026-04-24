import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  ShieldCheck,
  Compass,
  Users2,
  Zap,
  Globe2,
  Briefcase,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="orb h-[600px] w-[600px] bg-lagoon-100 -top-32 left-1/2 -translate-x-1/2" />
        <div className="relative mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="reveal flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-lagoon-200 bg-lagoon-50 px-3 py-1 text-[12.5px] text-lagoon-800">
              <span className="rounded-full bg-lagoon-500 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                For employers
              </span>
              Hire visa-ready talent · no guesswork
            </span>
          </div>

          <h1 className="reveal mx-auto mt-10 max-w-5xl text-center font-sans text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink-900" style={{ animationDelay: "80ms" }}>
            Stop losing candidates <br />
            to visa surprises.
          </h1>
          <p className="reveal mx-auto mt-8 max-w-2xl text-center text-[17px] leading-[1.6] text-ink-600 md:text-[18px]" style={{ animationDelay: "160ms" }}>
            Glimmora matches your open roles only to candidates whose passports actually clear your sponsorship policy. Less ghosting, cleaner pipelines, faster time-to-hire.
          </p>

          <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link href="/sign-up" className="btn-accent inline-flex h-12 items-center gap-2 rounded-full pl-6 pr-5 text-[14.5px] font-medium">
              Start hiring free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#why" className="inline-flex h-12 items-center gap-2 px-4 text-[14.5px] font-medium text-ink-700 hover:text-ink-900">
              See how it works
            </Link>
          </div>
          <p className="reveal mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium" style={{ animationDelay: "320ms" }}>
            Free to post · No card · Pay when you hire
          </p>

          {/* Hero mockup */}
          <div className="reveal relative mx-auto mt-20 max-w-4xl" style={{ animationDelay: "400ms" }}>
            <CandidateMock />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-ink-200/60 py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="grid gap-10 md:grid-cols-4 md:gap-4">
            <Stat k="73%" l="less interview waste" s="vs non-visa-aware pipelines" />
            <Stat k="21 days" l="avg. plan to offer" s="for visa-eligible roles" />
            <Stat k="47" l="supported corridors" s="growing each quarter" />
            <Stat k="12,400" l="verified candidates" s="active Glimmora members" />
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-16 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-700 font-medium">01 — Why Glimmora</p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                Every candidate pre-qualified <br />
                against <span className="text-lagoon-700">your</span> policy.
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] leading-[1.6] text-ink-600">
                You define the visa tiers you sponsor and the passports you cover. We only surface candidates who actually clear that bar — ranked by fit, not keyword luck.
              </p>
            </div>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-16 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.t}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white">
                  <f.icon className="h-[18px] w-[18px] text-lagoon-700" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 font-sans text-[20px] font-semibold tracking-tight text-ink-900">{f.t}</h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.6] text-ink-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-y border-ink-200/60 py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-16 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-700 font-medium">02 — Pricing</p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                Pay when you hire. <br />
                Not to browse.
              </h2>
            </div>
          </div>

          <div className="grid gap-0 rounded-3xl overflow-hidden border border-ink-200 md:grid-cols-2 md:divide-x md:divide-ink-200">
            <article className="bg-parchment p-10 md:p-12">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Post</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">Always free</span>
              </div>
              <p className="mt-8 font-sans text-[56px] font-semibold leading-none tracking-[-0.04em]">$0</p>
              <p className="mt-3 text-[13.5px] text-ink-500">Post unlimited visa-aware roles</p>
              <ul className="mt-10 space-y-3 text-[14px] text-ink-700">
                <Bullet>Unlimited job postings</Bullet>
                <Bullet>Visa-aware matching</Bullet>
                <Bullet>Candidate pipeline</Bullet>
                <Bullet>5-member team</Bullet>
              </ul>
              <Link href="/sign-up" className="btn-ghost mt-10 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium">
                Start hiring free
              </Link>
            </article>

            <article className="relative bg-ink-900 p-10 text-parchment md:p-12">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-300 font-medium">Success fee</p>
                <span className="rounded-full bg-lagoon-500 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">Only on hire</span>
              </div>
              <p className="mt-8 flex items-baseline gap-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.04em]">
                8% <span className="font-sans text-base font-normal text-white/60">of first-year salary</span>
              </p>
              <p className="mt-3 text-[13.5px] text-white/60">Charged when you close a hire</p>
              <ul className="mt-10 space-y-3 text-[14px] text-white/85">
                <DarkBullet>Everything in Post</DarkBullet>
                <DarkBullet>AI-ranked candidates</DarkBullet>
                <DarkBullet>Relocation handoff to candidate plan</DarkBullet>
                <DarkBullet>Dedicated hiring success manager</DarkBullet>
                <DarkBullet>Visa compliance checks</DarkBullet>
              </ul>
              <Link href="/sign-up" className="mt-10 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-parchment px-6 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
                Subscribe &amp; hire <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 md:py-36">
        <div className="relative mx-auto max-w-3xl px-6 md:px-10 text-center">
          <div className="orb h-[500px] w-[500px] bg-lagoon-100 top-0 left-1/2 -translate-x-1/2" />
          <h2 className="relative font-sans text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink-900 text-balance">
            Post your first role <br />
            in the next five minutes.
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-[16px] leading-[1.6] text-ink-600">
            Bring your job. We'll match it to visa-ready candidates before the next engineer sync.
          </p>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className="btn-accent inline-flex h-12 items-center gap-2 rounded-full pl-6 pr-5 text-[14.5px] font-medium">
              Create company account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sign-in" className="inline-flex h-12 items-center gap-2 px-4 text-[14.5px] font-medium text-ink-700 hover:text-ink-900">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ k, l, s }: { k: string; l: string; s: string }) {
  return (
    <div className="md:border-l md:border-ink-200/60 md:pl-6 first:md:border-l-0 first:md:pl-0">
      <p className="font-sans text-5xl font-semibold tracking-[-0.035em] text-lagoon-700 md:text-6xl">{k}</p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-700 font-medium">{l}</p>
      <p className="mt-1 text-[13px] text-ink-500">{s}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lagoon-600" strokeWidth={2.25} />
      {children}
    </li>
  );
}
function DarkBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lagoon-300" strokeWidth={2.25} />
      {children}
    </li>
  );
}

function CandidateMock() {
  return (
    <div className="soft-card overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-ink-100 bg-parchment/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
        </div>
        <div className="rounded-md bg-ink-100 px-3 py-1 font-mono text-[11px] text-ink-500">employers.glimmora.ai · Candidates</div>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-700 font-medium">
          <span className="pulse-dot h-1.5 w-1.5 text-lagoon-500" /> Live
        </span>
      </div>
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-700 font-medium">Senior Backend Engineer · Berlin</p>
            <h3 className="mt-1 font-sans text-[20px] font-semibold tracking-tight text-ink-900">AI-ranked candidates</h3>
          </div>
          <span className="rounded-full bg-lagoon-50 border border-lagoon-100 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800">5 match your policy</span>
        </div>

        <ul className="mt-6 divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
          {[
            { name: "Priya Menon",   country: "IN", flag: "🇮🇳", prof: "Software Engineer · 8y", score: 92, visa: "Visa ready",     tone: "ok" },
            { name: "Aarav Shenoy",  country: "IN", flag: "🇮🇳", prof: "Software Engineer · 6y", score: 87, visa: "Visa ready",     tone: "ok" },
            { name: "Mariana Costa", country: "BR", flag: "🇧🇷", prof: "Backend Engineer · 5y",   score: 78, visa: "Visa ready",     tone: "ok" },
            { name: "Alex Novikov",  country: "UA", flag: "🇺🇦", prof: "Platform Engineer · 9y",  score: 74, visa: "Check needed",   tone: "warn" },
          ].map((c, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-parchment">
                {c.name.split(" ").map(s => s[0]).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[14.5px] font-semibold text-ink-900">{c.name} <span className="ml-1 text-base">{c.flag}</span></p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">{c.prof}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${c.tone === "ok" ? "bg-lagoon-50 border border-lagoon-100 text-lagoon-800" : "bg-gilt-50 border border-gilt-200 text-gilt-800"}`}>
                {c.visa}
              </span>
              <span className="font-sans text-[15px] font-semibold text-ink-900 w-10 text-right">{c.score}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-500">
          <Zap className="h-3 w-3 text-lagoon-600" />
          Filtered by EU Blue Card eligibility · 198 non-sponsoring matches hidden
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Compass,    t: "Visa-aware matching", d: "Define the tiers you sponsor. We filter candidates to only those your passport policy clears." },
  { icon: Users2,     t: "AI-ranked pipeline",  d: "Scores combine fit, visa eligibility, and relocation readiness — not keyword tricks." },
  { icon: Zap,        t: "Faster to offer",     d: "Average 21 days from plan to accepted offer on visa-eligible roles." },
  { icon: Briefcase,  t: "Clean job postings",  d: "Structured visa metadata turns your JD into a filter that works for candidates too." },
  { icon: Globe2,     t: "Global candidate base", d: "Reach movers from 47 countries — each with a Digital Twin the Copilot already understands." },
  { icon: ShieldCheck,t: "Compliance built-in", d: "Visa compliance checks and audit trail for every offer — ready for legal review." },
];
