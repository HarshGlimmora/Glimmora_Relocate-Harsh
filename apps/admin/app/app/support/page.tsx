import type { Metadata } from "next";
import Link from "next/link";
import { Headphones, UserCircle, Mail, MessageSquare, Plane, Check } from "lucide-react";
import { listConsumerUsers } from "@/lib/xdb";

export const metadata: Metadata = { title: "Users & support" };

function initials(s?: string | null): string {
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return ((first + last).toUpperCase() || first.toUpperCase()).slice(0, 2);
}

function ago(ms: number) {
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1d";
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

export default function SupportPage() {
  const users = listConsumerUsers();
  const withActive = users.filter((u) => u.activeRelocation > 0);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Knowledge & Support</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Users & support.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            Every consumer account on Glimmora. Tickets, escalations, and (with explicit consent) live impersonation — separation of duties enforced.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700 font-medium">
          Support inbox · W3
        </span>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={users.length}       l="Consumer users" sub="total accounts" tone="lagoon" />
        <Kpi n={withActive.length}  l="In relocation"  sub="active plan"     />
        <Kpi n={0}                  l="Open tickets"   sub="W3 inbox"      tone="gilt" />
        <Kpi n={0}                  l="Escalated"      sub="to specialist"   />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Users" />
        {users.length === 0 ? (
          <EmptyState title="No users yet." body="New Consumer signups appear here automatically." />
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <div className="hidden grid-cols-[1.5fr_0.8fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-ink-100 bg-parchment/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium md:grid">
              <span>User</span>
              <span>Email</span>
              <span>Relocations</span>
              <span>Active</span>
              <span className="text-right">Joined</span>
            </div>
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`grid gap-2 px-5 py-3.5 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.6fr_0.6fr] md:items-center md:py-4 ${i < users.length - 1 ? "border-b border-ink-100" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-parchment">
                    {initials(u.name ?? u.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{u.name ?? "—"}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">User</p>
                  </div>
                </div>
                <Cell label="Email" v={u.email} mono />
                <Cell label="Relocations" v={`${u.relocationCount}`} />
                <Cell label="Active">
                  {u.activeRelocation > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lagoon-200 bg-lagoon-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
                      <Plane className="h-2.5 w-2.5" /> {u.activeRelocation}
                    </span>
                  ) : (
                    <span className="font-mono text-[10.5px] text-ink-400">—</span>
                  )}
                </Cell>
                <div className="flex items-center justify-between md:justify-end">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">Joined</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">{ago(u.createdAt)} ago</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead num="02" label="Support inbox" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-ink-700" />
              <h3 className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">Email tickets</h3>
              <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">W3</span>
            </div>
            <p className="mt-3 text-[13px] text-ink-600 leading-[1.55]">
              Zendesk-style ticketing: inbound from <code className="font-mono text-[11.5px] text-ink-700">support@glimmora.ai</code>, tag routing, SLAs, auto-triage.
            </p>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-700">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> Thread per conversation</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> First-response SLA (4h business)</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> Escalate → Trust Officer / Finance</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-ink-700" />
              <h3 className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">Live impersonation</h3>
              <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">W4</span>
            </div>
            <p className="mt-3 text-[13px] text-ink-600 leading-[1.55]">
              When a user grants consent, support can view their Twin + plan read-only. Every session is audited; write actions require the user's return-to-own-session confirmation.
            </p>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-700">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> Explicit user consent per session</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> Time-boxed (15 min default)</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} /> Audit trail for every action</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function Cell({ label, v, mono, children }: { label: string; v?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between md:block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium md:hidden">{label}</span>
      {children ?? (
        <span className={`${mono ? "font-mono text-[11.5px]" : "font-sans text-[13px]"} ${mono ? "text-ink-700" : "font-medium text-ink-900"}`}>{v}</span>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <Headphones className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
