import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding interviews…");

  const apps = await prisma.application.findMany({
    include: { job: true },
  });

  if (apps.length === 0) {
    console.log("No applications found. Run base seed first.");
    return;
  }

  // Reset any existing interviews so seed is deterministic
  await prisma.interview.deleteMany({});

  const byName = (name: string) => apps.find((a) => a.candidateName === name);
  const now = new Date();
  const hours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const rows: Array<{
    candidate: string;
    kind: string;
    scheduledAt: Date;
    duration: number;
    interviewer: string;
    feedback?: string | null;
    rating?: number | null;
  }> = [
    // Upcoming — today
    {
      candidate: "Priya Menon",
      kind: "TECHNICAL",
      scheduledAt: hours(3),
      duration: 60,
      interviewer: "Jonas Weber",
    },
    // Upcoming — tomorrow
    {
      candidate: "Aarav Shenoy",
      kind: "ONSITE",
      scheduledAt: hours(28),
      duration: 90,
      interviewer: "Lena Fischer",
    },
    // Upcoming — this week
    {
      candidate: "Priya Menon",
      kind: "FINAL",
      scheduledAt: hours(5 * 24),
      duration: 45,
      interviewer: "Marta Schmidt",
    },
    // Upcoming — next week
    {
      candidate: "Mariana Costa",
      kind: "PHONE",
      scheduledAt: hours(10 * 24),
      duration: 30,
      interviewer: "Marta Schmidt",
    },
    // Past — awaiting feedback
    {
      candidate: "Aarav Shenoy",
      kind: "TECHNICAL",
      scheduledAt: daysAgo(1),
      duration: 60,
      interviewer: "Jonas Weber",
    },
    // Past — has feedback
    {
      candidate: "Priya Menon",
      kind: "PHONE",
      scheduledAt: daysAgo(3),
      duration: 30,
      interviewer: "Marta Schmidt",
      feedback: "Strong on distributed systems, clear communication. Ready for technical round.",
      rating: 4,
    },
    // Past — excellent feedback
    {
      candidate: "Aarav Shenoy",
      kind: "PHONE",
      scheduledAt: daysAgo(5),
      duration: 30,
      interviewer: "Marta Schmidt",
      feedback: "Excellent culture fit. Genuine excitement about the payments domain. Move forward.",
      rating: 5,
    },
  ];

  for (const r of rows) {
    const app = byName(r.candidate);
    if (!app) {
      console.warn(`No application for ${r.candidate}, skipping`);
      continue;
    }
    await prisma.interview.create({
      data: {
        applicationId: app.id,
        kind: r.kind,
        scheduledAt: r.scheduledAt,
        duration: r.duration,
        interviewer: r.interviewer,
        feedback: r.feedback ?? null,
        rating: r.rating ?? null,
      },
    });
  }

  const count = await prisma.interview.count();
  console.log(`Seeded ${count} interviews.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
