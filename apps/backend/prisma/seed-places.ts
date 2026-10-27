import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL missing');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ROUTES: Record<string, { description: string; places: string[] }> = {
  'Route A': {
    description: 'RI 3117 Tractor — Kalegana / Piyadigama / Bope',
    places: [
      'Kalegana Junction',
      'Lendæwa Road',
      'Southern Provincial Council',
      'Polkandawila Road',
      'Finance Land Three',
      'Egodakanatta',
      'Watareka Temple Road',
      'Piyadigama Dadalla',
      'Gintota Railway Road',
      'Flywood Road',
      'Hillur Church Road',
      'Thuparama Bharadwaja Manta',
      'Ginikurunda Kanda',
      'Welipitimodara',
      'Maha Hapugala',
      'Godawatta',
      'Kuruduwatta',
      'Abdul Azeez Mawatha',
      'Samanala Uyana',
      'Piyadigama',
      'Bope',
      'Kingscourt Land',
      'Tsunami Village',
      'Elabada',
    ],
  },
  'Route B': {
    description: 'RI 3013 Tractor — Sarasavi Uyana / Hapugala',
    places: [
      'Sarasavi Uyana',
      'Sarasavi Asapuwa',
      'Ape Gama Ratnayake Watta',
      'Beraliyadola Watta',
      'Aluth Watta',
      'Parana Watta',
      'Army Village',
      'Godalinda Watta',
      'Universal City',
      'Batuwanthudawa Road',
      'Access Finance',
      'Panorama Garden',
      'Niladeniya Narangahawatta',
      'Sea Line Finance',
      'Niladeniya Finance',
      'Mount Pleasant Watta',
      'Jana Udana Village',
      'Darlington Watta',
      'Centreatas Watta',
      'Pengiri Watta',
      'Hapugala Temple Road',
      'Wakwella Training Institute',
    ],
  },
  'Route C': {
    description: 'RD 3041 Tractor — Hapugala / Kithulampitiya',
    places: [
      'Isuru Mawatha',
      '1st Cross Road',
      '2nd Cross Road',
      '4th Cross Road',
      'V. Seetha Road',
      'Hapugala',
      'Rathnagiriwatta',
      'Watareka Kalupahana',
      'Kohombange Watta',
      'Tiny Road',
      'Mihindu Mawatha',
      'Kodithuwakku Watta',
      'Isuru Area',
      'Hirimbura',
      'Godakanda',
      'Justin Kanda',
      'Gamunu Mawatha',
      'Grace City',
      'Prarthana Area',
      'Nawinna',
      'Nariduwa',
      'Supreme City',
      'Kahaduwatta',
      'Puwakwatta',
      'D.I.C. City',
      'Kithulampitiya',
      'Sethsiri Mawatha',
      'Edirisinhna Mawatha',
      'Atambagaha Junction',
      'Ukuwatta',
      'Bimbirigoda',
      'Digoda',
    ],
  },
  'Route D': {
    description: 'RD 0194 Tractor — Kalegana / Thotagoda / Poddala',
    places: [
      'Kalegana to Thotagoda',
      'Cargills',
      'Ruhunu Hospital',
      'Commercial Complex',
      'Dakshinapaya',
      'Government Housing',
      'Kalegana to Poddala',
      'Ovenmo Restaurant',
      'Kalegana to Molligoda',
      'Kalegana to Karapitiya Maternity Hospital',
      'Meepawala',
      'Kalegana to Poddala Main Road',
    ],
  },
  'Route E': {
    description: 'RE 8365 Tractor — Crystal City / Labuduwa / Meepawala',
    places: [
      'Crystal City',
      'Sunshine Garden',
      'Bogahawella',
      'Pandora Montessori Road',
      'Labuduwa',
      'Meepawala Temple Road',
      'Meepawala Sub Office',
      'Holuwagoda Devalaya Road',
      'Araliya Uyana',
      'Ranaviru Prasanna Mawatha',
      'Uluwitike Temple Road',
      'Opatha Road',
      'Pelpolawatta Godakanda Road',
      'River Park',
      'Buddika House Road',
      'Bangalawatta Cross Road',
      'Godakanda Road',
      'Pelpolawatta',
      'Sarappu Watta',
      'Kirimetimulla',
      'Finance Land',
      'Thuththiripitiya',
      'Government Housing Road',
      'Brightway Class',
      'Aegis Elaperuma Mawatha',
      'Sangharathana Mawatha',
      'Health Medical Officer Office Road',
      'Godakanda Temple Road',
      'Takkiyawatta Road',
      'Hikgahawatta',
      'Sewa Piyasa Road',
      'Labuduwa Commercial Complex',
      'Morris Road',
      'Primrose Park',
      'Kapuhempala Road',
      'Bedipara',
    ],
  },
};

async function main() {
  console.log('Seeding routes and places…');

  for (const [routeName, { description, places }] of Object.entries(ROUTES)) {
    const area = await prisma.area.upsert({
      where: { name: routeName },
      update: { isActive: true },
      create: { name: routeName, isActive: true },
    });

    console.log(`\n${routeName} (${description})`);
    console.log(`  Area ID: ${area.id}`);
    console.log(`  ${places.length} places`);

    for (const placeName of places) {
      await prisma.place.upsert({
        where: { name: placeName },
        update: { areaId: area.id },
        create: { name: placeName, areaId: area.id },
      });
    }
  }

  const [areaCount, placeCount] = await Promise.all([
    prisma.area.count(),
    prisma.place.count(),
  ]);

  console.log(`\n✅ Done. ${areaCount} routes, ${placeCount} places.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });