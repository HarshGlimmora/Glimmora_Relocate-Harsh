import type { Metadata } from "next";
import Link from "next/link";
import {
  HandCoins, Sparkles, Calendar, Gift, TrendingUp, Plane, Clock,
  CheckCircle2, XCircle, FileEdit, ArrowRight, Send,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SendOfferButton, RespondButtons } from "./offer-actions";

export const metadata: Metadata = { title: "Offers" };

const currencySymbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };

function money(n: number, cur: string) {
  const s = currencySymbols[cur] ?? "";
  return `${s}${n.toLocaleString("en-GB")}`;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function relativeTime(d: Date) {
  const days = daysBetween(d, new Date());
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

export default async function OffersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) return null;

  const offers = await prisma.offer.findMany({
    where: { application: { job: { companyId: membership.companyId } } },
    include: { application: { include: { job: { select: { id: true, title: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  const drafts = offers.filter((o) => o.status === "DRAFT");
  const sent = offers.filter((o) => o.status === "SENT");
  const accepted = offers.filter((o) => o.status === "ACCEPTED");
  const closed = offers.filter((o) => o.status === "DECLINED" || o.status === "WITHDRAWN");

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Offers</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Make an offer. <br className="hidden md:block" /> Hand off to relocation.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Structured offers, acceptance tracking, and automatic hand-off into the candidate's Glimmora plan. Draft from any candidate on <Link href="/app/candidates" className="font-medium text-ink-900 underline decoration-ink-300 decoration-1 underline-offset-4 hover:decoration-ink-900">Pipeline</Link>.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <StatCard n={drafts.length} l="Drafts" sub="not yet sent" />
        <StatCard n={sent.length} l="Awaiting response" sub="with the candidate" tone="gilt" />
        <StatCard n={accepted.length} l="Accepted" sub="handed to relocation" tone="lagoon" />
      </section>

      {/* Awaiting response */}
      {sent.length > 0 ? (
        <Section num="01" label="Awaiting response" tone="gilt">
          <ul className="space-y-3">
            {sent.map((o) => <AwaitingRow key={o.id} offer={o} />)}
          </ul>
        </Section>
      ) : null}

      {/* Drafts */}
      {drafts.length > 0 ? (
        <Section num={sent.length > 0 ? "02" : "01"} label="Drafts">
          <ul className="space-y-3">
            {drafts.map((o) => <DraftRow key={o.id} offer={o} />)}
          </ul>
        </Section>
      ) : null}

      {/* Accepted */}
      {accepted.length > 0 ? (
        <Section
          num={`${String((sent.length > 0 ? 1 : 0) + (drafts.length > 0 ? 1 : 0) + 1).padStart(2, "0")}`}
          label="Accepted — hand off live"
          tone="lagoon"
        >
          <ul className="space-y-3">
            {accepted.map((o) => <AcceptedRow key={o.id} offer={o} />)}
          </ul>
        </Section>
      ) : null}

      {/* Closed */}
      {closed.length > 0 ? (
        <Section num="—" label="Closed">
          <ul className="space-y-3">
            {closed.map((o) => <ClosedRow key={o.id} offer={o} />)}
          </ul>
        </Section>
      ) : null}

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <HandCoins className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No offers yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            When you're ready to extend one, draft it from a candidate at the Offer stage.
          </p>
          <Link href="/app/candidates" className="btn-accent mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
            Choose a candidate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Copilot callout */}
      <section className="mt-12 rounded-[28px] bg-lagoon-500 p-10 text-parchment md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-[70px]" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Acceptance triggers their Glimmora plan.
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] text-white/85 leading-[1.6]">
              When a candidate accepts, Glimmora expands their relocation into a full timeline — docs, housing, school, bank — so they're ready by start date.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ num, label, tone, children }: { num: string; label: string; tone?: "lagoon" | "gilt"; children: React.ReactNode }) {
  const toneCls =
    tone === "lagoon" ? "text-lagoon-700" :
    tone === "gilt"   ? "text-gilt-800"   :
    "text-ink-700";
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${toneCls}`}>{label}</span>
      </div>
      {children}
    </section>
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

type Row = Awaited<ReturnType<typeof prisma.offer.findMany>>[number] & {
  application: { id: string; candidateName: string; passport: string | null; profession: string | null; job: { id: string; title: string } };
};

function CompSummary({ o }: { o: Row }) {
  const totalBonus = o.bonusPct ? Math.round((o.baseSalary * o.bonusPct) / 100) : 0;
  const otr = o.baseSalary + totalBonus;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
        {money(o.baseSalary, o.currency)}
      </span>
      {o.bonusPct ? (
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
          + {o.bonusPct}% bonus · OTE {money(otr, o.currency)}
        </span>
      ) : null}
    </div>
  );
}

function Perks({ o }: { o: Row }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-600">
      {o.equity ? (
        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {o.equity}</span>
      ) : null}
      {o.signingBonus ? (
        <span className="inline-flex items-center gap-1"><Gift className="h-3 w-3" /> {money(o.signingBonus, o.currency)} signing</span>
      ) : null}
      {o.relocationBenefit ? (
        <span className="inline-flex items-center gap-1"><Plane className="h-3 w-3" /> {o.relocationBenefit}</span>
      ) : null}
      {o.startDate ? (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Start {o.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      ) : null}
    </div>
  );
}

function CandidateHead({ o }: { o: Row }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12.5px] font-semibold text-parchment">
        {o.application.candidateName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
      </span>
      <div className="min-w-0">
        <Link
          href={`/app/candidates/${o.application.id}`}
          className="relative z-10 font-sans text-[15.5px] font-semibold tracking-tight text-ink-900 hover:underline decoration-ink-300 decoration-1 underline-offset-4"
        >
          {o.application.candidateName}
        </Link>
        <p className="mt-0.5 text-[12px] text-ink-500">
          {o.application.job.title} · {o.application.passport ?? "—"}
        </p>
      </div>
    </div>
  );
}

function AwaitingRow({ offer }: { offer: Row }) {
  return (
    <li className="rounded-2xl border border-gilt-200 bg-gilt-50/30 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CandidateHead o={offer} />
            <StatusPill status={offer.status} />
          </div>
          <div className="mt-4">
            <CompSummary o={offer} />
            <Perks o={offer} />
          </div>
          {offer.note ? (
            <p className="mt-3 text-[12.5px] italic text-ink-600 border-l-2 border-gilt-300 pl-3">
              {offer.note}
            </p>
          ) : null}
          <p className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
            <Clock className="h-3 w-3" />
            Sent {offer.sentAt ? relativeTime(offer.sentAt) : "—"}
          </p>
        </div>
        <RespondButtons offerId={offer.id} candidateName={offer.application.candidateName} />
      </div>
    </li>
  );
}

function DraftRow({ offer }: { offer: Row }) {
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6 border-dashed">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CandidateHead o={offer} />
            <StatusPill status={offer.status} />
          </div>
          <div className="mt-4">
            <CompSummary o={offer} />
            <Perks o={offer} />
          </div>
          {offer.note ? (
            <p className="mt-3 text-[12.5px] italic text-ink-600 border-l-2 border-ink-300 pl-3">
              {offer.note}
            </p>
          ) : null}
        </div>
        <SendOfferButton offerId={offer.id} candidateName={offer.application.candidateName} />
      </div>
    </li>
  );
}

function AcceptedRow({ offer }: { offer: Row }) {
  return (
    <li className="relative overflow-hidden rounded-2xl border border-lagoon-200 bg-lagoon-50/40 p-5 md:p-6">
      <div aria-hidden className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-lagoon-500/10 blur-[40px]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CandidateHead o={offer} />
            <StatusPill status={offer.status} />
          </div>
          <div className="mt-4">
            <CompSummary o={offer} />
            <Perks o={offer} />
          </div>
          {offer.note ? (
            <p className="mt-3 text-[12.5px] italic text-lagoon-900 border-l-2 border-lagoon-400 pl-3">
              {offer.note}
            </p>
          ) : null}
          {offer.respondedAt ? (
            <p className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
              Accepted {relativeTime(offer.respondedAt)}
            </p>
          ) : null}
        </div>
        <Link
          href={`/app/candidates/${offer.application.id}`}
          className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full border border-lagoon-300 bg-white px-4 text-[12.5px] font-medium text-lagoon-800 transition-colors hover:border-lagoon-500"
        >
          View candidate <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}

function ClosedRow({ offer }: { offer: Row }) {
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 opacity-80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CandidateHead o={offer} />
            <StatusPill status={offer.status} />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-500">
            {money(offer.baseSalary, offer.currency)} · {offer.application.job.title}
          </p>
        </div>
        <Link
          href={`/app/candidates/${offer.application.id}`}
          className="relative z-10 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium"
        >
          View candidate →
        </Link>
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; Icon: typeof Send }> = {
    DRAFT:     { cls: "bg-ink-50 border-ink-200 text-ink-700",              label: "Draft",     Icon: FileEdit  },
    SENT:      { cls: "bg-gilt-50 border-gilt-200 text-gilt-800",           label: "Sent",      Icon: Send      },
    ACCEPTED:  { cls: "bg-lagoon-50 border-lagoon-200 text-lagoon-900",     label: "Accepted",  Icon: CheckCircle2 },
    DECLINED:  { cls: "bg-danger-50 border-danger-100 text-danger-700",     label: "Declined",  Icon: XCircle   },
    WITHDRAWN: { cls: "bg-ink-50 border-ink-200 text-ink-500",              label: "Withdrawn", Icon: XCircle   },
  };
  const v = map[status] ?? map.DRAFT;
  const Icon = v.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${v.cls}`}>
      <Icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

