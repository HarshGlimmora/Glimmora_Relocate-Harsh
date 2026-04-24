import type { Metadata } from "next";
import Link from "next/link";
import { Plus, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return null;

  const jobs = await prisma.job.findMany({
    where: { companyId: membership.companyId },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  const active = jobs.filter((j) => j.status === "ACTIVE").length;
  const drafts = jobs.filter((j) => j.status === "DRAFT").length;
  const closed = jobs.filter((j) => j.status === "CLOSED").length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Jobs</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Your open roles.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Post, edit, and manage visa-aware roles. Each role is pre-filtered against your sponsorship policy.
          </p>
        </div>
        <Link href="/app/jobs/new" className="btn-accent inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
          <Plus className="h-4 w-4" /> Post a new role
        </Link>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <StatCard n={active} l="Active" />
        <StatCard n={drafts} l="Drafts" />
        <StatCard n={closed} l="Closed" />
      </section>

      <section>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <h3 className="font-sans text-[20px] font-semibold tracking-tight text-ink-900">No roles yet.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              Post your first role — candidates start matching within minutes.
            </p>
            <Link href="/app/jobs/new" className="btn-accent mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
              Post your first role
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((j) => {
              const passports: string[] = JSON.parse(j.eligiblePassports || "[]");
              return (
                <li
                  key={j.id}
                  className="group relative rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-[17px] font-semibold tracking-tight text-ink-900">
                          <Link
                            href={`/app/jobs/${j.id}`}
                            className="before:absolute before:inset-0 before:rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-lagoon-600/15"
                          >
                            {j.title}
                          </Link>
                        </h3>
                        <StatusPill status={j.status} />
                        {j.visaSponsorship && j.visaTier ? (
                          <span className="rounded-full bg-lagoon-50 border border-lagoon-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800">
                            {j.visaTier}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.location || "—"}</span>
                        <span className="text-ink-300">·</span>
                        <span className="capitalize">{j.seniority}</span>
                        <span className="text-ink-300">·</span>
                        <span>{j.salaryMin ? `${j.currency} ${j.salaryMin/1000}k` : ""}{j.salaryMax ? `–${j.salaryMax/1000}k` : ""}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {passports.slice(0, 6).map((p) => (
                          <span key={p} className="rounded-full border border-ink-200 bg-white px-2 py-0.5 font-mono text-[10px] text-ink-700">
                            {p}
                          </span>
                        ))}
                        {passports.length > 6 ? (
                          <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] text-ink-500">+{passports.length - 6}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-baseline gap-1.5">
                        <Users className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.75} />
                        <span className="font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{j._count.applications}</span>
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">applicants</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      <Clock className="h-3 w-3" />
                      {j.publishedAt ? `Published ${relativeTime(j.publishedAt)}` : "Not published"}
                    </span>
                    <Link
                      href={`/app/candidates?job=${j.id}`}
                      className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 font-medium transition-colors hover:border-lagoon-500 hover:bg-lagoon-50 hover:text-lagoon-800"
                    >
                      View candidates <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{l}</p>
      <p className="mt-2 font-sans text-[40px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; l: string }> = {
    ACTIVE:  { bg: "bg-success-50 border-success-100 text-success-700", l: "Active" },
    DRAFT:   { bg: "bg-ink-50 border-ink-200 text-ink-700",             l: "Draft"  },
    CLOSED:  { bg: "bg-ink-100 border-ink-200 text-ink-500",            l: "Closed" },
  };
  const v = map[status] ?? map.DRAFT;
  return <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${v.bg}`}>{v.l}</span>;
}
