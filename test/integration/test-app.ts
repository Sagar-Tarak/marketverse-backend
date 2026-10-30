import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import { configureApp } from '../../src/config/app.config.js';
import type { AppConfig } from '../../src/config/configuration.js';
import { seeders } from '../../src/infrastructure/database/seeds/seeders.js';
import { createTestClient, resetDatabase } from './fixture.js';

export interface TestApp {
  readonly app: INestApplication;
  readonly prisma: PrismaClient;
  close(): Promise<void>;
}

/**
 * Boots the real app against the test database, configured like production (prefix, pipes,
 * filter, envelope). Use in `beforeAll`; call `close()` in `afterAll`.
 *
 * ConfigModule captures the env when AppModule is *defined*, so DATABASE_URL must be set
 * before AppModule is imported. That is why the import below is dynamic.
 */
export async function createTestApp(
  options: { seed?: boolean } = {},
): Promise<TestApp> {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl)
    throw new Error('TEST_DATABASE_URL is not set by global-setup.');

  const prisma = createTestClient();
  await resetDatabase(prisma);
  if (options.seed) {
    for (const seeder of seeders) {
      await prisma.$transaction((tx) => seeder.run(tx));
    }
  }

  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = testUrl;
  const { AppModule } = await import('../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const appUrl = moduleRef
    .get<ConfigService<AppConfig, true>>(ConfigService)
    .get('database.url', { infer: true });
  if (appUrl !== testUrl) {
    throw new Error('The app is not using the test database. Refusing to run.');
  }

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return {
    app,
    prisma,
    async close() {
      await app.close();
      await resetDatabase(prisma);
      await prisma.$disconnect();
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
    },
  };
}
