import type { Metadata } from "next";
import { BadgeCheck, ShieldX, Building2, Briefcase, Users } from "lucide-react";
import { listEmployerCompanies, listHires, countEmployerJobs } from "@/lib/xdb";
import { EmployerVerifyRow } from "./verify-row";

export const metadata: Metadata = { title: "Employer verification" };

function daysAgo(ms: number) {
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} months ago`;
}

export default function EmployerVerificationPage() {
  const companies = listEmployerCompanies();
  const hires = listHires();
  const jobs = countEmployerJobs();

  const unverified = companies.filter((c) => !c.verified);
  const verified = companies.filter((c) => c.verified);

  const hiresByCompany = hires.reduce<Record<string, number>>((acc, h) => {
    acc[h.companyId] = (acc[h.companyId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Verification & Trust</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Employer verification.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          Companies submit identity + sponsorship policy at sign-up. Only verified employers can post roles in visa-gated corridors.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={unverified.length} l="Pending review"   sub="not yet verified"        tone="gilt" />
        <Kpi n={verified.length}   l="Verified"         sub="active employers"       tone="lagoon" />
        <Kpi n={jobs.active}       l="Active roles"     sub={`${jobs.total} lifetime`} />
        <Kpi n={hires.length}      l="Closed hires"     sub="platform lifetime" />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Awaiting verification" />
        {unverified.length === 0 ? (
          <EmptyState title="Every company is verified." body="New signups land here when they complete onboarding." />
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            {unverified.map((c, i) => (
              <EmployerVerifyRow
                key={c.id}
                companyId={c.id}
                name={c.name}
                meta={`${c.industry ?? "—"} · ${c.hqCity ? `${c.hqCity}, ${c.hqCountry}` : c.hqCountry ?? "—"} · ${c.size ?? "—"}`}
                hiresCount={hiresByCompany[c.id] ?? 0}
                createdLabel={daysAgo(c.createdAt)}
                verified={false}
                divider={i < unverified.length - 1}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead num="02" label="Verified employers" />
        {verified.length === 0 ? (
          <EmptyState title="No verified companies yet." body="Approve one from the queue above and it'll appear here." />
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            {verified.map((c, i) => (
              <EmployerVerifyRow
                key={c.id}
                companyId={c.id}
                name={c.name}
                meta={`${c.industry ?? "—"} · ${c.hqCity ? `${c.hqCity}, ${c.hqCountry}` : c.hqCountry ?? "—"} · ${c.size ?? "—"}`}
                hiresCount={hiresByCompany[c.id] ?? 0}
                createdLabel={daysAgo(c.createdAt)}
                verified={true}
                divider={i < verified.length - 1}
              />
            ))}
          </div>
        )}
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
      <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <BadgeCheck className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}
