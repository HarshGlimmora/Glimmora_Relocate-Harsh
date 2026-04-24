import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight, Search, Briefcase, TrendingUp, MapPin, Globe2, ShieldCheck, Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { listPublicJobs, type EmployerJob } from "@/lib/employer-api";
import { scoreMatch } from "@/lib/matching";

export const metadata: Metadata = { title: "Discover" };

// Country comparison is still a useful static view until we wire the Country KG.
const countries = [
  { code: "DE", flag: "🇩🇪", name: "Germany",     capital: "Berlin",    visa: "EU Blue Card",             rent: "€1,340", tax: "36%", lang: "German · English at work", highlight: true },
  { code: "NL", flag: "🇳🇱", name: "Netherlands", capital: "Amsterdam", visa: "Highly Skilled Migrant",   rent: "€1,720", tax: "37%", lang: "Dutch · English widely"                     },
  { code: "PT", flag: "🇵🇹", name: "Portugal",    capital: "Lisbon",    visa: "D7 / Tech Visa",           rent: "€980",   tax: "28%", lang: "Portuguese"                                 },
  { code: "IE", flag: "🇮🇪", name: "Ireland",     capital: "Dublin",    visa: "Critical Skills Permit",   rent: "€1,860", tax: "40%", lang: "English"                                    },
];

function formatSalary(j: EmployerJob) {
  const sym = j.currency === "EUR" ? "€" : j.currency === "GBP" ? "£" : j.currency === "USD" ? "$" : "";
  const min = j.salaryMin ? `${sym}${j.salaryMin / 1000}k` : "";
  const max = j.salaryMax ? `${sym}${j.salaryMax / 1000}k` : "";
  if (min && max) return `${min} – ${max}`;
  return min || max || "Undisclosed";
}

