import { hashPassword } from "../src/lib/password.js";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const areas = [
    "Area A",
    "Area B",
    "Area C",
    "Area D",
    "Area E",
  ];

  for (const name of areas) {
    await prisma.area.upsert({
      where: { name },
      update: { isActive: true },
      create: { name },
    });
  }
  const accounts = [
    { email: "admin@ecocollect.local", password: "AdminDev123!", role: "ADMIN" as const },
    { email: "driver@ecocollect.local", password: "DriverDev123!", role: "DRIVER" as const },
  ];
  
  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password);
  
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role, isActive: true },
      create: {
        email: account.email,
        passwordHash,
        role: account.role,
        isActive: true,
      },
    });
  }
  
  console.log("Development admin and driver accounts are ready.");

  console.log("EcoCollect areas seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Area seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
