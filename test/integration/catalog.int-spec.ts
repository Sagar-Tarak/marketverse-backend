import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../../src/config/app.config.js';
import { seeders } from '../../src/infrastructure/database/seeds/seeders.js';
import { createTestClient, resetDatabase } from './fixture.js';

let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = createTestClient();
  await resetDatabase(prisma);
  for (const seeder of seeders) {
    await prisma.$transaction((tx) => seeder.run(tx));
  }

  // ConfigModule captures the env when AppModule is *defined* (at import), so point
  // DATABASE_URL at the test database first and import AppModule afterwards.
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { AppModule } = await import('../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  expect(moduleRef.get(ConfigService).get('DATABASE_URL')).toBe(
    process.env.TEST_DATABASE_URL,
  );
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
});

afterAll(async () => {
  await app.close();
  await resetDatabase(prisma);
  await prisma.$disconnect();
});

describe('GET /api/v1/catalog', () => {
  it('lists units', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog/units')
      .expect(200);
    expect(res.body.data.map((u: { code: string }) => u.code)).toContain('KG');
  });

  it('lists products with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog/products?page=1&limit=2')
      .expect(200);
    expect(res.body).toMatchObject({
      statusCode: 200,
      count: 5,
      paginationMetadata: { page: 1, limit: 2, totalPages: 3 },
    });
    expect(res.body.data).toHaveLength(2);
  });

  it('rejects an invalid page size', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/catalog/products?limit=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/catalog/products?limit=101')
      .expect(400);
  });

  it('returns a product with money as a string', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog/products/BREAD')
      .expect(200);
    expect(res.body.data).toMatchObject({
      code: 'BREAD',
      category: 'FOOD',
      unit: 'EA',
      referencePriceMinor: '100',
    });
  });

  it('returns 404 for an unknown product', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/catalog/products/NOPE')
      .expect(404);
  });

  it('returns a recipe with its inputs and outputs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog/recipes/FLOUR_MILL')
      .expect(200);
    expect(
      res.body.data.inputs.map((i: { productCode: string }) => i.productCode),
    ).toEqual(['ELECTRICITY', 'WHEAT']);
    expect(res.body.data.outputs).toEqual([
      { productCode: 'FLOUR', quantityPerBatch: '800', isByProduct: false },
    ]);
  });
});
