import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL missing');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// dayOfWeek: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
type RouteConfig = {
  name: string;
  vehicle: string;
  driver: string;
  workers: string;
  color: string;
  days: {
    dayOfWeek: number;
    places: string[]; // ordered by stop position
  }[];
};

const ROUTES: RouteConfig[] = [
  {
    name: 'Route A',
    vehicle: 'RI 3117 Tractor',
    driver: 'Mr. Sujith',
    workers: 'Mr. E.G. Suranga, Mr. N.W.A. Ruwan',
    color: '#0F766E',
    days: [
      {
        dayOfWeek: 1,
        places: [
          'Kalegana Junction',
          'Lendæwa Road',
          'Southern Provincial Council',
          'Polkandawila Road',
          'Finance Land Three',
          'Egodakanatta',
          'Watareka Temple Road',
          'Piyadigama Dadalla',
        ],
      },
      {
        dayOfWeek: 2,
        places: [
          'Kalegana Junction',
          'Gintota Railway Road',
          'Flywood Road',
          'Hillur Church Road',
          'Thuparama Bharadwaja Manta',
        ],
      },
      {
        dayOfWeek: 3,
        places: [
          'Ginikurunda Kanda',
          'Welipitimodara',
          'Maha Hapugala',
          'Godawatta',
          'Kuruduwatta',
        ],
      },
      {
        dayOfWeek: 4,
        places: [
          'Kalegana Junction',
          'Lendæwa Road',
          'Ginikurunda Kanda',
          'Welipitimodara',
          'Abdul Azeez Mawatha',
          'Kuruduwatta',
          'Samanala Uyana',
          'Gintota Railway Road',
        ],
      },
      {
        dayOfWeek: 5,
        places: [
          'Kalegana Junction',
          'Piyadigama',
          'Bope',
          'Kingscourt Land',
          'Tsunami Village',
          'Elabada',
        ],
      },
    ],
  },
  {
    name: 'Route B',
    vehicle: 'RI 3013 Tractor',
    driver: 'Mr. U.G. Lahiru Prabhath',
    workers: 'Mr. G.W. Chaminda Darshana, Mr. P.A. Samanthilaka',
    color: '#0369A1',
    days: [
      {
        dayOfWeek: 1,
        places: ['Sarasavi Uyana', 'Sarasavi Asapuwa'],
      },
      {
        dayOfWeek: 2,
        places: [
          'Ape Gama Ratnayake Watta',
          'Beraliyadola Watta',
          'Aluth Watta',
          'Parana Watta',
          'Army Village',
        ],
      },
      {
        dayOfWeek: 3,
        places: [
          'Godalinda Watta',
          'Universal City',
          'Batuwanthudawa Road',
          'Access Finance',
          'Panorama Garden',
          'Niladeniya Narangahawatta',
        ],
      },
      {
        dayOfWeek: 4,
        places: [
          'Sea Line Finance',
          'Niladeniya Finance',
          'Mount Pleasant Watta',
          'Jana Udana Village',
          'Darlington Watta',
        ],
      },
      {
        dayOfWeek: 5,
        places: [
          'Centreatas Watta',
          'Pengiri Watta',
          'Hapugala Temple Road',
          'Wakwella Training Institute',
        ],
      },
    ],
  },
  {
    name: 'Route C',
    vehicle: 'RD 3041 Tractor',
    driver: 'Mr. K.K. Tharaka',
    workers: 'Mr. L.U.P. Chathuranga, Mr. S.T. Dimuthu Kumara',
    color: '#B45309',
    days: [
      {
        dayOfWeek: 1,
        places: [
          'Isuru Mawatha',
          '1st Cross Road',
          '2nd Cross Road',
          '4th Cross Road',
          'V. Seetha Road',
          'Hapugala',
          'Rathnagiriwatta',
        ],
      },
      {
        dayOfWeek: 2,
        places: [
          'Watareka Kalupahana',
          'Samanala Uyana',
          'Kohombange Watta',
          'Tiny Road',
          'Mihindu Mawatha',
          'Kodithuwakku Watta',
          'Isuru Area',
        ],
      },
      {
        dayOfWeek: 3,
        places: [
          'Hirimbura',
          'Godakanda',
          'Justin Kanda',
          'Gamunu Mawatha',
          'Grace City',
          'Prarthana Area',
        ],
      },
      {
        dayOfWeek: 4,
        places: [
          'Nawinna',
          'Nariduwa',
          'Supreme City',
          'Kahaduwatta',
          'Puwakwatta',
          'D.I.C. City',
        ],
      },
      {
        dayOfWeek: 5,
        places: [
          'Kithulampitiya',
          'Sethsiri Mawatha',
          'Edirisinhna Mawatha',
          'Hapugala',
          'Atambagaha Junction',
          'Ukuwatta',
          'Bimbirigoda',
          'Digoda',
        ],
      },
    ],
  },
  {
    name: 'Route D',
    vehicle: 'RD 0194 Tractor',
    driver: 'Mr. K.H.C. Hemanna',
    workers: 'Mr. B.W. Sunil, Mr. L.W. Sanjeewa',
    color: '#B91C1C',
    days: [
      {
        dayOfWeek: 1,
        places: [
          'Kalegana to Thotagoda',
          'Cargills',
          'Ruhunu Hospital',
          'Commercial Complex',
          'Dakshinapaya',
          'Government Housing',
        ],
      },
      {
        dayOfWeek: 2,
        places: ['Kalegana to Poddala', 'Ovenmo Restaurant'],
      },
      {
        dayOfWeek: 3,
        places: ['Kalegana to Molligoda'],
      },
      {
        dayOfWeek: 4,
        places: [
          'Kalegana to Karapitiya Maternity Hospital',
          'Meepawala',
        ],
      },
      {
        dayOfWeek: 5,
        places: ['Kalegana to Poddala Main Road'],
      },
    ],
  },
  {
    name: 'Route E',
    vehicle: 'RE 8365 Tractor',
    driver: 'Mr. H.G. Vipula Suranga',
    workers: 'Mr. H.G. Gayan Chathuranga, Mr. M.K.W.L. Kumara',
    color: '#9333EA',
    days: [
      {
        dayOfWeek: 1,
        places: [
          'Crystal City',
          'Sunshine Garden',
          'Bogahawella',
          'Pandora Montessori Road',
          'Labuduwa',
        ],
      },
      {
        dayOfWeek: 2,
        places: [
          'Meepawala Temple Road',
          'Meepawala Sub Office',
          'Holuwagoda Devalaya Road',
          'Araliya Uyana',
          'Ranaviru Prasanna Mawatha',
          'Uluwitike Temple Road',
          'Opatha Road',
          'Pelpolawatta Godakanda Road',
        ],
      },
      {
        dayOfWeek: 3,
        places: [
          'River Park',
          'Buddika House Road',
          'Bangalawatta Cross Road',
          'Godakanda Road',
          'Pelpolawatta',
          'Sarappu Watta',
          'Kirimetimulla',
        ],
      },
      {
        dayOfWeek: 4,
        places: [
          'River Park',
          'Holuwagoda Devalaya Road',
          'Finance Land',
          'Labuduwa',
          'Thuththiripitiya',
          'Government Housing Road',
        ],
      },
      {
        dayOfWeek: 5,
        places: [
          'River Park',
          'Crystal City',
          'Brightway Class',
          'Aegis Elaperuma Mawatha',
          'Sangharathana Mawatha',
          'Health Medical Officer Office Road',
          'Godakanda Temple Road',
          'Takkiyawatta Road',
          'Hikgahawatta',
          'Sewa Piyasa Road',
        ],
      },
      {
        dayOfWeek: 6,
        places: [
          'River Park',
          'Labuduwa Commercial Complex',
          'Morris Road',
          'Primrose Park',
          'Kapuhempala Road',
          'Bedipara',
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seeding route schedules and stops…');

  for (const route of ROUTES) {
    // Upsert the Area with new fields
    const area = await prisma.area.upsert({
      where: { name: route.name },
      update: {
        vehicle: route.vehicle,
        driver: route.driver,
        workers: route.workers,
        color: route.color,
        isActive: true,
      },
      create: {
        name: route.name,
        vehicle: route.vehicle,
        driver: route.driver,
        workers: route.workers,
        color: route.color,
        isActive: true,
      },
    });

    console.log(`\n${route.name} (${route.vehicle})`);
    console.log(`  Driver: ${route.driver}`);
    console.log(`  ${route.days.length} day(s)`);

    // Wipe existing schedules for this area
    await prisma.routeSchedule.deleteMany({
      where: { areaId: area.id },
    });

    for (const day of route.days) {
      const schedule = await prisma.routeSchedule.create({
        data: {
          areaId: area.id,
          dayOfWeek: day.dayOfWeek,
          startTime: '05:00',
        },
      });

      let position = 1;
      let added = 0;
      let skipped = 0;

      for (const placeName of day.places) {
        const place = await prisma.place.findUnique({
          where: { name: placeName },
        });

        if (!place) {
          console.warn(`    ⚠ place not found: "${placeName}" — skipping`);
          skipped++;
          continue;
        }

        // If place is not already linked to this area, update it
        if (place.areaId !== area.id) {
          await prisma.place.update({
            where: { id: place.id },
            data: { areaId: area.id },
          });
        }

        await prisma.routeStop.create({
          data: {
            scheduleId: schedule.id,
            placeId: place.id,
            order: position,
          },
        });

        position++;
        added++;
      }

      console.log(
        `  Day ${day.dayOfWeek}: ${added} stops${skipped > 0 ? ` (${skipped} skipped)` : ''}`,
      );
    }
  }

  const totals = await Promise.all([
    prisma.routeSchedule.count(),
    prisma.routeStop.count(),
  ]);

  console.log(
    `\n✅ Done. ${totals[0]} schedules, ${totals[1]} stops total.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });