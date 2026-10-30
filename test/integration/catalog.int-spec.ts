import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

let testApp: TestApp;
let app: TestApp['app'];

beforeAll(async () => {
  testApp = await createTestApp({ seed: true });
  app = testApp.app;
});

afterAll(() => testApp.close());

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
