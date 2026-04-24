"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Users, MapPin, Globe2, Plane, Home, Check, Search } from "lucide-react";
import { cn, initials, relativeTime } from "@/lib/utils";

const statusMeta: Record<string, { cls: string; label: string; Icon: typeof Users }> = {
  ACTIVE:  { cls: "bg-moss-50 border-moss-200 text-moss-800",          label: "Active",   Icon: Plane },
  PLANNED: { cls: "bg-gilt-50 border-gilt-200 text-gilt-800",          label: "Planned",  Icon: Plane },
  SETTLED: { cls: "bg-success-50 border-success-200 text-success-700", label: "Settled",  Icon: Check },
  NONE:    { cls: "bg-ink-50 border-ink-200 text-ink-600",             label: "Home",     Icon: Home  },
};

export type EmployeeListItem = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  level: string | null;
  homeCountry: string;
  destCountry: string | null;
  destCity: string | null;
  relocationStatus: string;
  milestonesDone: number;
  milestonesTotal: number;
  lastEventAt: Date | null;
  policyName: string | null;
};

export function EmployeeList({ employees }: { employees: EmployeeListItem[] }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? employees.filter((e) =>
        [e.name, e.title, e.department, e.level, e.destCity, e.destCountry, e.homeCountry, e.policyName]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))
      )
    : employees;

  return (
    <>
      <section className="mb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-5 py-3.5">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, department, or destination…"
            className="flex-1 bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <span className="hidden rounded-full bg-moss-50 border border-moss-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-moss-800 font-medium sm:inline-block">
            {q ? `${filtered.length} of ${employees.length}` : `${employees.length} seats`}
          </span>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <p className="font-sans text-[15px] font-semibold text-ink-900">No match for "{query}".</p>
          <p className="mt-1 text-[12.5px] text-ink-500">Try a different name, department, or destination.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => {
            const sm = statusMeta[e.relocationStatus] ?? statusMeta.NONE;
            const SIcon = sm.Icon;
            return (
              <li key={e.id}>
                <Link
                  href={`/app/employees/${e.id}`}
                  className="group block rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6"
                >
                  <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-600 text-[12px] font-semibold text-white">
                        {initials(e.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-sans text-[14.5px] font-semibold text-ink-900">{e.name}</p>
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", sm.cls)}>
                            <SIcon className="h-3 w-3" />
                            {sm.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-ink-500">
                          {e.title} · {e.department}{e.level ? ` · ${e.level}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 text-[12.5px] text-ink-600">
                      <p className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3 text-ink-400" /> {e.homeCountry}{e.destCountry ? ` → ${e.destCountry}` : ""}</p>
                      {e.destCity ? <p className="mt-0.5 inline-flex items-center gap-1.5"><MapPin className="h-3 w-3 text-ink-400" /> {e.destCity}</p> : null}
                    </div>

                    <div className="min-w-0">
                      {e.policyName ? (
                        <>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Policy</p>
                          <p className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">{e.policyName}</p>
                        </>
                      ) : (
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">No policy</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      {e.milestonesTotal > 0 ? (
                        <div className="text-right">
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">Progress</p>
                          <p className="mt-0.5 font-sans text-[13px] font-semibold text-moss-700">{e.milestonesDone}/{e.milestonesTotal}</p>
                        </div>
                      ) : null}
                      <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-ink-900" />
                    </div>
                  </div>

                  {e.lastEventAt ? (
                    <p className="mt-3 border-t border-ink-100 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                      Last update {relativeTime(e.lastEventAt)}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
