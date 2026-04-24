import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding offers…");

  const apps = await prisma.application.findMany({ include: { job: true } });
  if (apps.length === 0) {
    console.log("No applications found. Run base seed first.");
    return;
  }

  await prisma.offer.deleteMany({});

  const byName = (n: string) => apps.find((a) => a.candidateName === n);

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const rows: Array<{
    candidate: string;
    status: string;
    baseSalary: number;
    currency: string;
    bonusPct?: number;
    equity?: string;
    signingBonus?: number;
    relocationBenefit?: string;
    startDate?: Date;
    note?: string;
    sentAt?: Date;
    respondedAt?: Date;
  }> = [
    // Accepted — most polished
    {
      candidate: "Priya Menon",
      status: "ACCEPTED",
      baseSalary: 102000,
      currency: "EUR",
      bonusPct: 10,
      equity: "0.04% over 4 years, 1y cliff",
      signingBonus: 6000,
      relocationBenefit: "up to €8,000",
      startDate: daysFromNow(45),
      note: "Match locked. Start flow handed off to Glimmora plan.",
      sentAt: daysAgo(8),
      respondedAt: daysAgo(3),
    },
    // Sent — awaiting response
    {
      candidate: "Aarav Shenoy",
      status: "SENT",
      baseSalary: 95000,
      currency: "EUR",
      bonusPct: 10,
      equity: "0.03% over 4 years, 1y cliff",
      signingBonus: 4000,
      relocationBenefit: "up to €8,000",
      startDate: daysFromNow(60),
      note: "Signed NDA. Awaiting response on comp letter.",
      sentAt: daysAgo(2),
    },
    // Sent — awaiting response
    {
      candidate: "Mariana Costa",
      status: "SENT",
      baseSalary: 88000,
      currency: "EUR",
      bonusPct: 8,
      equity: "0.02% over 4 years, 1y cliff",
      relocationBenefit: "up to €8,000",
      startDate: daysFromNow(75),
      sentAt: daysAgo(5),
    },
    // Draft — not yet sent
    {
      candidate: "Alex Novikov",
      status: "DRAFT",
      baseSalary: 98000,
      currency: "EUR",
      bonusPct: 10,
      equity: "0.03% over 4 years, 1y cliff",
      signingBonus: 5000,
      relocationBenefit: "up to €8,000",
      startDate: daysFromNow(60),
      note: "Waiting on legal review for UA passport specifics.",
    },
  ];

  for (const r of rows) {
    const app = byName(r.candidate);
    if (!app) {
      console.warn(`No application for ${r.candidate}, skipping`);
      continue;
    }
    await prisma.offer.create({
      data: {
        applicationId: app.id,
        status: r.status,
        baseSalary: r.baseSalary,
        currency: r.currency,
        bonusPct: r.bonusPct ?? null,
        equity: r.equity ?? null,
        signingBonus: r.signingBonus ?? null,
        relocationBenefit: r.relocationBenefit ?? null,
        startDate: r.startDate ?? null,
        note: r.note ?? null,
        sentAt: r.sentAt ?? null,
        respondedAt: r.respondedAt ?? null,
      },
    });
  }

  const count = await prisma.offer.count();
  console.log(`Seeded ${count} offers.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
