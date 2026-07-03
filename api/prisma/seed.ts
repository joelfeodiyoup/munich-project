import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

config();

interface SeedKita {
  name: string;
  website: string | null;
  cost: number | null;
  latitude: number;
  longitude: number;
  hasVacancies: boolean;
}

const kitas: SeedKita[] = [
  {
    name: 'Kinderkrippe Schwabing',
    website: 'https://example.com/schwabing',
    cost: 450.0,
    latitude: 48.1636,
    longitude: 11.5858,
    hasVacancies: true,
  },
  {
    name: 'Kindergarten Sendling',
    website: 'https://example.com/sendling',
    cost: 380.0,
    latitude: 48.1169,
    longitude: 11.5447,
    hasVacancies: false,
  },
  {
    name: 'Kita Maxvorstadt',
    website: null,
    cost: 420.0,
    latitude: 48.1511,
    longitude: 11.5656,
    hasVacancies: true,
  },
  {
    name: 'Kinderhaus Bogenhausen',
    website: 'https://example.com/bogenhausen',
    cost: 520.0,
    latitude: 48.1547,
    longitude: 11.6089,
    hasVacancies: false,
  },
  {
    name: 'Kita Neuhausen',
    website: 'https://example.com/neuhausen',
    cost: 395.0,
    latitude: 48.1605,
    longitude: 11.5375,
    hasVacancies: true,
  },
  {
    name: 'Kindergarten Haidhausen',
    website: 'https://example.com/haidhausen',
    cost: 410.0,
    latitude: 48.132,
    longitude: 11.6013,
    hasVacancies: false,
  },
  {
    name: 'Kinderkrippe Pasing',
    website: null,
    cost: 360.0,
    latitude: 48.1499,
    longitude: 11.4617,
    hasVacancies: true,
  },
  {
    name: 'Kita Laim',
    website: 'https://example.com/laim',
    cost: 385.0,
    latitude: 48.1396,
    longitude: 11.5025,
    hasVacancies: false,
  },
  {
    name: 'Kinderhaus Giesing',
    website: 'https://example.com/giesing',
    cost: 400.0,
    latitude: 48.1098,
    longitude: 11.5794,
    hasVacancies: true,
  },
  {
    name: 'Kindergarten Lehel',
    website: 'https://example.com/lehel',
    cost: 480.0,
    latitude: 48.1422,
    longitude: 11.5914,
    hasVacancies: false,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('connectionString: ', connectionString);
  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Starting seed...');

  for (const kita of kitas) {
    await prisma.kita.create({
      data: kita,
    });
    console.log(`Created kita: ${kita.name}`);
  }

  console.log('Seed completed successfully');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
