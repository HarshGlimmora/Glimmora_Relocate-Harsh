import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin DB…");

  const email = "admin@glimmora.ai";
  const password = "admin1234";
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user exists: ${email}`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash: hash,
      name: "Reya Iyer",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log(`Seeded admin: ${email} / ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
