import type { Metadata } from "next";
import Link from "next/link";
import { Kanban, MapPin, Globe2 } from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { cn, initials, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipelines" };

const stages = ["OFFER_ACCEPTED", "VISA_APPLY", "VISA_APPROVE", "HOUSING", "BANK", "FLIGHTS", "MOVE_IN", "START_DAY"] as const;

const stageLabels: Record<string, string> = {
  OFFER_ACCEPTED: "Accepted",
  VISA_APPLY:     "Visa apply",
  VISA_APPROVE:   "Visa approved",
  HOUSING:        "Housing",
  BANK:           "Banking",
  FLIGHTS:        "Flights",
  MOVE_IN:        "Move-in",
  START_DAY:      "Start day",
};

const stageDot: Record<string, string> = {
  OFFER_ACCEPTED: "bg-ink-400",
  VISA_APPLY:     "bg-gilt-500",
  VISA_APPROVE:   "bg-gilt-400",
  HOUSING:        "bg-moss-500",
  BANK:           "bg-moss-600",
  FLIGHTS:        "bg-lagoon-500",
  MOVE_IN:        "bg-lagoon-600",
  START_DAY:      "bg-success-500",
};

export default async function PipelinesPage() {
  const { organization } = await requireCorporateSession();

  const cases = await prisma.relocationCase.findMany({
    where: { employee: { organizationId: organization.id }, status: "ACTIVE" },
    include: {
      employee: {
        include: { policy: { select: { name: true, tier: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by stage
  const byStage: Record<string, typeof cases> = {};
  for (const s of stages) byStage[s] = [];
  for (const c of cases) {
    if (byStage[c.stage]) byStage[c.stage].push(c);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Pipelines</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Every relocation, every stage.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Board view of active cases grouped by milestone. Hover an employee to jump to their timeline.
        </p>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Kanban className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No active relocations.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            When an employee accepts an offer and the relocation plan kicks off, they appear here.
          </p>
        </div>
      ) : (
        <section className="overflow-x-auto pb-4">
          <div className="flex min-w-fit gap-4">
            {stages.map((s) => {
              const count = byStage[s].length;
              return (
                <div key={s} className="w-[280px] shrink-0">
                  <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", stageDot[s])} />
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-semibold text-ink-800">
                        {stageLabels[s]}
                      </span>
                    </div>
                    <span className="font-sans text-[13px] font-semibold text-ink-900">{count}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {count === 0 ? (
                      <div className="rounded-xl border border-dashed border-ink-200 bg-parchment/50 px-3 py-4 text-center">
                        <p className="text-[11.5px] text-ink-400">No one here</p>
                      </div>
                    ) : null}
                    {byStage[s].map((c) => (
                      <Link
                        key={c.id}
                        href={`/app/employees/${c.employeeId}`}
                        className="group block rounded-xl border border-ink-200 bg-white p-3 transition-all hover:border-ink-900 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss-600 text-[11px] font-semibold text-white">
                            {initials(c.employee.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-[13px] font-semibold text-ink-900">{c.employee.name}</p>
                            <p className="mt-0.5 truncate text-[11px] text-ink-500">{c.employee.title}</p>
                          </div>
                        </div>
                        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-500">
                          <span className="inline-flex items-center gap-1"><Globe2 className="h-3 w-3" /> {c.employee.homeCountry} → {c.destCountry}</span>
                          {c.destCity ? (<><span className="text-ink-300">·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.destCity}</span></>) : null}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-moss-50 border border-moss-200 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-moss-800 font-medium">
                            {c.employee.policy?.tier.toLowerCase().replace("_", " ") ?? "no policy"}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
                            {relativeTime(c.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
