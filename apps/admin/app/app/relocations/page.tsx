import type { Metadata } from "next";
import { Plane, MapPin, Building2, Calendar } from "lucide-react";
import { listRelocations } from "@/lib/xdb";

export const metadata: Metadata = { title: "Relocations" };

function fmtDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function RelocationsPage() {
  const rows = listRelocations();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Relocations</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Active relocation plans.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Every candidate who accepted an offer and now has a live Glimmora plan. Data is sourced from the Consumer app.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Plane className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No active plans.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Accepting an offer in Glimmora for Employers will create a relocation plan here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pct = r.totalCount > 0 ? Math.round((r.doneCount / r.totalCount) * 100) : 0;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:p-6"
              >
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12.5px] font-semibold text-parchment">
                        {(r.userName ?? r.userEmail).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-sans text-[15px] font-semibold text-ink-900">{r.userName ?? r.userEmail}</p>
                        <p className="mt-0.5 truncate text-[12px] text-ink-500">{r.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-sans text-[13.5px] font-semibold text-ink-900">
                      <Building2 className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.75} />
                      {r.employerName}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-500">{r.jobTitle}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[13px] text-ink-800">
                      <MapPin className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.75} />
                      {r.destCity ? `${r.destCity}, ` : ""}{r.destCountry}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      <Calendar className="h-3 w-3" /> Start {fmtDate(r.startDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">{r.doneCount}/{r.totalCount} steps</p>
                      <p className="mt-0.5 font-sans text-[17px] font-semibold text-lagoon-700">{pct}%</p>
                    </div>
                    <div className="w-28">
                      <div className="h-1.5 w-full rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-lagoon-400 to-lagoon-500" style={{ width: `${Math.max(4, pct)}%` }} />
                      </div>
                      <p className="mt-2 text-right font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                        {r.status}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
