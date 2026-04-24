import type { Metadata } from "next";
import Link from "next/link";
import { Users, Baby, Heart, UserPlus, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Family" };

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { twin: true } });
  const familySize = user?.twin?.familySize ?? 1;
  const hasChildren = user?.twin?.hasChildren ?? false;
  const childrenCount = user?.twin?.childrenCount ?? 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Family</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            For everyone moving <br className="hidden md:block" /> with you.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            A move only works if it works for your whole family. Parallel plans for your spouse, adaptation plans for each child, community for all.
          </p>
        </div>
        <Link href="/app/profile" className="btn-ghost inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-medium">
          Update family shape
        </Link>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6 text-parchment">
          <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gilt-500/20 blur-[60px]" />
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-gilt-300">
            <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-300 font-medium">Family size</p>
          <p className="mt-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em]">{familySize}</p>
          <p className="mt-2 text-[12.5px] text-white/60">Including you</p>
        </div>

        <div className="rounded-2xl border border-lagoon-100 bg-lagoon-50 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lagoon-500 text-white">
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">Spouse / partner</p>
          <p className="mt-2 font-sans text-[19px] font-semibold leading-tight tracking-tight text-ink-900">
            {familySize >= 2 ? "Ready to invite" : "Not added"}
          </p>
          <p className="mt-2 text-[12.5px] text-ink-600">Parallel career plan + community match</p>
        </div>

        <div className="rounded-2xl border border-gilt-200 bg-gilt-50 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gilt-500 text-white">
            <Baby className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Children</p>
          <p className="mt-2 font-sans text-[56px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{childrenCount}</p>
          <p className="mt-2 text-[12.5px] text-ink-700">{hasChildren ? "School matching active" : "None registered"}</p>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Members</span>
        </div>

        {familySize <= 1 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
              <UserPlus className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
            </div>
            <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Invite your family.</h3>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
              Your spouse gets their own Twin and a parallel plan — career, community, language. Add children to see schools matched.
            </p>
            <Link href="/app/profile" className="btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
              Set up family <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lagoon-100 font-sans text-[18px] font-semibold text-lagoon-700">+</div>
                <div>
                  <p className="font-sans text-[15px] font-semibold text-ink-900">Invite your spouse</p>
                  <p className="text-[12.5px] text-ink-500">They'll get their own Twin</p>
                </div>
              </div>
              <button
                type="button"
                disabled
                title="Spouse invites arrive with W3."
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-medium text-ink-500 cursor-not-allowed"
              >
                Send invitation
                <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W3</span>
              </button>
            </div>
            {hasChildren ? (
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gilt-100 font-sans text-[18px] font-semibold text-gilt-700">{childrenCount}</div>
                  <div>
                    <p className="font-sans text-[15px] font-semibold text-ink-900">{childrenCount} {childrenCount === 1 ? "child" : "children"}</p>
                    <p className="text-[12.5px] text-ink-500">School matching + adaptation plans</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  title="Child profile builder arrives with W3."
                  className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-medium text-ink-500 cursor-not-allowed"
                >
                  Add child details
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W3</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment md:p-12">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Most moves fail because of the spouse.
            </h3>
            <p className="mt-3 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              A six-month head start on your partner's parallel plan is the difference between a smooth arrival and a stressful one. The Copilot can start drafting theirs today.
            </p>
          </div>
          <Link href="/app/messages" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white md:self-center">
            Start their plan <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
