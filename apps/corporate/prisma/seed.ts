import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Corporate DB…");

  const existing = await prisma.corporateUser.findUnique({ where: { email: "demo@corporate.glimmora.ai" } });
  if (existing) {
    console.log("Corporate demo already seeded.");
    return;
  }

  const password = "corporate1234";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.corporateUser.create({
    data: {
      email: "demo@corporate.glimmora.ai",
      passwordHash: hash,
      name: "Julia Kim",
      title: "Global Mobility Lead",
      emailVerified: new Date(),
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Ocenti Corp",
      slug: "ocenti",
      hqCountry: "DE",
      hqCity: "Berlin",
      industry: "B2B SaaS",
      size: "enterprise",
      contractTier: "ENTERPRISE",
      billingEmail: "accounts@ocenti.example",
      members: { create: { userId: user.id, role: "LEAD" } },
    },
  });

  // Policies
  const [standard, exec, earlyCareer] = await Promise.all([
    prisma.policy.create({
      data: {
        organizationId: org.id,
        name: "Standard EU",
        tier: "STANDARD",
        relocationCap: 8000,
        housingCap: 3000,
        currency: "EUR",
        shippingIncluded: true,
        description: "Default tier for all full-time staff relocating within the EU.",
      },
    }),
    prisma.policy.create({
      data: {
        organizationId: org.id,
        name: "Executive · Global",
        tier: "EXEC",
        relocationCap: 35000,
        housingCap: 12000,
        currency: "EUR",
        shippingIncluded: true,
        lumpSum: 5000,
        description: "VP+ relocations. Expat premium, international shipping, 60-day temporary housing.",
      },
    }),
    prisma.policy.create({
      data: {
        organizationId: org.id,
        name: "Early Career",
        tier: "EARLY_CAREER",
        relocationCap: 3500,
        housingCap: 1500,
        currency: "EUR",
        shippingIncluded: false,
        description: "Under 3 years experience. Lightweight package — flights, visa filings, 30-day housing.",
      },
    }),
  ]);

  // Employees
  type Emp = {
    email: string; name: string; title: string; department: string;
    homeCountry: string; destCountry?: string; destCity?: string; level?: string;
    manager?: string;
    relocationStatus?: "NONE" | "PLANNED" | "ACTIVE" | "SETTLED";
    stage?: string;
    policyId?: string;
    startOffset?: number; // days from now
    milestonesDone?: number;
    milestonesTotal?: number;
    budgetSpent?: number;
  };

  const seeds: Emp[] = [
    // ACTIVE relocations (8)
    {
      email: "demo@glimmora.ai", name: "Priya Menon", title: "Senior Backend Engineer",
      department: "Platform", homeCountry: "IN", destCountry: "DE", destCity: "Berlin",
      level: "L5", manager: "Jonas Weber",
      relocationStatus: "ACTIVE", stage: "VISA_APPLY",
      policyId: standard.id, startOffset: 60, milestonesDone: 1, milestonesTotal: 8, budgetSpent: 1200,
    },
    {
      email: "carlos.diaz@ocenti.example", name: "Carlos Díaz", title: "Product Designer",
      department: "Design", homeCountry: "AR", destCountry: "ES", destCity: "Madrid",
      level: "L4", manager: "Clara Meyer",
      relocationStatus: "ACTIVE", stage: "HOUSING",
      policyId: standard.id, startOffset: 45, milestonesDone: 4, milestonesTotal: 8, budgetSpent: 4200,
    },
    {
      email: "yuki.tanaka@ocenti.example", name: "Yuki Tanaka", title: "Engineering Manager",
      department: "Platform", homeCountry: "JP", destCountry: "NL", destCity: "Amsterdam",
      level: "M6", manager: "Jonas Weber",
      relocationStatus: "ACTIVE", stage: "VISA_APPROVE",
      policyId: exec.id, startOffset: 75, milestonesDone: 2, milestonesTotal: 8, budgetSpent: 8400,
    },
    {
      email: "amara.okoro@ocenti.example", name: "Amara Okoro", title: "Staff SRE",
      department: "Platform", homeCountry: "NG", destCountry: "DE", destCity: "Berlin",
      level: "L6", manager: "Jonas Weber",
      relocationStatus: "ACTIVE", stage: "FLIGHTS",
      policyId: standard.id, startOffset: 14, milestonesDone: 5, milestonesTotal: 8, budgetSpent: 6300,
    },
    {
      email: "li.chen@ocenti.example", name: "Li Chen", title: "VP Engineering",
      department: "Platform", homeCountry: "CN", destCountry: "NL", destCity: "Amsterdam",
      level: "VP", manager: "Maya Ross (CEO)",
      relocationStatus: "ACTIVE", stage: "HOUSING",
      policyId: exec.id, startOffset: 95, milestonesDone: 3, milestonesTotal: 8, budgetSpent: 14500,
    },
    {
      email: "fabrizio.conte@ocenti.example", name: "Fabrizio Conte", title: "Software Engineer",
      department: "Growth", homeCountry: "IT", destCountry: "IE", destCity: "Dublin",
      level: "L3", manager: "Rohan Shah",
      relocationStatus: "ACTIVE", stage: "BANK",
      policyId: earlyCareer.id, startOffset: 21, milestonesDone: 6, milestonesTotal: 8, budgetSpent: 2900,
    },
    {
      email: "beatrice.muli@ocenti.example", name: "Beatrice Muli", title: "Data Engineer",
      department: "Data", homeCountry: "KE", destCountry: "DE", destCity: "Munich",
      level: "L4", manager: "Jonas Weber",
      relocationStatus: "ACTIVE", stage: "MOVE_IN",
      policyId: standard.id, startOffset: 2, milestonesDone: 7, milestonesTotal: 8, budgetSpent: 7600,
    },
    {
      email: "mariana.pinto@ocenti.example", name: "Mariana Pinto", title: "Product Manager",
      department: "Product", homeCountry: "BR", destCountry: "PT", destCity: "Lisbon",
      level: "L5", manager: "Clara Meyer",
      relocationStatus: "ACTIVE", stage: "VISA_APPLY",
      policyId: standard.id, startOffset: 110, milestonesDone: 1, milestonesTotal: 8, budgetSpent: 800,
    },

    // PLANNED (2) — not yet started
    {
      email: "asmita.rao@ocenti.example", name: "Asmita Rao", title: "Staff Data Scientist",
      department: "Data", homeCountry: "IN", destCountry: "DE", destCity: "Berlin",
      level: "L6", manager: "Jonas Weber",
      relocationStatus: "PLANNED",
      policyId: standard.id, startOffset: 180, milestonesDone: 0, milestonesTotal: 8,
    },
    {
      email: "viktor.sorokin@ocenti.example", name: "Viktor Sorokin", title: "Security Engineer",
      department: "Platform", homeCountry: "UA", destCountry: "DE", destCity: "Berlin",
      level: "L5", manager: "Jonas Weber",
      relocationStatus: "PLANNED",
      policyId: standard.id, startOffset: 150, milestonesDone: 0, milestonesTotal: 8,
    },

    // SETTLED (3) — past relocations, complete
    {
      email: "noor.al-sayed@ocenti.example", name: "Noor Al-Sayed", title: "Head of Ops",
      department: "Operations", homeCountry: "EG", destCountry: "DE", destCity: "Berlin",
      level: "Director", manager: "Maya Ross (CEO)",
      relocationStatus: "SETTLED",
      policyId: exec.id, startOffset: -120, milestonesDone: 8, milestonesTotal: 8, budgetSpent: 27800,
    },
    {
      email: "javier.ruiz@ocenti.example", name: "Javier Ruiz", title: "Senior Designer",
      department: "Design", homeCountry: "MX", destCountry: "DE", destCity: "Berlin",
      level: "L5", manager: "Clara Meyer",
      relocationStatus: "SETTLED",
      policyId: standard.id, startOffset: -240, milestonesDone: 8, milestonesTotal: 8, budgetSpent: 7200,
    },
    {
      email: "hedda.bauer@ocenti.example", name: "Hedda Bauer", title: "Legal Counsel",
      department: "Legal", homeCountry: "AT", destCountry: "DE", destCity: "Berlin",
      level: "Director", manager: "Maya Ross (CEO)",
      relocationStatus: "SETTLED",
      policyId: exec.id, startOffset: -400, milestonesDone: 8, milestonesTotal: 8, budgetSpent: 23100,
    },
    // Non-relocating staff (not shown in most views but present for realism)
    {
      email: "maya.ross@ocenti.example", name: "Maya Ross", title: "CEO",
      department: "Exec", homeCountry: "DE", level: "CEO",
      relocationStatus: "NONE",
    },
    {
      email: "jonas.weber@ocenti.example", name: "Jonas Weber", title: "CTO",
      department: "Exec", homeCountry: "DE", level: "CTO",
      relocationStatus: "NONE",
    },
    {
      email: "clara.meyer@ocenti.example", name: "Clara Meyer", title: "VP Product",
      department: "Product", homeCountry: "DE", level: "VP",
      relocationStatus: "NONE",
    },
  ];

  const now = Date.now();
  for (const e of seeds) {
    const start = e.startOffset != null ? new Date(now + e.startOffset * 24 * 60 * 60 * 1000) : null;
    const emp = await prisma.employee.create({
      data: {
        organizationId: org.id,
        email: e.email,
        name: e.name,
        title: e.title,
        department: e.department ?? null,
        homeCountry: e.homeCountry,
        destCountry: e.destCountry ?? null,
        destCity: e.destCity ?? null,
        level: e.level ?? null,
        manager: e.manager ?? null,
        relocationStatus: e.relocationStatus ?? "NONE",
        targetStartDate: start,
        policyId: e.policyId ?? null,
        milestonesDone: e.milestonesDone ?? 0,
        milestonesTotal: e.milestonesTotal ?? 0,
        lastEventAt: e.relocationStatus === "ACTIVE" ? new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Create RelocationCase for anyone with a destination + status
    if (e.destCountry && (e.relocationStatus === "ACTIVE" || e.relocationStatus === "SETTLED" || e.relocationStatus === "PLANNED")) {
      const policy = e.policyId ? [standard, exec, earlyCareer].find((p) => p.id === e.policyId) : null;
      await prisma.relocationCase.create({
        data: {
          employeeId: emp.id,
          destCountry: e.destCountry,
          destCity: e.destCity ?? null,
          startedAt: start ?? new Date(),
          closedAt: e.relocationStatus === "SETTLED" ? start : null,
          status: e.relocationStatus === "SETTLED" ? "COMPLETED" :
                  e.relocationStatus === "PLANNED"  ? "ACTIVE" : "ACTIVE",
          budgetCap: policy?.relocationCap ?? null,
          spent: e.budgetSpent ?? 0,
          currency: policy?.currency ?? "EUR",
          stage: e.stage ?? "OFFER_ACCEPTED",
        },
      });
    }
  }

  // Approvals — exception requests awaiting decision
  const liChen = await prisma.employee.findFirst({ where: { email: "li.chen@ocenti.example" } });
  const fabrizio = await prisma.employee.findFirst({ where: { email: "fabrizio.conte@ocenti.example" } });
  if (liChen) {
    await prisma.approval.create({
      data: {
        organizationId: org.id,
        employeeId: liChen.id,
        kind: "BUDGET_OVERRIDE",
        requestedBy: "Maya Ross",
        requestedAmount: 45000,
        currency: "EUR",
        reason: "Family of four + shipping two cars from Shanghai. Current exec cap (€35k) is insufficient; market comp for VP+ at Amsterdam peers includes higher relocation allowance.",
      },
    });
  }
  if (fabrizio) {
    await prisma.approval.create({
      data: {
        organizationId: org.id,
        employeeId: fabrizio.id,
        kind: "POLICY_EXCEPTION",
        requestedBy: "Rohan Shah",
        reason: "Fabrizio is under the Early Career policy (€3,500) but his Dublin rent is €1,600/mo. Requesting uplift to Standard EU policy cap.",
      },
    });
  }

  // Invoices
  const issued = [
    { number: "OCN-2026-Q1", period: "2026-Q1", total: 38000, status: "PAID",    issuedDays: -75, paidDays: -60 },
    { number: "OCN-2026-Q2", period: "2026-Q2", total: 51200, status: "PAID",    issuedDays: -30, paidDays: -18 },
    { number: "OCN-2026-Q3", period: "2026-Q3", total: 42400, status: "ISSUED",  issuedDays: -8, paidDays: null },
    { number: "OCN-2026-Q4", period: "2026-Q4", total: 0,     status: "ISSUED",  issuedDays: 7, paidDays: null },
  ];
  for (const i of issued) {
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        number: i.number,
        period: i.period,
        total: i.total,
        currency: "EUR",
        status: i.status,
        issuedAt: new Date(now + i.issuedDays * 24 * 60 * 60 * 1000),
        dueAt: new Date(now + (i.issuedDays + 30) * 24 * 60 * 60 * 1000),
        paidAt: i.paidDays != null ? new Date(now + i.paidDays * 24 * 60 * 60 * 1000) : null,
        lineItems: JSON.stringify([
          { desc: "Success fee — closed hires", amount: Math.round(i.total * 0.72) },
          { desc: "Platform subscription",      amount: Math.round(i.total * 0.18) },
          { desc: "Marketplace fees",           amount: Math.round(i.total * 0.10) },
        ]),
      },
    });
  }

  console.log(`Seeded Corporate: ${user.email} / ${password}`);
  console.log(`  · 1 org (Ocenti Corp), ${seeds.length} employees, 3 policies, 2 approvals, ${issued.length} invoices`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
