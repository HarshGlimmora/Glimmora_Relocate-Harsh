import type { Metadata } from "next";
import Link from "next/link";
import { Users, Filter, Search, X } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Candidates" };

const stages = ["NEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams?: { job?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return null;

  const jobFilter = searchParams?.job?.trim() || undefined;

  // If a job filter is set, confirm it belongs to this company and load it for the chip
  const filteredJob = jobFilter
    ? await prisma.job.findFirst({
        where: { id: jobFilter, companyId: membership.companyId },
        select: { id: true, title: true },
      })
    : null;

  const apps = await prisma.application.findMany({
    where: {
      job: { companyId: membership.companyId },
      ...(filteredJob ? { jobId: filteredJob.id } : {}),
    },
    include: { job: { select: { title: true } } },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
  });

  const byStage = stages.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.stage === s);
    return acc;
  }, {} as Record<string, typeof apps>);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Candidates</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Pipeline.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            AI-ranked, pre-filtered by your sponsorship policy. Drag or click to move candidates between stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </header>

      {filteredJob ? (
        <div className="mb-6 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Filtered by role:</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-lagoon-200 bg-lagoon-50 pl-3 pr-1 py-1 text-[12.5px] font-medium text-lagoon-900">
            {filteredJob.title}
            <Link
              href="/app/candidates"
              aria-label="Clear filter"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-800 transition-colors hover:bg-lagoon-200"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </span>
        </div>
      ) : null}

      {/* Search */}
      <section className="mb-8">
        <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-5 py-3.5">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            placeholder="Search by name, country, profession…"
            className="flex-1 bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
      </section>

      {apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Users className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">
            {filteredJob ? "No candidates for this role yet." : "No candidates yet."}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            {filteredJob
              ? "As candidates apply, they appear here — visa-matched and ranked."
              : "Post a visa-aware role and matching candidates start appearing here."}
          </p>
        </div>
      ) : (
        <>
          {/* Kanban columns */}
          <section className="overflow-x-auto pb-4">
            <div className="flex min-w-fit gap-4">
              {stages.map((s) => (
                <div key={s} className="w-[280px] shrink-0">
                  <StageHeader stage={s} count={byStage[s].length} />
                  <div className="mt-3 space-y-3">
                    {byStage[s].slice(0, 6).map((a) => (
                      <CandidateCard
                        key={a.id}
                        id={a.id}
                        name={a.candidateName}
                        prof={a.profession}
                        years={a.yearsExp}
                        passport={a.passport}
                        score={a.matchScore}
                        visa={a.visaFit}
                        job={a.job.title}
                      />
                    ))}
                    {byStage[s].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-ink-200 bg-parchment/50 px-3 py-6 text-center">
                        <p className="text-[12px] text-ink-400">No candidates</p>
                      </div>
                    ) : null}
                    {byStage[s].length > 6 ? (
                      <button className="w-full rounded-xl border border-ink-200 bg-parchment py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:bg-white font-medium">
                        + {byStage[s].length - 6} more
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StageHeader({ stage, count }: { stage: string; count: number }) {
  const map: Record<string, { label: string; bg: string; dot: string }> = {
    NEW:         { label: "New",          bg: "bg-ink-50 border-ink-200 text-ink-800",               dot: "bg-ink-400" },
    SHORTLISTED: { label: "Shortlisted",  bg: "bg-lagoon-50 border-lagoon-100 text-lagoon-800",       dot: "bg-lagoon-500" },
    INTERVIEW:   { label: "Interview",    bg: "bg-gilt-50 border-gilt-200 text-gilt-800",             dot: "bg-gilt-500" },
    OFFER:       { label: "Offer",        bg: "bg-success-50 border-success-100 text-success-800",   dot: "bg-success-500" },
    HIRED:       { label: "Hired",        bg: "bg-success-100 border-success-200 text-success-800",  dot: "bg-success-600" },
    REJECTED:    { label: "Rejected",     bg: "bg-danger-50 border-danger-100 text-danger-700",      dot: "bg-danger-400" },
  };
  const v = map[stage];
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${v.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] font-semibold">{v.label}</span>
      </div>
      <span className="font-sans text-[13px] font-semibold">{count}</span>
    </div>
  );
}

function CandidateCard({ id, name, prof, years, passport, score, visa, job }: {
  id: string; name: string; prof: string | null; years: number | null; passport: string | null; score: number; visa: string; job: string;
}) {
  return (
    <Link href={`/app/candidates/${id}`} className="group block w-full rounded-xl border border-ink-200 bg-white p-4 text-left transition-all hover:border-ink-900 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
            {name.split(" ").map((s) => s[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{name}</p>
            <p className="truncate text-[11px] text-ink-500">{passport ?? "—"}</p>
          </div>
        </div>
        <span className="font-sans text-[16px] font-semibold text-ink-900">{score}</span>
      </div>
      {prof ? (
        <p className="mt-3 text-[12px] text-ink-600 line-clamp-1">
          {prof} · {years ?? "?"}y
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{job}</span>
        <VisaChip fit={visa} />
      </div>
    </Link>
  );
}

function VisaChip({ fit }: { fit: string }) {
  const map: Record<string, { c: string; l: string }> = {
    yes:     { c: "bg-lagoon-50 border-lagoon-100 text-lagoon-800", l: "Visa ready" },
    maybe:   { c: "bg-gilt-50 border-gilt-200 text-gilt-800",       l: "Check" },
    no:      { c: "bg-danger-50 border-danger-100 text-danger-700", l: "Blocked" },
    unknown: { c: "bg-ink-50 border-ink-200 text-ink-700",          l: "—" },
  };
  const v = map[fit] ?? map.unknown;
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${v.c}`}>{v.l}</span>
  );
}
