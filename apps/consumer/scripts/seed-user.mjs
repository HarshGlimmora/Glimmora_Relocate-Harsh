import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const email = process.argv[2] ?? `flow-${Date.now()}@x.io`;
const pw = await bcrypt.hash("Password123!ok", 10);
await prisma.user.create({
  data: {
    email, name: "Flow", passwordHash: pw, mode: "INDIVIDUAL", status: "ACTIVE",
    profile: { create: { displayName: "Flow" } },
    twin: { create: { stage: "exploring" } },
    preferences: { create: {} },
    subscription: { create: { tier: "FREE" } },
  },
});
console.log("seeded:", email);
process.exit(0);
