import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL missing');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Bope-Poddala area — around 6.9, 79.9
const BASE_LAT = 6.9;
const BASE_LNG = 79.9;

function jitter(base: number, delta: number) {
  return base + (Math.random() - 0.5) * delta;
}

async function main() {
  console.log('Seeding vehicles and GPS history…');

  // Upsert two vehicles by plate number
  const v1 = await prisma.vehicle.upsert({
    where: { plateNumber: 'WP-KA-1234' },
    update: { isActive: true },
    create: {
      plateNumber: 'WP-KA-1234',
      name: 'Truck 1 — Bope',
      isActive: true,
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { plateNumber: 'WP-KA-5678' },
    update: { isActive: true },
    create: {
      plateNumber: 'WP-KA-5678',
      name: 'Truck 2 — Poddala',
      isActive: true,
    },
  });

  // Delete existing history for a clean re-run
  await prisma.vehicleLocation.deleteMany({
    where: { vehicleId: { in: [v1.id, v2.id] } },
  });

  const now = Date.now();
  const stepMs = 30 * 1000; // 30 seconds between points
  const pointsPerVehicle = 30; // 15 minutes

  // Simulate v1: a loop of ~30 points around base
  for (let i = 0; i < pointsPerVehicle; i++) {
    const t = now - (pointsPerVehicle - i) * stepMs;
    const angle = (i / pointsPerVehicle) * Math.PI * 2;
    const radiusLat = 0.005;
    const radiusLng = 0.005;
    await prisma.vehicleLocation.create({
      data: {
        vehicleId: v1.id,
        latitude: BASE_LAT + Math.sin(angle) * radiusLat,
        longitude: BASE_LNG + Math.cos(angle) * radiusLng,
        speed: 20 + Math.random() * 15,
        heading: (angle * 180) / Math.PI,
        recordedAt: new Date(t),
      },
    });
  }

  // Simulate v2: linear-ish path
  for (let i = 0; i < pointsPerVehicle; i++) {
    const t = now - (pointsPerVehicle - i) * stepMs;
    await prisma.vehicleLocation.create({
      data: {
        vehicleId: v2.id,
        latitude: BASE_LAT + 0.01 + i * 0.0002 + jitter(0, 0.0003),
        longitude: BASE_LNG + 0.01 + i * 0.0002 + jitter(0, 0.0003),
        speed: 25 + Math.random() * 15,
        heading: 45,
        recordedAt: new Date(t),
      },
    });
  }

  console.log('✅ Seeded:');
  console.log(`  ${v1.plateNumber} — ${pointsPerVehicle} points`);
  console.log(`  ${v2.plateNumber} — ${pointsPerVehicle} points`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });