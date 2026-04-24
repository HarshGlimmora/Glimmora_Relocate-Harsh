import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase, Plus, ArrowRight, ArrowUpRight, Sparkles, Building2, MapPin, Clock,
  CheckCircle2, Circle, MessageSquare, Trophy, ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { listApplicationsForEmail, type EmployerApplication } from "@/lib/employer-api";

export const metadata: Metadata = { title: "Career" };

const stageMeta: Record<string, { label: string; cls: string; Icon: typeof Briefcase }> = {
  NEW:         { label: "Submitted",   cls: "bg-ink-50 border-ink-200 text-ink-700",               Icon: Circle        },
  SHORTLISTED: { label: "Shortlisted", cls: "bg-lagoon-50 border-lagoon-100 text-lagoon-800",      Icon: Sparkles      },
  INTERVIEW:   { label: "Interview",   cls: "bg-gilt-50 border-gilt-200 text-gilt-800",            Icon: MessageSquare },
  OFFER:       { label: "Offer",       cls: "bg-success-50 border-success-100 text-success-800",  Icon: Trophy        },
  HIRED:       { label: "Hired",       cls: "bg-success-100 border-success-200 text-success-800", Icon: CheckCircle2  },
  REJECTED:    { label: "Closed",      cls: "bg-ink-50 border-ink-200 text-ink-500",              Icon: Circle        },
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

function money(n: number | null, currency: string | null) {
  if (!n) return "—";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${(n / 1000).toFixed(0)}k`;
}

export default async function CareerPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { twin: true },
  });
  if (!user) return null;

  let apps: EmployerApplication[] = [];
  let apiError: string | null = null;
  try {
    apps = await listApplicationsForEmail(user.email);
  } catch (e) {
    apiError = e instanceof Error ? e.message : "Could not fetch applications";
  }

  const counts = {
    applications: apps.length,
    interviews: apps.filter((a) => a.stage === "INTERVIEW" || a.nextInterview).length,
    offers: apps.filter((a) => a.activeOffer || a.stage === "OFFER" || a.stage === "HIRED").length,
  };

  const nextStep = apps.find((a) => a.nextInterview)
    ? `Prep for ${apps.find((a) => a.nextInterview)?.job.title}`
    : apps.find((a) => a.activeOffer?.status === "SENT")
      ? "Review your offer"
      : apps.some((a) => a.stage === "SHORTLISTED")
        ? "Watch for interview invite"
        : apps.length === 0
          ? "Start applying"
          : "Wait for response";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Career</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            The job side of your move.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Visa-aware search, one-click apply with your Twin, and every application tracked to offer.
          </p>
        </div>
        <Link href="/app/discover" className="btn-primary inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
          <Plus className="h-4 w-4" /> Find jobs
        </Link>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <StatTile n={String(counts.applications)} l="Applications" />
        <StatTile n={String(counts.interviews)}   l="Interviews"   tone={counts.interviews > 0 ? "gilt" : undefined} />
        <StatTile n={String(counts.offers)}       l="Offers"       tone={counts.offers > 0 ? "lagoon" : undefined} />
        <StatTile n="→"                           l="Next step"    sub={nextStep} />
      </section>

      {apiError ? (
        <div className="mb-8 rounded-2xl border border-danger-200 bg-danger-50 p-5 text-[13px] text-danger-700">
          <p className="font-semibold">Employer portal unreachable.</p>
          <p className="mt-1 text-[12.5px]">{apiError}</p>
        </div>
      ) : null}

      {/* Applications */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Your applications</span>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <Briefcase className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No applications yet.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              Open Discover to see visa-aware roles for your passport. One click sends your Twin to the employer.
            </p>
            <Link href="/app/discover" className="btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
              Find jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => {
              const stage = stageMeta[a.stage] ?? stageMeta.NEW;
              const SI = stage.Icon;
              return (
                <li
                  key={a.id}
                  className="group relative rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6"
                >
                  <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/app/discover/jobs/${a.job.id}`}
                          className="font-sans text-[15.5px] font-semibold tracking-tight text-ink-900 hover:underline decoration-ink-300 decoration-1 underline-offset-4"
                        >
                          {a.job.title}
                        </Link>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${stage.cls}`}>
                          <SI className="h-3 w-3" />
                          {stage.label}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {a.job.company.name}</span>
                        {a.job.location ? (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.job.location}</span>
                          </>
                        ) : null}
                        {a.job.visaTier ? (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {a.job.visaTier}</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="min-w-0 text-[12.5px] text-ink-600">
                      {a.nextInterview?.scheduledAt ? (
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-gilt-50 border border-gilt-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
                          <MessageSquare className="h-3 w-3" />
                          {a.nextInterview.kind.toLowerCase()} · {new Date(a.nextInterview.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      ) : a.activeOffer ? (
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-success-50 border border-success-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-success-700 font-medium">
                          <Trophy className="h-3 w-3" />
                          Offer {a.activeOffer.status.toLowerCase()} · {money(a.activeOffer.baseSalary, a.activeOffer.currency)}
                        </p>
                      ) : (
                        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                          <Clock className="h-3 w-3" />
                          Applied {relTime(a.appliedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <div className="text-right">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Match</p>
                        <p className={`mt-0.5 font-sans text-[17px] font-semibold ${a.matchScore >= 80 ? "text-lagoon-700" : a.matchScore >= 60 ? "text-gilt-800" : "text-ink-700"}`}>
                          {a.matchScore}
                        </p>
                      </div>
                      <Link
                        href={`/app/discover/jobs/${a.job.id}`}
                        aria-label="Open role"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-900 hover:text-ink-900"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Career sub-modules */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Career tools</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ToolCard
            title="Resume & Cover Letters"
            desc="Copilot tailors your materials per role, in the employer's language."
            badge="W3"
          />
          <ToolCard
            title="Interview AI"
            desc="Mock rounds with a Copilot interviewer — your Twin adapts after each session."
            badge="W5"
          />
          <ToolCard
            title="Offer & Negotiation"
            desc="Structured offers arrive here. Compare across countries, net of tax."
            badge="Live"
            tone="lagoon"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Let the Copilot hunt while you sleep.
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              Leave your Twin visible to employers who sponsor your passport. Pre-screened matches arrive as shortlists you can accept in one tap.
            </p>
          </div>
          <Link href="/app/messages" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
            Open Copilot <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatTile({ n, l, sub, tone }: { n: string; l: string; sub?: string; tone?: "lagoon" | "gilt" }) {
  const bg = tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
             tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
             "bg-white border-ink-200";
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{l}</p>
      <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      {sub ? <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p> : null}
    </div>
  );
}

function ToolCard({
  title, desc, badge, tone,
}: { title: string; desc: string; badge: string; tone?: "lagoon" }) {
  const badgeCls = tone === "lagoon"
    ? "bg-lagoon-50 border-lagoon-200 text-lagoon-800"
    : "bg-ink-100 border-ink-200 text-ink-600";
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">{title}</p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${badgeCls}`}>
          {badge}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-ink-600 leading-[1.55]">{desc}</p>
    </article>
  );
}
