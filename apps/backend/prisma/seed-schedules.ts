import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL missing');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// 0=Sunday, 1=Monday, ..., 6=Saturday
const ROUTES = [
  {
    name: 'Route A',
    vehicle: 'RI 3117 Tractor',
    driver: 'Mr. Sujith',
    workers: 'Mr. E.G. Suranga, Mr. N.W.A. Ruwan',
    days: [1, 2, 3, 4, 5], // Mon-Fri
  },
  {
    name: 'Route B',
    vehicle: 'RI 3013 Tractor',
    driver: 'Mr. U.G. Lahiru Prabhath',
    workers: 'Mr. G.W. Chaminda Darshana, Mr. P.A. Samanthilaka',
    days: [1, 2, 3, 4, 5],
  },
  {
    name: 'Route C',
    vehicle: 'RD 3041 Tractor',
    driver: 'Mr. K.K. Tharaka',
    workers: 'Mr. L.U.P. Chathuranga, Mr. S.T. Dimuthu Kumara',
    days: [1, 2, 3, 4, 5],
  },
  {
    name: 'Route D',
    vehicle: 'RD 0194 Tractor',
    driver: 'Mr. K.H.C. Hemanna',
    workers: 'Mr. B.W. Sunil, Mr. L.W. Sanjeewa',
    days: [1, 2, 3, 4, 5],
  },
  {
    name: 'Route E',
    vehicle: 'RE 8365 Tractor',
    driver: 'Mr. H.G. Vipula Suranga',
    workers: 'Mr. H.G. Gayan Chathuranga, Mr. M.K.W.L. Kumara',
    days: [1, 2, 3, 4, 5, 6], // Mon-Sat
  },
];

const START_TIME = '05:00';

async function main() {
  console.log('Seeding collection schedules…');

  for (const route of ROUTES) {
    const area = await prisma.area.findUnique({
      where: { name: route.name },
    });

    if (!area) {
      console.warn(`Area not found: ${route.name} — skipping`);
      continue;
    }

    // Wipe existing schedules for this area, then re-create
    await prisma.collectionSchedule.deleteMany({
      where: { areaId: area.id },
    });

    for (const dayOfWeek of route.days) {
      await prisma.collectionSchedule.create({
        data: {
          areaId: area.id,
          dayOfWeek,
          startTime: START_TIME,
          vehicle: route.vehicle,
          driver: route.driver,
          workers: route.workers,
        },
      });
    }

    console.log(`  ${route.name} — ${route.days.length} days`);
  }

  const total = await prisma.collectionSchedule.count();
  console.log(`\n✅ Done. ${total} schedule rows.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });