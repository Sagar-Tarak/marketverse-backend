import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { seeders } from './seeders.js';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const requested = new Set(process.argv.slice(2));
  const unknown = [...requested].filter(
    (name) => !seeders.some((seeder) => seeder.name === name),
  );
  if (unknown.length > 0) {
    throw new Error(`Unknown seeder(s): ${unknown.join(', ')}`);
  }

  const selected = seeders.filter(
    (seeder) => requested.size === 0 || requested.has(seeder.name),
  );
  if (selected.length === 0) {
    console.log('No seeders registered.');
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    for (const seeder of selected) {
      console.log(`Seeding ${seeder.name}...`);
      await prisma.$transaction((tx) => seeder.run(tx));
    }
    console.log(`Done: ${selected.length} seeder(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
