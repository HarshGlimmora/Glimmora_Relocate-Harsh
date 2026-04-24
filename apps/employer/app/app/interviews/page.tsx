import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar, Clock, Phone, Code2, Building, Trophy, ArrowRight, MessageSquare,
  Star, Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Interviews" };

const kindMeta: Record<string, { label: string; icon: typeof Phone; cls: string }> = {
  PHONE:     { label: "Phone screen",    icon: Phone,    cls: "bg-ink-50 border-ink-200 text-ink-800" },
  TECHNICAL: { label: "Technical",       icon: Code2,    cls: "bg-lagoon-50 border-lagoon-100 text-lagoon-800" },
  ONSITE:    { label: "Onsite",          icon: Building, cls: "bg-gilt-50 border-gilt-200 text-gilt-800" },
  FINAL:     { label: "Final",           icon: Trophy,   cls: "bg-success-50 border-success-100 text-success-800" },
};

export default async function InterviewsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const m = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!m) return null;

  const interviews = await prisma.interview.findMany({
    where: { application: { job: { companyId: m.companyId } } },
    include: { application: { include: { job: { select: { id: true, title: true } } } } },
    orderBy: { scheduledAt: "asc" },
  });

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = interviews.filter((i) => i.scheduledAt && i.scheduledAt > now);
  const past = interviews.filter((i) => i.scheduledAt && i.scheduledAt <= now);
  const awaitingFeedback = past.filter((i) => !i.rating);
  const withFeedback = past.filter((i) => i.rating);
  const thisWeek = upcoming.filter((i) => i.scheduledAt! <= weekAhead);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Interviews</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Schedule and score.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          One place for phone, technical, onsite, and final rounds. Feedback from every interviewer rolls up to one decision page. Start a new round from any candidate in <Link href="/app/candidates" className="font-medium text-ink-900 underline decoration-ink-300 decoration-1 underline-offset-4 hover:decoration-ink-900">Pipeline</Link>.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <StatCard n={upcoming.length} l="Scheduled" sub="upcoming" />
        <StatCard n={thisWeek.length} l="This week" sub="next 7 days" tone="lagoon" />
        <StatCard n={awaitingFeedback.length} l="Awaiting feedback" sub="past rounds, no scorecard" tone={awaitingFeedback.length > 0 ? "gilt" : undefined} />
      </section>

      {/* Upcoming */}
      <section className="mb-12">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Upcoming</span>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState icon={Calendar} title="Nothing scheduled." desc="Shortlist a candidate and the scheduling flow begins." cta="Shortlist candidates" href="/app/candidates" />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((i) => <UpcomingRow key={i.id} i={i} />)}
          </ul>
        )}
      </section>

      {/* Needs feedback */}
      {awaitingFeedback.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">02</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Needs feedback</span>
          </div>
          <ul className="space-y-3">
            {awaitingFeedback.map((i) => <FeedbackRow key={i.id} i={i} />)}
          </ul>
        </section>
      ) : null}

      {/* Completed */}
      {withFeedback.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{awaitingFeedback.length > 0 ? "03" : "02"}</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Recent feedback</span>
          </div>
          <ul className="space-y-3">
            {withFeedback.map((i) => <CompletedRow key={i.id} i={i} />)}
          </ul>
        </section>
      ) : null}

      {/* Copilot callout */}
      <section className="mt-4 rounded-[28px] bg-ink-900 p-10 text-parchment md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lagoon-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lagoon-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Interview AI prep — coming W5.
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/70 leading-[1.6]">
              Candidates prep with Copilot-run mock interviews. You see a "prep readiness" signal alongside their application.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-300 self-start md:self-center">Roadmap</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ n, l, sub, tone }: { n: number; l: string; sub?: string; tone?: "lagoon" | "gilt" }) {
  const map = {
    lagoon: "bg-lagoon-50 border-lagoon-100 text-lagoon-800",
    gilt:   "bg-gilt-50 border-gilt-200 text-gilt-800",
  } as const;
  const bg = tone ? map[tone] : "bg-white border-ink-200 text-ink-500";
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <p className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${tone ? "" : "text-ink-500"}`}>{l}</p>
      <p className="mt-2 font-sans text-[40px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      {sub ? <p className={`mt-2 text-[11.5px] font-medium ${tone ? "" : "text-ink-500"}`}>{sub}</p> : null}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, href }: { icon: typeof Calendar; title: string; desc: string; cta: string; href: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <Icon className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">{desc}</p>
      <Link href={href} className="btn-accent mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function formatWhen(d: Date | null) {
  if (!d) return "Unscheduled";
  const now = new Date();
  const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (same(d, now)) return `Today · ${time}`;
  if (same(d, tomorrow)) return `Tomorrow · ${time}`;
  if (same(d, yesterday)) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
}

type Row = Awaited<ReturnType<typeof prisma.interview.findMany>>[number] & {
  application: { id: string; candidateName: string; passport: string | null; profession: string | null; job: { id: string; title: string } };
};

function UpcomingRow({ i }: { i: Row }) {
  const meta = kindMeta[i.kind] ?? kindMeta.PHONE;
  const MIcon = meta.icon;
  const isSoon = i.scheduledAt && (i.scheduledAt.getTime() - Date.now()) < 24 * 60 * 60 * 1000;
  return (
    <li className="group relative rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:p-6">
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-ink-200 bg-parchment px-4 py-3 shrink-0 w-[96px]">
          {i.scheduledAt ? (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                {i.scheduledAt.toLocaleDateString("en-GB", { month: "short" })}
              </span>
              <span className="font-sans text-[26px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
                {i.scheduledAt.getDate()}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-ink-700 font-medium">
                {i.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">TBD</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/candidates/${i.application.id}`}
              className="before:absolute before:inset-0 before:rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-lagoon-600/15 font-sans text-[17px] font-semibold tracking-tight text-ink-900"
            >
              {i.application.candidateName}
            </Link>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${meta.cls}`}>
              <MIcon className="h-3 w-3" />
              {meta.label}
            </span>
            {isSoon ? (
              <span className="inline-flex rounded-full bg-gilt-50 border border-gilt-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium text-gilt-800">
                Soon
              </span>
            ) : null}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
            <span>{i.application.profession ?? "—"} · {i.application.passport ?? "—"}</span>
            <span className="text-ink-300">·</span>
            <span className="truncate">{i.application.job.title}</span>
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-600">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {i.duration ?? 60}m</span>
            <span className="text-ink-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-ink-900 text-[9px] font-semibold text-parchment inline-flex items-center justify-center">
                {(i.interviewer ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </span>
              {i.interviewer ?? "Unassigned"}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 font-medium">
            {formatWhen(i.scheduledAt)}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-400">
            Open candidate →
          </span>
        </div>
      </div>
    </li>
  );
}

function FeedbackRow({ i }: { i: Row }) {
  const meta = kindMeta[i.kind] ?? kindMeta.PHONE;
  const MIcon = meta.icon;
  return (
    <li className="relative rounded-2xl border border-gilt-200 bg-gilt-50/30 p-5 transition-all md:p-6">
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gilt-100 text-gilt-800">
          <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/candidates/${i.application.id}`}
              className="relative z-10 font-sans text-[15.5px] font-semibold tracking-tight text-ink-900 hover:underline decoration-ink-300 decoration-1 underline-offset-4"
            >
              {i.application.candidateName}
            </Link>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${meta.cls}`}>
              <MIcon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-600">
            {i.interviewer ?? "Interviewer"} · {formatWhen(i.scheduledAt)}
          </p>
        </div>
        <FeedbackForm
          interviewId={i.id}
          candidateName={i.application.candidateName}
          kindLabel={meta.label}
          interviewer={i.interviewer}
        />
      </div>
    </li>
  );
}

function CompletedRow({ i }: { i: Row }) {
  const meta = kindMeta[i.kind] ?? kindMeta.PHONE;
  const MIcon = meta.icon;
  return (
    <li className="relative rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-start gap-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-parchment">
          {i.application.candidateName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/candidates/${i.application.id}`}
              className="before:absolute before:inset-0 before:rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-lagoon-600/15 font-sans text-[15px] font-semibold tracking-tight text-ink-900"
            >
              {i.application.candidateName}
            </Link>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${meta.cls}`}>
              <MIcon className="h-3 w-3" />
              {meta.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              {formatWhen(i.scheduledAt)} · {i.interviewer}
            </span>
          </div>
          {i.feedback ? (
            <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-700">
              "{i.feedback}"
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${n <= (i.rating ?? 0) ? "fill-gilt-500 text-gilt-500" : "text-ink-200"}`}
              strokeWidth={1.5}
            />
          ))}
        </div>
      </div>
    </li>
  );
}
