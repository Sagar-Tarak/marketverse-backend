import { execFileSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/** `<dev db>_test` on the same server, created and synced on first run. */
function testDatabaseUrl(devUrl: string): {
  url: string;
  adminUrl: string;
  name: string;
} {
  const url = new URL(devUrl);
  const name = `${url.pathname.slice(1)}_test`;
  const admin = new URL(devUrl);
  admin.pathname = '/postgres';
  url.pathname = `/${name}`;
  return { url: url.toString(), adminUrl: admin.toString(), name };
}

export default async function setup(): Promise<void> {
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      'DATABASE_URL is not set. Run through `pnpm test:integration`.',
    );
  }
  const { url, adminUrl, name } = testDatabaseUrl(devUrl);

  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: adminUrl }),
  });
  try {
    const existing = await admin.$queryRawUnsafe<unknown[]>(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      name,
    );
    if (existing.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  const env = { ...process.env, DATABASE_URL: url };
  const prisma = ['exec', 'prisma'];
  execFileSync('pnpm', [...prisma, 'db', 'push', '--accept-data-loss'], {
    env,
    stdio: 'pipe',
  });
  execFileSync(
    'pnpm',
    [...prisma, 'db', 'execute', '--file', 'prisma/constraints.sql'],
    {
      env,
      stdio: 'pipe',
    },
  );

  process.env.TEST_DATABASE_URL = url;
}
