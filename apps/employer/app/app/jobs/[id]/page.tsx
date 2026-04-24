import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Briefcase, Building2, Clock, DollarSign,
  MapPin, ShieldCheck, Sparkles, FileText, ListChecks, Globe2, ChevronRight, Pencil,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { relativeTime } from "@/lib/utils";
import { StatusActions } from "./status-actions";

export const metadata: Metadata = { title: "Role" };

const stageOrder = ["NEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;
const stageLabel: Record<string, string> = {
  NEW: "New", SHORTLISTED: "Shortlisted", INTERVIEW: "Interview",
  OFFER: "Offer", HIRED: "Hired", REJECTED: "Rejected",
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return null;

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      applications: { select: { id: true, stage: true, candidateName: true, matchScore: true, visaFit: true, passport: true, profession: true } },
    },
  });
  if (!job || job.companyId !== membership.companyId) notFound();

  const passports: string[] = JSON.parse(job.eligiblePassports || "[]");
  const byStage: Record<string, number> = {};
  for (const s of stageOrder) byStage[s] = 0;
  for (const a of job.applications) byStage[a.stage] = (byStage[a.stage] ?? 0) + 1;
  const total = job.applications.length;
  const top = [...job.applications].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

  const salary = job.salaryMin || job.salaryMax
    ? `${job.currency} ${job.salaryMin ? job.salaryMin / 1000 + "k" : ""}${job.salaryMax ? "–" + job.salaryMax / 1000 + "k" : ""}`
    : "Not set";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <Link
        href="/app/jobs"
        className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to jobs
      </Link>

      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lagoon-500/25 blur-[70px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-gilt-500/15 blur-[80px]" />
        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <HeroPill status={job.status} />
              {job.visaSponsorship && job.visaTier ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-300">
                  <ShieldCheck className="h-3 w-3" /> {job.visaTier}
                </span>
              ) : null}
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/50">
                {job.department ?? "—"}
              </span>
            </div>
            <h1 className="mt-5 font-sans text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              {job.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {job.location || "Remote"}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} /> <span className="capitalize">{job.seniority}</span>{job.employmentType ? ` · ${job.employmentType.replace("_", "-")}` : ""}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} /> {salary}</span>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
              <Clock className="h-3 w-3" />
              {job.publishedAt ? `Published ${relativeTime(job.publishedAt)}` : "Draft — not published"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Pipeline</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-sans text-[56px] font-semibold leading-none tracking-[-0.035em] text-parchment">{total}</span>
              <span className="text-[13px] text-white/60">applicant{total === 1 ? "" : "s"}</span>
            </p>
            <div className="mt-5 space-y-2">
              {stageOrder.slice(0, 4).map((s) => (
                <div key={s} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{stageLabel[s]}</span>
                  <span className="font-sans text-[13px] font-semibold text-parchment">{byStage[s]}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/app/candidates?job=${job.id}`}
              className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-lagoon-500 px-4 text-[13px] font-semibold text-white hover:bg-lagoon-600 transition-colors"
            >
              View candidates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Description */}
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
              {job.description || <span className="italic text-ink-400">No description yet. Add one so candidates know what they'd be building.</span>}
            </div>
          </section>

          {/* Requirements */}
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
              {job.requirements || <span className="italic text-ink-400">No requirements yet.</span>}
            </div>
          </section>

          {/* Top matches */}
          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-800">
                <Sparkles className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">AI-ranked</p>
                <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Top matches</h2>
              </div>
            </div>
            {top.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-8 text-center">
                <p className="text-[13px] text-ink-500">No applicants yet. When candidates apply, the strongest matches appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {top.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/app/candidates/${a.id}`}
                      className="group flex items-center gap-4 py-3 transition-colors hover:bg-ink-50/60 -mx-2 px-2 rounded-lg"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
                        {a.candidateName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-[14px] font-semibold text-ink-900 truncate">{a.candidateName}</p>
                        <p className="mt-0.5 text-[12px] text-ink-500 truncate">{a.profession ?? "—"} · {a.passport ?? "—"}</p>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-lagoon-200 bg-lagoon-50 font-sans text-[13px] font-semibold text-lagoon-800">
                        {a.matchScore}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-ink-900" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Actions</p>
            <div className="mt-4 space-y-2.5">
              <Link
                href={`/app/jobs/${job.id}/edit`}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink-900 px-4 text-[13px] font-medium text-parchment transition-colors hover:bg-ink-800"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit role
              </Link>
              <StatusActions jobId={job.id} status={job.status} title={job.title} />
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Visa eligibility</p>
            <p className="mt-3 text-[13px] text-ink-700">
              This role accepts candidates holding these passports:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {passports.length === 0 ? (
                <span className="text-[12.5px] italic text-ink-400">None set</span>
              ) : (
                passports.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-parchment px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-800">
                    <Globe2 className="h-3 w-3 text-ink-500" strokeWidth={1.75} />
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
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                Posted by Kontra hiring team
              </p>
              <Link
                href="/app/company"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-300 hover:text-lagoon-200 font-medium"
              >
                Company profile <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HeroPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; l: string }> = {
    ACTIVE:  { bg: "bg-success-500/20 border-success-400/30 text-success-300", l: "Active" },
    DRAFT:   { bg: "bg-white/10 border-white/20 text-white/80",                  l: "Draft"  },
    CLOSED:  { bg: "bg-white/5 border-white/10 text-white/40",                   l: "Closed" },
  };
  const v = map[status] ?? map.DRAFT;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${v.bg}`}>{v.l}</span>;
}
