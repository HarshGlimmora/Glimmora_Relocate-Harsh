import type { Metadata } from "next";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { EmployeeList } from "./employee-list";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const { organization } = await requireCorporateSession();

  const employees = await prisma.employee.findMany({
    where: { organizationId: organization.id },
    include: { policy: { select: { name: true } } },
    orderBy: [{ relocationStatus: "asc" }, { name: "asc" }],
  });

  const counts = {
    all: employees.length,
    active: employees.filter((e) => e.relocationStatus === "ACTIVE").length,
    planned: employees.filter((e) => e.relocationStatus === "PLANNED").length,
    settled: employees.filter((e) => e.relocationStatus === "SETTLED").length,
    home: employees.filter((e) => e.relocationStatus === "NONE").length,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Employees · Seats</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Your people, on the move.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Everyone eligible for your relocation program, with their current status and policy tier.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-5">
        <KPI n={counts.all} l="Total" />
        <KPI n={counts.active} l="Active" tone="moss" />
        <KPI n={counts.planned} l="Planned" tone="gilt" />
        <KPI n={counts.settled} l="Settled" />
        <KPI n={counts.home} l="Home" />
      </section>

      <EmployeeList
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          title: e.title,
          department: e.department,
          level: e.level,
          homeCountry: e.homeCountry,
          destCountry: e.destCountry,
          destCity: e.destCity,
          relocationStatus: e.relocationStatus,
          milestonesDone: e.milestonesDone,
          milestonesTotal: e.milestonesTotal,
          lastEventAt: e.lastEventAt,
          policyName: e.policy?.name ?? null,
        }))}
      />
    </div>
  );
}

function KPI({ n, l, tone }: { n: number; l: string; tone?: "moss" | "gilt" }) {
  const bg = tone === "moss" ? "bg-moss-50 border-moss-100" : tone === "gilt" ? "bg-gilt-50 border-gilt-200" : "bg-white border-ink-200";
  return (
    <div className={cn("rounded-2xl border p-4", bg)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{l}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{n}</p>
    </div>
  );
}
