import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Compass,
  Briefcase,
  FileText,
  Coins,
  Check,
  Clock,
  Globe2,
  Plane,
  TrendingUp,
  CheckCircle2,
  Building2,
  MapPin,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function firstName(name?: string | null, email?: string) {
  if (name) return name.split(" ")[0];
  if (email) return email.split("@")[0];
  return "there";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      twin: true,
      profile: true,
      subscription: true,
      relocation: { include: { milestones: { orderBy: { order: "asc" } } } },
    },
  });
  if (!user) return null;

  const relocation = user.relocation;

  const twin = user.twin;
  const targetCountries: string[] = twin?.targetCountries
    ? (JSON.parse(twin.targetCountries) as string[])
    : [];
  const readiness = twin?.readinessScore ?? 0;
  const stage = twin?.stage ?? "exploring";
  const today = new Date();
  const dateStr = today.toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const twinChecks = [
    { t: "Profession & seniority", done: !!twin?.profession },
    { t: "Years of experience", done: !!twin?.yearsExperience },
    { t: "Timeline & budget", done: !!twin?.timelineMonths },
    { t: "Family shape", done: twin ? twin.familySize > 1 : false },
    { t: "Target countries", done: targetCountries.length > 0 },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      {/* ============================================================ */}
      {/* Welcome                                                       */}
      {/* ============================================================ */}
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          {dateStr}
        </p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {greeting()}, {firstName(user.name, user.email)}.
        </h1>
      </header>

      {/* ============================================================ */}
      {/* Hired banner — shown when candidate has an active Relocation  */}
      {/* ============================================================ */}
      {relocation ? (() => {
        const done = relocation.milestones.filter((m) => m.status === "DONE").length;
        const total = relocation.milestones.length;
        const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
        const nextMilestone = relocation.milestones.find((m) => m.status !== "DONE");
        const currencySymbol = relocation.currency === "EUR" ? "€" : relocation.currency === "GBP" ? "£" : "$";
        const daysToStart = relocation.startDate
          ? Math.round((relocation.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        return (
          <section className="mb-8 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-900 to-[#0a1820] p-8 text-parchment md:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
            <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/20 blur-[80px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500/20 border border-gilt-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300 font-semibold">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> You're hired
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                    <Building2 className="h-3 w-3" />
                    {relocation.employerName}
                  </span>
                </div>
                <h2 className="mt-5 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                  {relocation.jobTitle}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {relocation.destCity ? `${relocation.destCity}, ` : ""}{relocation.destCountry}
                  </span>
                  {relocation.salary ? (
                    <>
                      <span className="h-3 w-px bg-white/20" />
                      <span>{currencySymbol}{relocation.salary.toLocaleString("en-GB")}</span>
                    </>
                  ) : null}
                  {relocation.visaRoute ? (
                    <>
                      <span className="h-3 w-px bg-white/20" />
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {relocation.visaRoute}
                      </span>
                    </>
                  ) : null}
                </div>
                {relocation.startDate ? (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/80 font-medium">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Start day {relocation.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {daysToStart != null && daysToStart > 0 ? ` · in ${daysToStart} days` : ""}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/app/plan"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white transition-colors"
                  >
                    See your plan <ArrowRight className="h-4 w-4" />
                  </Link>
                  {nextMilestone ? (
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300 font-medium">
                      Up next · {nextMilestone.title}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Plan progress</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-sans text-[56px] font-semibold leading-none tracking-[-0.035em] text-parchment">{progressPct}%</span>
                  <span className="text-[13px] text-white/60">{done}/{total} steps</span>
                </div>
                <div className="mt-4 h-[4px] w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gilt-400 to-lagoon-300 transition-all"
                    style={{ width: `${Math.max(4, progressPct)}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                  {relocation.milestones.slice(1, 4).map((m) => (
                    <div key={m.id} className="min-w-0">
                      <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                        {m.kind.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 truncate font-sans text-[12px] font-semibold text-parchment">
                        {m.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })() : null}

      {/* ============================================================ */}
      {/* HERO CARD — Readiness with progress ring                      */}
      {/* ============================================================ */}
      <section className="mb-8">
        <ReadinessHero
          readiness={readiness}
          stage={stage}
          targetCount={targetCountries.length}
          subscription={user.subscription?.tier ?? "FREE"}
          profession={twin?.profession ?? null}
        />
      </section>

      {/* ============================================================ */}
      {/* Two-column — Next action + Twin checklist                     */}
      {/* ============================================================ */}
      <section className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <NextActionCard />
        <ChecklistCard items={twinChecks} />
      </section>

      {/* ============================================================ */}
      {/* Quick routes — Bento                                          */}
      {/* ============================================================ */}
      <section className="mb-8">
        <SectionLabel num="01" label="Continue your journey" />
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Discover — spans 2 cols, 2 rows (big) */}
          <DiscoverCard targetCountries={targetCountries} />
          {/* Career — tall right top */}
          <CareerCard />
          {/* Documents — bottom right */}
          <DocumentsCard />
          {/* Finance — bottom wide (under Discover) */}
          {/* placed via grid ordering; no — keeping simple 3x2 */}
        </div>
        {/* Finance — wide bottom */}
        <div className="mt-4">
          <FinanceCard />
        </div>
      </section>

      {/* ============================================================ */}
      {/* Activity timeline                                             */}
      {/* ============================================================ */}
      <section className="mb-8">
        <SectionLabel num="02" label="Recent activity" />
        <ActivityTimeline />
      </section>

      {/* ============================================================ */}
      {/* Copilot banner                                                */}
      {/* ============================================================ */}
      <section>
        <CopilotBanner firstName={firstName(user.name, user.email)} />
      </section>
    </div>
  );
}

/* ================================================================== */
/* SECTION LABEL                                                      */
/* ================================================================== */
function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">
        {num}
      </span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
        {label}
      </span>
    </div>
  );
}

/* ================================================================== */
/* HERO CARD — Readiness with circular progress ring                   */
/* ================================================================== */
function ReadinessHero({
  readiness,
  stage,
  targetCount,
  subscription,
  profession,
}: {
  readiness: number;
  stage: string;
  targetCount: number;
  subscription: string;
  profession: string | null;
}) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (readiness / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-8 text-parchment md:p-10">
      {/* Decorative gilt glow */}
      <div
        aria-hidden
        className="absolute -right-20 -top-20 h-[340px] w-[340px] rounded-full bg-gilt-500/20 blur-[80px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-300">
              <span className="h-1 w-1 animate-pulse rounded-full bg-gilt-300" />
              {stage}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/40 font-medium">
              Plan readiness
            </span>
          </div>
          <p className="mt-5 max-w-md font-sans text-[26px] font-semibold leading-[1.2] tracking-[-0.015em] md:text-[30px]">
            You're{" "}
            <span className="text-gilt-300">{readiness}%</span> of the way
            to a complete relocation plan.
          </p>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/65">
            {profession
              ? `Based on your profile as ${profession}, the Copilot is already matching visa-eligible roles. A few more details will tighten every suggestion.`
              : "Fill in a few details about yourself and the Copilot will start matching visa-eligible jobs and drafting your timeline."}
          </p>

          {/* Micro stats */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <MicroStat
              icon={<Globe2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Target countries"
              value={targetCount ? `${targetCount} on shortlist` : "None yet"}
            />
            <MicroStat
              icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Subscription"
              value={subscription}
            />
            <MicroStat
              icon={<Plane className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Stage"
              value={stage}
            />
          </div>
        </div>

        {/* Circular progress ring */}
        <div className="relative mx-auto h-[160px] w-[160px] md:h-[180px] md:w-[180px]">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
            />
            <circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <defs>
              <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EFCD65" />
                <stop offset="100%" stopColor="#CF9B1E" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-sans text-[52px] font-semibold leading-none tracking-[-0.04em] text-parchment">
              {readiness}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 font-medium">
              of 100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gilt-300">
        {icon}
      </span>
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/40 font-medium">
          {label}
        </p>
        <p className="font-sans text-[13px] font-semibold text-parchment capitalize">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* NEXT ACTION CARD — tinted, pattern                                  */
/* ================================================================== */
function NextActionCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gilt-200 bg-gilt-50 p-8 md:p-10">
      {/* Decorative corner */}
      <div
        aria-hidden
        className="absolute -right-10 -bottom-10 h-[200px] w-[200px] rounded-full bg-gilt-200/40 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gilt-500 text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
            Next best action
          </span>
        </div>
        <h2 className="mt-5 max-w-lg font-sans text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-900 md:text-[30px]">
          Finish your Digital Twin to unlock sharper matches.
        </h2>
        <p className="mt-3 max-w-lg text-[14.5px] leading-[1.6] text-ink-700">
          The Copilot reasons on your Twin. Five more fields — profession, seniority, timeline, family, countries — and every recommendation gets noticeably better.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/app/profile"
            className="btn-primary group inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium"
          >
            Update your Twin
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gilt-800/80 font-medium">
            ≈ 10 min
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CHECKLIST CARD — distinct visual                                    */
/* ================================================================== */
function ChecklistCard({ items }: { items: { t: string; done: boolean }[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-8">
      {/* Progress strip at top */}
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-ink-100">
        <div className="h-full bg-ink-900 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          Twin checklist
        </span>
        <span className="font-sans text-[13px] font-semibold text-ink-900">
          {doneCount}/{items.length}
        </span>
      </div>
      <p className="mt-4 font-sans text-[17px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-900">
        Fields that shape your plan.
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((it) => (
          <li key={it.t} className="flex items-center gap-3">
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                it.done
                  ? "border-ink-900 bg-ink-900 text-parchment"
                  : "border-ink-200 bg-white"
              }`}
            >
              {it.done ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}
            </span>
            <span className={`text-[13.5px] ${it.done ? "text-ink-500 line-through" : "text-ink-800"}`}>
              {it.t}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* DISCOVER CARD — featured, bento tall                                 */
/* ================================================================== */
function DiscoverCard({ targetCountries }: { targetCountries: string[] }) {
  const flags: Record<string, string> = {
    DE: "🇩🇪", NL: "🇳🇱", PT: "🇵🇹", IE: "🇮🇪", CA: "🇨🇦",
    AU: "🇦🇺", SE: "🇸🇪", FR: "🇫🇷", AE: "🇦🇪", SG: "🇸🇬",
  };
  const display = targetCountries.length ? targetCountries : ["DE", "NL", "PT"];
  return (
    <Link
      href="/app/discover"
      className="group relative col-span-2 row-span-2 flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 transition-colors hover:bg-ink-50/40"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-parchment">
          <Compass className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-900" />
      </div>

      <h3 className="mt-8 font-sans text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
        Discover where your next chapter fits.
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-[1.6] text-ink-600">
        Compare countries on tax, salary, lifestyle. Browse visa-aware jobs — only roles your passport can take.
      </p>

      {/* Country flags visual */}
      <div className="mt-auto pt-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium mb-3">
          {targetCountries.length ? `On your shortlist · ${targetCountries.length}` : "Popular corridors"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {display.slice(0, 6).map((c) => (
            <span
              key={c}
              className="flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-parchment px-3"
            >
              <span className="text-base leading-none">{flags[c] ?? "🌐"}</span>
              <span className="font-mono text-[11px] font-semibold text-ink-800">{c}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

/* ================================================================== */
/* CAREER CARD — compact                                                */
/* ================================================================== */
function CareerCard() {
  return (
    <Link
      href="/app/career"
      className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:bg-ink-50/40"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
          <Briefcase className="h-[18px] w-[18px] text-ink-700" strokeWidth={1.75} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-900" />
      </div>
      <h3 className="mt-6 font-sans text-[19px] font-semibold tracking-tight text-ink-900">
        Career
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-ink-600">
        Applications, CVs, interview prep, offers.
      </p>
      <div className="mt-5 flex items-baseline justify-between border-t border-ink-100 pt-4">
        <span className="font-sans text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink-900">
          0
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 font-medium">
          Active
        </span>
      </div>
    </Link>
  );
}

/* ================================================================== */
/* DOCUMENTS CARD — checklist preview                                   */
/* ================================================================== */
function DocumentsCard() {
  return (
    <Link
      href="/app/documents"
      className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:bg-ink-50/40"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
          <FileText className="h-[18px] w-[18px] text-ink-700" strokeWidth={1.75} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-900" />
      </div>
      <h3 className="mt-6 font-sans text-[19px] font-semibold tracking-tight text-ink-900">
        Documents
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-ink-600">
        Dynamic checklist. Zero missed deadlines.
      </p>
      <div className="mt-5 space-y-1.5 border-t border-ink-100 pt-4">
        {[
          { t: "Passport", state: "ok" },
          { t: "Apostille", state: "pending" },
          { t: "Bank statement", state: "wait" },
        ].map((d) => (
          <div key={d.t} className="flex items-center gap-2 text-[12px]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                d.state === "ok"
                  ? "bg-lagoon-500"
                  : d.state === "pending"
                  ? "bg-gilt-500 animate-pulse"
                  : "bg-ink-300"
              }`}
            />
            <span className={d.state === "wait" ? "text-ink-400" : "text-ink-800"}>{d.t}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

/* ================================================================== */
/* FINANCE CARD — wide with sparkline                                   */
/* ================================================================== */
function FinanceCard() {
  const points = [8, 18, 14, 26, 38, 32, 52, 48, 64];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - (p / max) * 80;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Link
      href="/app/finance"
      className="group relative flex items-center gap-8 overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:bg-ink-50/40 md:p-8"
    >
      <div className="flex shrink-0 items-start">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
          <Coins className="h-[18px] w-[18px] text-ink-700" strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="font-sans text-[19px] font-semibold tracking-tight text-ink-900">
            Finance
          </h3>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 font-medium">
            Run a simulation
          </span>
        </div>
        <p className="mt-1 text-[13.5px] text-ink-600">
          Net salary, tax, cost of living, savings projection per corridor.
        </p>
      </div>
      {/* Sparkline */}
      <div className="hidden h-[48px] w-[160px] md:block">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CF9B1E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#CF9B1E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L 100 100 L 0 100 Z`}
            fill="url(#sparkFill)"
          />
          <path
            d={path}
            fill="none"
            stroke="#CF9B1E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="hidden text-right md:block">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          Est. savings
        </p>
        <p className="mt-1 font-sans text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink-900">
          €1,620<span className="text-[12px] font-normal text-ink-500">/mo</span>
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-900" />
    </Link>
  );
}

/* ================================================================== */
/* ACTIVITY TIMELINE                                                    */
/* ================================================================== */
function ActivityTimeline() {
  const items = [
    {
      kicker: "Copilot",
      t: "Welcome conversation started",
      when: "Just now",
      icon: Sparkles,
      tone: "gilt",
    },
    {
      kicker: "Profile",
      t: "Digital Twin created",
      when: "Earlier today",
      icon: TrendingUp,
      tone: "ink",
    },
    {
      kicker: "Account",
      t: "Welcome to Glimmora · verified",
      when: "Today",
      icon: Check,
      tone: "lagoon",
    },
  ];

  return (
    <div className="relative rounded-2xl border border-ink-200 bg-white">
      <ol className="divide-y divide-ink-100">
        {items.map((row, i) => {
          const Icon = row.icon;
          const bg =
            row.tone === "gilt" ? "bg-gilt-100 text-gilt-800" :
            row.tone === "lagoon" ? "bg-lagoon-100 text-lagoon-800" :
            "bg-ink-100 text-ink-700";
          return (
            <li
              key={i}
              className="grid grid-cols-12 items-center gap-4 p-6 md:gap-6"
            >
              <span className={`col-span-2 md:col-span-1 flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="col-span-10 md:col-span-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                {row.kicker}
              </span>
              <p className="col-span-12 text-[15px] font-medium text-ink-900 md:col-span-6">
                {row.t}
              </p>
              <span className="col-span-12 flex items-center gap-1.5 font-mono text-[11px] text-ink-500 md:col-span-3 md:justify-end">
                <Clock className="h-3 w-3" />
                {row.when}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ================================================================== */
/* COPILOT BANNER — dark, patterned                                    */
/* ================================================================== */
function CopilotBanner({ firstName }: { firstName: string }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-ink-900 p-10 text-parchment md:p-14">
      <div
        aria-hidden
        className="absolute -left-20 -bottom-20 h-[400px] w-[400px] rounded-full bg-gilt-500/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 70% 50%, black, transparent 70%)",
        }}
      />

      <div className="relative grid gap-8 md:grid-cols-[1.2fr_auto] md:items-center">
        <div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="mt-6 font-sans text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[34px]">
            Got a question, {firstName}? <br className="hidden md:inline" />
            Ask the Copilot.
          </h3>
          <p className="mt-4 max-w-xl text-[14.5px] leading-[1.6] text-white/65">
            Visa routes, salary math, school options, whether a deposit is protected. Grounded in your Twin and the Country Knowledge Graph.
          </p>
        </div>
        <Link
          href="/app/messages"
          className="group inline-flex h-12 items-center gap-2 self-start rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-white md:self-center"
        >
          Start a conversation
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