function countryFlag(code: string | null | undefined) {
  if (!code || code.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const codePoints = code.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - "A".charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function parseJobCountry(location: string | null) {
  if (!location) return null;
  const m = location.match(/,\s*([A-Z]{2})\s*$/);
  return m?.[1] ?? null;
}

export default async function DiscoverPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { twin: true, profile: true },
      })
    : null;

  const passport = user?.profile?.nationality ?? null;
  const twin = {
    passport,
    profession: user?.twin?.profession ?? null,
    yearsExp: user?.twin?.yearsExperience ?? null,
    targetCountries: user?.twin?.targetCountries ? (JSON.parse(user.twin.targetCountries) as string[]) : [],
  };

  let jobs: EmployerJob[] = [];
  let jobsError: string | null = null;
  try {
    jobs = await listPublicJobs({ passport: passport ?? undefined });
  } catch (e) {
    jobsError = e instanceof Error ? e.message : "Failed to load jobs";
  }

  const ranked = jobs
    .map((j) => ({ j, score: scoreMatch(twin, j) }))
    .sort((a, b) => b.score - a.score);

  const topFit = ranked.filter((r) => r.j.visaFit === "yes").slice(0, 6);
  const othersCount = ranked.length - topFit.length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Discover</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Find where your next <br className="hidden md:block" />
          chapter fits.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Compare countries on the numbers that matter. Browse jobs your passport can actually take. Let the Copilot shortlist what suits you.
        </p>
      </header>

      {/* Countries */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Countries</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {countries.filter((c) => c.highlight).map((c) => (
            <article key={c.code} className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment lg:col-span-1 lg:row-span-2">
              <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gilt-500/25 blur-[60px]" />
              <div className="relative">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">Top pick for you</p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-5xl leading-none">{c.flag}</span>
                  <div>
                    <h3 className="font-sans text-[30px] font-semibold leading-none tracking-[-0.02em]">{c.name}</h3>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">{c.capital}</p>
                  </div>
                </div>
                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 text-[13px]">
                  <Stat label="Visa route" value={c.visa} />
                  <Stat label="Median rent" value={c.rent} />
                  <Stat label="Effective tax" value={c.tax} />
                  <Stat label="Language" value={c.lang} />
                </dl>
              </div>
            </article>
          ))}

          {countries.filter((c) => !c.highlight).map((c) => (
            <article key={c.code} className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl leading-none">{c.flag}</span>
                <div>
                  <h3 className="font-sans text-[17px] font-semibold tracking-tight text-ink-900">{c.name}</h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{c.visa}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
                <SmallStat label="Rent" value={c.rent} />
                <SmallStat label="Tax" value={c.tax} />
                <SmallStat label="Lang" value={c.lang.split(" ")[0]} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Jobs — real data from Employer */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Visa-aware jobs</span>
        </div>

        {jobsError ? (
          <div className="rounded-2xl border border-danger-200 bg-danger-50 p-5 text-[13px] text-danger-700">
            <p className="font-semibold">Couldn't reach the employer portal.</p>
            <p className="mt-1 text-[12.5px]">{jobsError}</p>
            <p className="mt-2 font-mono text-[11px] text-danger-700/80">The Consumer app calls EMPLOYER_API_URL — make sure it's running on :3002.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Briefcase className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No open roles yet.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              Companies post visa-aware roles here. Come back soon — or tell the Copilot what you're looking for.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3.5">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                placeholder="Search by role, company, city…"
                className="flex-1 bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              {passport ? (
                <span className="hidden rounded-full bg-lagoon-50 border border-lagoon-100 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800 font-medium sm:inline-block">
                  Auto-filtered by {passport} passport
                </span>
              ) : (
                <span className="hidden rounded-full bg-gilt-50 border border-gilt-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800 sm:inline-block">
                  Add passport to Twin for visa-aware filtering
                </span>
              )}
            </div>

            <ul className="divide-y divide-ink-100">
              {(topFit.length > 0 ? topFit : ranked.slice(0, 6)).map(({ j, score }) => {
                const country = parseJobCountry(j.location);
                return (
                  <li key={j.id}>
                    <Link
                      href={`/app/discover/jobs/${j.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50/60 md:gap-6"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-parchment text-2xl leading-none">
                        {countryFlag(country)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-sans text-[15px] font-semibold text-ink-900 leading-tight">{j.title}</p>
                          <VisaFitChip fit={j.visaFit} />
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} /> {j.company.name}</span>
                          <span className="text-ink-300">·</span>
                          <span>{j.location ?? "—"}</span>
                          {j.seniority ? (<><span className="text-ink-300">·</span><span className="capitalize">{j.seniority}</span></>) : null}
                        </p>
                      </div>
                      <div className="hidden text-right md:block">
                        <p className="font-sans text-[14px] font-semibold text-ink-900">{formatSalary(j)}</p>
                        <div className="mt-1 flex justify-end gap-1.5">
                          {j.visaTier ? (
                            <span className="rounded-full bg-ink-50 border border-ink-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-700">
                              {j.visaTier}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${
                          score >= 80 ? "bg-lagoon-50 border-lagoon-200 text-lagoon-800" :
                          score >= 60 ? "bg-gilt-50 border-gilt-200 text-gilt-800" :
                          "bg-ink-50 border-ink-200 text-ink-700"
                        }`}>
                          {score}
                        </span>
                        <ArrowUpRight className="mt-1 h-3.5 w-3.5 text-ink-300 transition-colors group-hover:text-ink-900" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-ink-100 px-5 py-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
                {ranked.length} open role{ranked.length === 1 ? "" : "s"}{othersCount > 0 ? ` · ${othersCount} require visa review` : ""}
              </p>
              <Link href="/app/career" className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 hover:text-ink-900 font-medium">
                Open Career <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Copilot nudges */}
      <section>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">03</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Copilot nudges</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <NudgeCard
            Icon={Globe2}
            kicker="Country insight"
            title="Berlin tech corridor is your strongest match."
            desc="Payment engineers with your passport clear EU Blue Card in ~4 weeks."
            tone="gilt"
          />
          <NudgeCard
            Icon={Briefcase}
            kicker="New roles"
            title={`${ranked.length} active role${ranked.length === 1 ? "" : "s"} ${passport ? `for ${passport}` : "open now"}`}
            desc={passport ? "Filtered to roles your passport can actually take." : "Add your passport to your Twin to filter."}
            tone="ink"
          />
          <NudgeCard
            Icon={TrendingUp}
            kicker="Readiness"
            title="Refresh your Digital Twin weekly."
            desc="Matching quality improves with each attribute you confirm."
            tone="lagoon"
          />
        </div>
      </section>
    </div>
  );
}

function VisaFitChip({ fit }: { fit: "yes" | "maybe" | "no" }) {
  const map = {
    yes:   { c: "bg-lagoon-50 border-lagoon-100 text-lagoon-800", l: "Visa ready", Icon: ShieldCheck },
    maybe: { c: "bg-gilt-50 border-gilt-200 text-gilt-800",       l: "Review",     Icon: Sparkles    },
    no:    { c: "bg-danger-50 border-danger-100 text-danger-700", l: "Blocked",    Icon: ShieldCheck },
  } as const;
  const v = map[fit];
  const I = v.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${v.c}`}>
      <I className="h-2.5 w-2.5" strokeWidth={2.5} /> {v.l}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50 font-medium">{label}</dt>
      <dd className="mt-1 font-sans text-[14px] font-semibold text-parchment">{value}</dd>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-500 font-medium">{label}</dt>
      <dd className="mt-0.5 font-sans text-[12.5px] font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function NudgeCard({
  Icon, kicker, title, desc, tone,
}: { Icon: typeof Globe2; kicker: string; title: string; desc: string; tone: "gilt" | "ink" | "lagoon" }) {
  const bg = tone === "gilt" ? "bg-gilt-50 border-gilt-200" : tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" : "bg-white border-ink-200";
  const iconBg = tone === "gilt" ? "bg-gilt-500 text-white" : tone === "lagoon" ? "bg-lagoon-500 text-white" : "bg-ink-900 text-parchment";
  return (
    <article className={`rounded-2xl border p-6 ${bg}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{kicker}</p>
      <p className="mt-1.5 font-sans text-[17px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink-900">{title}</p>
      <p className="mt-2 text-[13px] leading-[1.55] text-ink-600">{desc}</p>
    </article>
  );
}
