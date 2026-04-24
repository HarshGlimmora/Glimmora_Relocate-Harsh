import type { Metadata } from "next";
import { Building2, CheckCircle2, Globe2, Users } from "lucide-react";
import { listEmployerCompanies, listHires } from "@/lib/xdb";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const companies = listEmployerCompanies();
  const hires = listHires();

  const hiresByCompany = hires.reduce<Record<string, number>>((acc, h) => {
    acc[h.companyId] = (acc[h.companyId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Companies</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Employers on Glimmora.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Every company that's hiring with us. Verified status, HQ, and lifetime hires.
        </p>
      </header>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Building2 className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No companies yet.</h3>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {companies.map((c) => (
            <li
              id={c.id}
              key={c.id}
              className="rounded-2xl border border-ink-200 bg-white p-6 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-parchment font-semibold text-[16px]">
                    {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[17px] font-semibold tracking-tight text-ink-900">{c.name}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">{c.slug}.glimmora.work</p>
                  </div>
                </div>
                {c.verified ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-lagoon-50 border border-lagoon-200 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
                    <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> Verified
                  </span>
                ) : null}
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-100 pt-5">
                <Detail label="HQ" value={c.hqCity ? `${c.hqCity}, ${c.hqCountry ?? ""}` : c.hqCountry ?? "—"} Icon={Globe2} />
                <Detail label="Size" value={c.size ?? "—"} Icon={Users} />
                <Detail label="Hires" value={String(hiresByCompany[c.id] ?? 0)} Icon={CheckCircle2} />
              </dl>

              {c.industry ? (
                <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink-50 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700 font-medium">
                  {c.industry}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Detail({ label, value, Icon }: { label: string; value: string; Icon: typeof Globe2 }) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
        <Icon className="h-2.5 w-2.5" strokeWidth={2} /> {label}
      </dt>
      <dd className="mt-1 font-sans text-[13.5px] font-semibold text-ink-900 capitalize">{value}</dd>
    </div>
  );
}
