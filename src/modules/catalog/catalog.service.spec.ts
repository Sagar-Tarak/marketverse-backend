import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../common/utils/app-error.util.js';
import { CatalogService } from './catalog.service.js';

const breadRow = {
  code: 'BREAD',
  name: 'Bread',
  productType: 'FINISHED_GOOD',
  referencePriceMinor: 9_007_199_254_740_993n,
  shelfLifeTicks: 3,
  transportFactor: new Prisma.Decimal('0.5000'),
  isTradable: true,
  category: { code: 'FOOD' },
  unit: { code: 'EA' },
};

function serviceWith(prisma: object): CatalogService {
  return new CatalogService(prisma as never);
}

describe('CatalogService', () => {
  describe('getProduct', () => {
    it('serialises money and decimals as strings so JSON never sees a BigInt', async () => {
      const service = serviceWith({
        product: { findUnique: () => Promise.resolve(breadRow) },
      });

      const view = await service.getProduct('BREAD');

      expect(view.referencePriceMinor).toBe('9007199254740993');
      expect(view.transportFactor).toBe('0.5');
      expect(view.category).toBe('FOOD');
      expect(view.unit).toBe('EA');
      expect(() => JSON.stringify(view)).not.toThrow();
    });

    it('answers 404 for an unknown product', async () => {
      const service = serviceWith({
        product: { findUnique: () => Promise.resolve(null) },
      });

      const error = await service.getProduct('NOPE').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('getRecipe', () => {
    it('answers 404 for an unknown recipe', async () => {
      const service = serviceWith({
        productionRecipe: { findFirst: () => Promise.resolve(null) },
      });

      const error = await service.getRecipe('NOPE').catch((e: unknown) => e);

      expect((error as AppError).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('lists recipe inputs and outputs by product code', async () => {
      const service = serviceWith({
        productionRecipe: {
          findFirst: () =>
            Promise.resolve({
              recipeCode: 'FLOUR_MILL',
              version: 1,
              name: 'Flour milling',
              batchDurationTicks: 1,
              laborPerBatch: new Prisma.Decimal('8'),
              facilityType: { code: 'FLOUR_MILL' },
              industry: null,
              inputs: [
                {
                  product: { code: 'WHEAT' },
                  quantityPerBatch: new Prisma.Decimal('1000.0000'),
                },
              ],
              outputs: [
                {
                  product: { code: 'FLOUR' },
                  quantityPerBatch: new Prisma.Decimal('800'),
                  isByProduct: false,
                },
              ],
            }),
        },
      });

      const view = await service.getRecipe('FLOUR_MILL');

      expect(view.industry).toBeNull();
      expect(view.inputs).toEqual([
        { productCode: 'WHEAT', quantityPerBatch: '1000' },
      ]);
      expect(view.outputs).toEqual([
        { productCode: 'FLOUR', quantityPerBatch: '800', isByProduct: false },
      ]);
    });
  });
});
