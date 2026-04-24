import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding employer DB…");

  const email = "demo@employer.glimmora.ai";
  const password = "employer1234";
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo user exists: ${email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      name: "Marta Schmidt",
      title: "Head of Talent",
      emailVerified: new Date(),
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "Kontra GmbH",
      slug: "kontra",
      website: "https://kontra.example",
      about: "A Berlin-based fintech building payments infrastructure for Europe.",
      hqCountry: "DE",
      hqCity: "Berlin",
      size: "growth",
      industry: "Fintech",
      verified: true,
      sponsorship: {
        create: {
          sponsorsCountries: JSON.stringify(["DE", "NL", "IE", "PT"]),
          visaTiers: JSON.stringify(["EU Blue Card", "ICT"]),
          relocationBenefit: "up to €8,000",
          remoteFriendly: true,
        },
      },
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  // Seed a couple of sample jobs + applications
  const job1 = await prisma.job.create({
    data: {
      companyId: company.id,
      title: "Senior Backend Engineer",
      department: "Platform",
      location: "Berlin, DE",
      remote: "hybrid",
      seniority: "senior",
      employmentType: "full_time",
      salaryMin: 85000,
      salaryMax: 110000,
      currency: "EUR",
      description: "Build and scale payment rails that move €1bn+ annually.",
      requirements: "5+ years with Go or Rust, distributed systems, payments domain a plus.",
      status: "ACTIVE",
      visaSponsorship: true,
      eligiblePassports: JSON.stringify(["IN", "BR", "TR", "UA", "NG", "EG"]),
      visaTier: "EU Blue Card",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  });

  await prisma.job.create({
    data: {
      companyId: company.id,
      title: "Staff Platform Engineer",
      department: "Platform",
      location: "Berlin, DE",
      remote: "remote",
      seniority: "staff",
      employmentType: "full_time",
      salaryMin: 110000,
      salaryMax: 140000,
      currency: "EUR",
      description: "Lead platform architecture and mentor senior engineers.",
      requirements: "8+ years, platform leadership, strong systems design.",
      status: "ACTIVE",
      visaSponsorship: true,
      eligiblePassports: JSON.stringify(["IN", "BR", "TR", "UA", "NG", "EG"]),
      visaTier: "EU Blue Card",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  });

  // Sample applications
  const apps = [
    { name: "Priya Menon",    email: "priya@example.com",  passport: "IN", country: "IN", prof: "Software Engineer", years: 8, score: 92, visa: "yes",    stage: "SHORTLISTED" },
    { name: "Aarav Shenoy",   email: "aarav@example.com",  passport: "IN", country: "IN", prof: "Software Engineer", years: 6, score: 87, visa: "yes",    stage: "INTERVIEW"   },
    { name: "Mariana Costa",  email: "mc@example.com",     passport: "BR", country: "BR", prof: "Backend Engineer",  years: 5, score: 78, visa: "yes",    stage: "NEW"         },
    { name: "Alex Novikov",   email: "alex@example.com",   passport: "UA", country: "UA", prof: "Platform Engineer", years: 9, score: 74, visa: "maybe",  stage: "NEW"         },
    { name: "Chen Wu",        email: "chen@example.com",   passport: "CN", country: "CN", prof: "SRE",               years: 7, score: 42, visa: "no",     stage: "REJECTED"    },
  ];
  for (const a of apps) {
    await prisma.application.create({
      data: {
        jobId: job1.id,
        candidateName: a.name,
        candidateEmail: a.email,
        passport: a.passport,
        currentCountry: a.country,
        profession: a.prof,
        yearsExp: a.years,
        matchScore: a.score,
        visaFit: a.visa,
        stage: a.stage,
      },
    });
  }

  console.log(`Seeded: ${user.email} / ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
