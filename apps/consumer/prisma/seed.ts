import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  const email = "demo@glimmora.ai";
  const password = "demo1234";
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo user already exists: ${email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      name: "Priya Menon",
      mode: "FAMILY",
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: "Priya",
          lastName: "Menon",
          displayName: "Priya",
          currentCountry: "IN",
          currentCity: "Bangalore",
          nationality: "IN",
          headline: "Senior Backend Engineer",
          bio: "Exploring a move from Bangalore to Berlin with my family.",
        },
      },
      twin: {
        create: {
          targetCountries: JSON.stringify(["DE", "NL", "PT"]),
          timelineMonths: 9,
          budgetUSD: 20000,
          profession: "Software Engineer",
          yearsExperience: 8,
          seniorityLevel: "Senior",
          familySize: 3,
          hasChildren: true,
          childrenCount: 1,
          stage: "exploring",
          readinessScore: 42,
        },
      },
      preferences: { create: {} },
      subscription: { create: { tier: "FREE" } },
    },
  });

  console.log(`Created demo user: ${user.email} (password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
