import type { Metadata } from "next";
import { Users, UserPlus, Crown, Shield } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

const roleStyles: Record<string, { icon: any; label: string; cls: string }> = {
  OWNER:       { icon: Crown,  label: "Owner",       cls: "bg-gilt-50 border-gilt-200 text-gilt-800" },
  RECRUITER:   { icon: Users,  label: "Recruiter",   cls: "bg-lagoon-50 border-lagoon-100 text-lagoon-800" },
  HM:          { icon: Shield, label: "Hiring Mgr",  cls: "bg-ink-50 border-ink-200 text-ink-800" },
  INTERVIEWER: { icon: Shield, label: "Interviewer", cls: "bg-ink-50 border-ink-200 text-ink-800" },
  FINANCE:     { icon: Shield, label: "Finance",     cls: "bg-ink-50 border-ink-200 text-ink-800" },
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const m = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!m) return null;
  const members = await prisma.membership.findMany({
    where: { companyId: m.companyId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Team</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Who's hiring here.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Invite recruiters, hiring managers, interviewers. Scoped permissions per role.
          </p>
        </div>
        <button
          disabled
          title="Team invites arrive with the billing milestone."
          className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4" /> Invite teammate
          <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W3</span>
        </button>
      </header>

      <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <ul className="divide-y divide-ink-100">
          {members.map((m) => {
            const role = roleStyles[m.role] ?? roleStyles.RECRUITER;
            const RoleIcon = role.icon;
            return (
              <li key={m.id} className="flex items-center gap-4 px-5 py-4 md:gap-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-parchment">
                  {initials(m.user.name ?? m.user.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[14.5px] font-semibold text-ink-900">{m.user.name ?? "—"}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">{m.user.title ?? ""} {m.user.title ? "·" : ""} {m.user.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${role.cls}`}>
                  <RoleIcon className="h-3 w-3" />
                  {role.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Role reference */}
      <section className="mt-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Roles</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Object.entries(roleStyles).map(([k, r]) => {
            const Icon = r.icon;
            return (
              <div key={k} className="rounded-2xl border border-ink-200 bg-white p-5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${r.cls}`}>
                  <Icon className="h-3 w-3" />
                  {r.label}
                </span>
                <p className="mt-3 text-[13px] text-ink-600">
                  {k === "OWNER" && "Billing, policy, every action."}
                  {k === "RECRUITER" && "Post, source, move pipeline."}
                  {k === "HM" && "Review, approve, offer decisions."}
                  {k === "INTERVIEWER" && "See profile, submit feedback."}
                  {k === "FINANCE" && "Invoices, no candidate PII."}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
