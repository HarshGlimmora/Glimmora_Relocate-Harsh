import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Briefcase, DollarSign, Clock, ShieldCheck, Building2,
  Globe2, FileText, ListChecks, Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPublicJob, listApplicationsForEmail } from "@/lib/employer-api";
import { scoreMatch, computeVisaFit } from "@/lib/matching";
import { ApplyButton } from "./apply-button";

export const metadata: Metadata = { title: "Role" };

function salary(min: number | null, max: number | null, currency: string) {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  if (min && max) return `${sym}${min.toLocaleString("en-GB")} – ${sym}${max.toLocaleString("en-GB")}`;
  if (min) return `from ${sym}${min.toLocaleString("en-GB")}`;
  if (max) return `up to ${sym}${max.toLocaleString("en-GB")}`;
  return "Undisclosed";
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { twin: true, profile: true },
  });
  if (!user) return null;

  const job = await getPublicJob(params.id).catch(() => null);
  if (!job) notFound();

  const twin = {
    passport: user.profile?.nationality ?? null,
    profession: user.twin?.profession ?? null,
    yearsExp: user.twin?.yearsExperience ?? null,
    targetCountries: user.twin?.targetCountries ? (JSON.parse(user.twin.targetCountries) as string[]) : [],
  };
  const score = scoreMatch(twin, job);
  const fit = computeVisaFit(twin, { eligiblePassports: job.eligiblePassports, visaSponsorship: job.visaSponsorship });

  // Check if already applied
  const myApps = await listApplicationsForEmail(user.email).catch(() => []);
  const alreadyApplied = myApps.some((a) => a.job.id === job.id);

  const fitMeta = {
    yes:     { cls: "bg-lagoon-500/20 border-lagoon-400/30 text-lagoon-300",  l: "Visa ready",  desc: `Your ${twin.passport} passport clears ${job.visaTier ?? "this visa route"} for this role.` },
    maybe:   { cls: "bg-gilt-500/20 border-gilt-400/30 text-gilt-300",        l: "Under review",desc: "The company sponsors but your passport isn't on the explicit eligible list. Apply with context." },
    no:      { cls: "bg-danger-500/20 border-danger-400/30 text-danger-200",  l: "Blocked",     desc: "This role's visa policy doesn't cover your passport — apply only if you have pre-existing work rights." },
    unknown: { cls: "bg-white/10 border-white/20 text-white/70",              l: "Add passport",desc: "Add your passport to your Twin for an instant visa-fit read." },
  } as const;
  const fm = fitMeta[fit];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <Link href="/app/discover" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to Discover
      </Link>

      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/15 blur-[80px]" />
        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                <Building2 className="h-3 w-3" /> {job.company.name}
              </span>
              {job.visaTier ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-300">
                  <ShieldCheck className="h-3 w-3" /> {job.visaTier}
                </span>
              ) : null}
            </div>
            <h1 className="mt-5 font-sans text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              {job.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {job.location ?? "Remote"}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} /> <span className="capitalize">{job.seniority ?? "—"}</span>{job.employmentType ? ` · ${job.employmentType.replace("_", "-")}` : ""}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} /> {salary(job.salaryMin, job.salaryMax, job.currency)}</span>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
              <Clock className="h-3 w-3" />
              Posted {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "recently"} · {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}
            </p>
          </div>

          {/* Match ring */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Your match</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-sans text-[56px] font-semibold leading-none tracking-[-0.035em] text-parchment">{score}</span>
              <span className="text-[13px] text-white/60">/ 100</span>
            </div>
            <div className="mt-4 h-[4px] w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-gilt-400 to-lagoon-300" style={{ width: `${Math.max(4, score)}%` }} />
            </div>
            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${fm.cls}`}>
                <ShieldCheck className="h-3 w-3" /> {fm.l}
              </span>
              <p className="text-[12px] text-white/70 leading-[1.55]">{fm.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apply row */}
      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 md:p-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">One-click apply</p>
          <p className="mt-1 font-sans text-[16px] font-semibold text-ink-900">Your Twin becomes your CV. No re-typing.</p>
          <p className="mt-1 text-[13px] text-ink-600 max-w-lg">
            We send your profession, years of experience, passport, and current country directly to {job.company.name}'s hiring pipeline. You'll hear back inside the platform.
          </p>
        </div>
        <ApplyButton jobId={job.id} initialApplied={alreadyApplied} readiness={{ profession: twin.profession, passport: twin.passport }} />
      </section>

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
                <FileText className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">About the role</p>
                <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Description</h2>
              </div>
            </div>
            <div className="mt-5 text-[14px] leading-[1.7] text-ink-700 whitespace-pre-wrap">
              {job.description || <span className="italic text-ink-400">The employer hasn't added a description yet.</span>}
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-100 text-gilt-800">
                <ListChecks className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Must-haves</p>
                <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Requirements</h2>
              </div>
            </div>
            <div className="mt-5 text-[14px] leading-[1.7] text-ink-700 whitespace-pre-wrap">
              {job.requirements || <span className="italic text-ink-400">No specific requirements listed.</span>}
            </div>
          </section>

          <section className="rounded-2xl border border-lagoon-200 bg-lagoon-50/40 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-500 text-white">
                <Sparkles className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">Copilot summary</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">Why this is a {score >= 80 ? "strong" : score >= 60 ? "decent" : "stretch"} fit</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13.5px] text-ink-700">
              {twin.profession && job.title.toLowerCase().includes(twin.profession.split(" ")[0]?.toLowerCase() ?? "") ? (
                <li>✓ Your profession ({twin.profession}) overlaps the role title directly.</li>
              ) : null}
              {twin.passport && job.eligiblePassports.includes(twin.passport) ? (
                <li>✓ Your {twin.passport} passport is explicitly listed as eligible for this visa route.</li>
              ) : null}
              {twin.yearsExp != null ? (
                <li>{twin.yearsExp >= 5 ? "✓" : "•"} You have {twin.yearsExp} years of experience {job.seniority ? `against a "${job.seniority}" bar.` : ""}</li>
              ) : null}
              <li className="italic text-ink-500 text-[12px] pt-2">
                Scoring is a mock heuristic today — the real matching engine lands in phase 2.
              </li>
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Visa eligibility</p>
            <p className="mt-2 text-[13px] text-ink-700 leading-[1.55]">
              This role accepts candidates holding these passports:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.eligiblePassports.length === 0 ? (
                <span className="text-[12.5px] italic text-ink-400">No explicit list set</span>
              ) : (
                job.eligiblePassports.map((p) => (
                  <span
                    key={p}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold ${
                      twin.passport === p
                        ? "border-lagoon-400 bg-lagoon-50 text-lagoon-800"
                        : "border-ink-200 bg-parchment text-ink-800"
                    }`}
                  >
                    <Globe2 className="h-3 w-3" strokeWidth={1.75} />
                    {p}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-ink-900 p-6 text-parchment relative overflow-hidden">
            <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lagoon-500/20 blur-[50px]" />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lagoon-300">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-sans text-[15px] font-semibold">{job.company.name}</p>
              {job.company.industry ? (
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {job.company.industry} · {job.company.size ?? ""}
                </p>
              ) : null}
              {job.company.about ? (
                <p className="mt-3 text-[12.5px] text-white/70 leading-[1.55]">{job.company.about}</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
