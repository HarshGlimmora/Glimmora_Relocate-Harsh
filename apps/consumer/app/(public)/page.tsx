import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  Compass,
  FileText,
  Banknote,
  Users2,
  ShieldCheck,
  Globe2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative">
      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
        {/* One soft accent */}
        <div className="orb h-[700px] w-[700px] bg-gilt-100 -top-40 left-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-[1200px] px-6 md:px-10">
          {/* Announcement pill */}
          <div className="reveal flex justify-center">
            <Link
              href="#features"
              className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-1 py-1 text-[12.5px] text-ink-700 shadow-sm transition-colors hover:border-ink-300"
            >
              <span className="rounded-full bg-ink-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-parchment">
                New
              </span>
              <span className="pl-0.5">AI Copilot plans your whole move in under 20 minutes</span>
              <ArrowRight className="mr-1.5 h-3 w-3 text-ink-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Massive headline */}
          <h1 className="reveal mx-auto mt-10 max-w-5xl text-center font-sans text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink-900" style={{ animationDelay: "80ms" }}>
            Move across borders.<br />
            Don't lose your mind.
          </h1>

          <p className="reveal mx-auto mt-8 max-w-2xl text-center text-[17px] leading-[1.6] text-ink-600 md:text-[18px]" style={{ animationDelay: "160ms" }}>
            One AI companion that finds jobs your passport can take, plans every moving
            part, and stays with you until the keys are in your hand.
          </p>

          <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link
              href="/sign-up"
              className="btn-primary group inline-flex h-12 items-center gap-2 rounded-full pl-6 pr-5 text-[14.5px] font-medium"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how"
              className="inline-flex h-12 items-center gap-2 px-4 text-[14.5px] font-medium text-ink-700 hover:text-ink-900"
            >
              See how it works
            </Link>
          </div>

          <p className="reveal mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500" style={{ animationDelay: "320ms" }}>
            Free · No card · Cancel anytime
          </p>

          {/* Hero visual — ONE clean thing */}
          <div className="reveal mx-auto mt-24 max-w-3xl" style={{ animationDelay: "400ms" }}>
            <HeroCard />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROOF STRIP                                                   */}
      {/* ============================================================ */}
      <section className="border-y border-ink-200/60 py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">
            Trusted by movers relocating to
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-8">
            {[
              "Germany", "Netherlands", "Portugal", "Ireland",
              "Canada", "Singapore", "Australia", "UAE",
            ].map((country) => (
              <div key={country} className="text-center font-sans text-[15px] font-medium text-ink-500 transition-colors hover:text-ink-900">
                {country}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MANIFESTO — big statement                                     */}
      {/* ============================================================ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="grid gap-16 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                01 — Why Glimmora
              </p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-900 text-balance">
                Moving abroad is assembled from twenty disconnected services.
                Glimmora is the missing one — the{" "}
                <span className="text-ink-400">intelligence</span> that makes them all cooperate.
              </h2>
              <div className="mt-10 grid gap-0 divide-y divide-ink-200 md:grid-cols-3 md:divide-y-0 md:divide-x">
                <Stat k="47" l="Corridors supported" />
                <Stat k="$12M" l="Held in escrow" />
                <Stat k="4.9★" l="Member rating" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES — clean text blocks                                  */}
      {/* ============================================================ */}
      <section id="features" className="border-y border-ink-200/60 py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-20 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                02 — What's inside
              </p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                Everything that moves, <br />
                in one place.
              </h2>
            </div>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-16 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.t} className="group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white">
                  <f.icon className="h-[18px] w-[18px] text-ink-700" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
                  {f.t}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.6] text-ink-600">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
      {/* ============================================================ */}
      <section id="how" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-20 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                03 — How it works
              </p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                Three moves, <br />
                from decision to keys.
              </h2>
            </div>
          </div>

          <ol className="divide-y divide-ink-200">
            {steps.map((step) => (
              <li key={step.n} className="grid gap-8 py-10 md:grid-cols-12 md:gap-16 md:py-14">
                <div className="md:col-span-4 flex items-start gap-6">
                  <span className="font-sans text-[80px] font-semibold leading-[0.9] tracking-[-0.04em] text-ink-200">
                    {step.n}
                  </span>
                  <div className="pt-4">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                      {step.kicker}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-8 md:pt-6">
                  <h3 className="font-sans text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-900 md:text-[32px]">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-prose text-[15.5px] leading-[1.65] text-ink-600">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIAL                                                   */}
      {/* ============================================================ */}
      <section className="border-y border-ink-200/60 py-28 md:py-36">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <blockquote className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.25] tracking-[-0.02em] text-ink-900 text-balance">
            &ldquo;The whole move felt like one conversation. Visa to keys-in-hand,
            Glimmora kept every thread in place while I kept my job.&rdquo;
          </blockquote>
          <div className="mt-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-[14px] font-semibold text-parchment">
              A
            </div>
            <div>
              <p className="font-sans text-[14.5px] font-semibold text-ink-900">Aarav Shenoy</p>
              <p className="text-[12.5px] text-ink-500">Senior Engineer · Bangalore → Amsterdam</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AUDIENCE CROSS-LINKS                                          */}
      {/* ============================================================ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-12 grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                Who's making the move?
              </p>
              <h2 className="mt-4 font-sans text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
                One platform. Three plans. <br /> Yours, tuned to your move.
              </h2>
            </div>
            <p className="md:col-span-7 max-w-xl text-[15px] leading-[1.65] text-ink-600">
              Whether you're moving solo on a job offer, taking your whole household, or
              starting a degree abroad, Glimmora generates a plan shaped around the move you're
              actually making — not generic relocation advice.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <AudienceCard
              href="/for-individuals"
              kicker="On your own"
              title="For individuals"
              body="Job offer in hand. Visa to file, apartment to find, bank to open, flight to book — sequenced into one timeline that ends on your start day."
              tone="default"
            />
            <AudienceCard
              href="/for-families"
              kicker="With your household"
              title="For families"
              body="Spouse permits, school enrolment, household shipping, family-sized housing — coordinated for everyone moving with you."
              tone="lagoon"
            />
            <AudienceCard
              href="/for-students"
              kicker="Starting a degree"
              title="For students"
              body="Student visa, blocked account, halls of residence, semester registration — from your admission letter to your first lecture."
              tone="gilt"
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING                                                       */}
      {/* ============================================================ */}
      <section id="pricing" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="mb-16 grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                04 — Pricing
              </p>
            </div>
            <div className="md:col-span-8">
              <h2 className="font-sans text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                One membership. <br />
                Your whole journey.
              </h2>
            </div>
          </div>

          <div className="grid gap-0 border border-ink-200 rounded-3xl overflow-hidden md:grid-cols-2 md:divide-x md:divide-ink-200">
            {/* Free */}
            <article className="bg-parchment p-10 md:p-12">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Explore</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">Free forever</span>
              </div>
              <p className="mt-8 font-sans text-[56px] font-semibold leading-none tracking-[-0.04em] text-ink-900">$0</p>
              <p className="mt-3 text-[13.5px] text-ink-500">No card required</p>
              <ul className="mt-10 space-y-3 text-[14px] text-ink-700">
                {[
                  "Country comparison & salary simulator",
                  "Visa-aware job discovery",
                  "10 Copilot conversations / month",
                  "Digital Twin preview",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" strokeWidth={2.25} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="btn-ghost mt-10 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium"
              >
                Start for free
              </Link>
            </article>

            {/* Base */}
            <article className="relative bg-ink-900 p-10 text-parchment md:p-12">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">Glimmora Base</p>
                <span className="rounded-full bg-gilt-400 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-900">Recommended</span>
              </div>
              <p className="mt-8 flex items-baseline gap-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.04em]">
                $100 <span className="font-sans text-[15px] font-normal text-white/60">/ year</span>
              </p>
              <p className="mt-3 text-[13.5px] text-white/60">Everything to actually move</p>
              <ul className="mt-10 space-y-3 text-[14px] text-white/85">
                {[
                  "Unlimited Copilot + full plan execution",
                  "Documents vault with AI validation",
                  "Marketplace access with escrow",
                  "Family mode · spouse & children twins",
                  "Timeline tracking & renewal alerts",
                  "Priority Copilot response time",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gilt-400" strokeWidth={2.25} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-10 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-parchment px-6 text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-white"
              >
                Subscribe & begin <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          </div>

          <p className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500">
            7-day money-back · Cancel anytime · GDPR-ready
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="border-t border-ink-200/60 py-28 md:py-36 relative overflow-hidden">
        <div className="orb h-[500px] w-[500px] bg-gilt-100 top-20 left-1/2 -translate-x-1/2" />
        <div className="relative mx-auto max-w-3xl px-6 md:px-10 text-center">
          <h2 className="font-sans text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink-900 text-balance">
            Your next chapter starts here.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.6] text-ink-600">
            Twenty minutes to a first plan. No card, no commitment.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="btn-primary group inline-flex h-12 items-center gap-2 rounded-full pl-6 pr-5 text-[14.5px] font-medium"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center gap-2 px-4 text-[14.5px] font-medium text-ink-700 hover:text-ink-900"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================ */
/* BITS                                                          */
/* ============================================================ */

function AudienceCard({
  href,
  kicker,
  title,
  body,
  tone,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
  tone: "default" | "lagoon" | "gilt";
}) {
  const cardCls =
    tone === "lagoon"
      ? "border-lagoon-100 bg-lagoon-50/40 hover:border-lagoon-300"
      : tone === "gilt"
      ? "border-gilt-200 bg-gilt-50/40 hover:border-gilt-300"
      : "border-ink-200 bg-white hover:border-ink-900";
  const kickerCls =
    tone === "lagoon"
      ? "text-lagoon-800"
      : tone === "gilt"
      ? "text-gilt-800"
      : "text-ink-500";
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col rounded-2xl border p-7 transition-colors ${cardCls}`}
    >
      <p
        className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${kickerCls}`}
      >
        {kicker}
      </p>
      <h3 className="mt-4 font-sans text-[22px] font-semibold tracking-tight text-ink-900">
        {title}
      </h3>
      <p className="mt-3 flex-1 text-[13.5px] leading-[1.6] text-ink-600">{body}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-ink-900">
        See the plan
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Stat({ k, l }: { k: string; l: string }) {
  return (
    <div className="py-6 md:py-0 md:px-8 first:md:pl-0">
      <p className="font-sans text-[40px] font-semibold leading-none tracking-[-0.035em] text-ink-900 md:text-[44px]">
        {k}
      </p>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
        {l}
      </p>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="soft-card rounded-3xl p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-ink-100 pb-4">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          Itinerary — Draft
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-700">
          <span className="pulse-dot text-lagoon-500" />
          Live
        </span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-sans text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
            Bangalore <span className="text-ink-300">→</span> Berlin
          </p>
          <p className="mt-2 text-[14px] text-ink-500">
            Family of 3 · Senior engineer · EU Blue Card path
          </p>

          <div className="mt-8 grid grid-cols-2 gap-y-5">
            <Field label="Timeline" value="9 months" />
            <Field label="Take-home" value="€4,280/mo" />
            <Field label="Savings" value="€1,620/mo" />
            <Field label="Readiness" value="42 / 100" tone="gilt" />
          </div>
        </div>

        <div className="md:border-l md:border-ink-100 md:pl-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium mb-4">
            Active plan
          </p>
          <ul className="space-y-3 text-[13.5px]">
            {[
              { s: "done", t: "5 visa-eligible roles shortlisted" },
              { s: "live", t: "Apostille translation pending" },
              { s: "wait", t: "Housing — after offer" },
              { s: "wait", t: "School for Ananya · 2 saved" },
            ].map((row) => (
              <li key={row.t} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    row.s === "done" ? "bg-lagoon-500" :
                    row.s === "live" ? "bg-gilt-500 animate-pulse" :
                    "bg-ink-300"
                  }`}
                />
                <span className={row.s === "wait" ? "text-ink-400" : "text-ink-800"}>
                  {row.t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "gilt" }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium">{label}</p>
      <p className={`mt-1 font-sans text-[17px] font-semibold tracking-tight ${tone === "gilt" ? "text-gilt-700" : "text-ink-900"}`}>
        {value}
      </p>
    </div>
  );
}

const features = [
  {
    icon: Sparkles,
    t: "AI Copilot",
    d: "A Digital Twin of you — reasoned about continuously. No forms to re-fill, no context lost between sessions.",
  },
  {
    icon: Compass,
    t: "Visa-aware jobs",
    d: "Only roles your passport can take. No more ghosting when sponsorship comes up three interviews in.",
  },
  {
    icon: Banknote,
    t: "Financial clarity",
    d: "Net salary, tax, FX, cost of living. Grounded numbers per corridor, not guesswork.",
  },
  {
    icon: FileText,
    t: "Documents, sorted",
    d: "Dynamic checklist per country and visa route. AI validates each upload. Nothing misses its deadline.",
  },
  {
    icon: Users2,
    t: "Family-first",
    d: "Parallel plans for spouse career and children. Every family member gets their own Twin.",
  },
  {
    icon: ShieldCheck,
    t: "Escrow protection",
    d: "KYC-verified marketplace partners. Your deposits held in escrow until the service is delivered.",
  },
];

const steps = [
  {
    n: "01",
    kicker: "Understand you",
    title: "A living Twin — not a dead profile.",
    body: "A short Copilot conversation builds a model of you: skills, family, passport, budget, fears. Every later recommendation reasons on this twin, not a static form you fill once and forget.",
  },
  {
    n: "02",
    kicker: "Plan the move",
    title: "Every part, in dependency order.",
    body: "Compare countries on numbers that matter. Find visa-eligible jobs. Run the financial math honestly. The Copilot explodes the plan into a dependency-aware timeline with real dates.",
  },
  {
    n: "03",
    kicker: "Execute with trust",
    title: "Recommend. Book. Protect.",
    body: "Housing, schools, banks, insurance — all through verified partners. Money held in escrow until delivered. Trust scores govern every match. Nothing recommended that isn't deliverable.",
  },
];
