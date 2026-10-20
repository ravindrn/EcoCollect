
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
