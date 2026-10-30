import type { ProductType } from '@prisma/client';
import type { Seeder } from './seeder.js';

// referencePriceMinor is in NVR minor units per unit; see prisma/SEED_DESIGN.md.
const PRODUCTS: readonly {
  code: string;
  name: string;
  category: string;
  unit: string;
  productType: ProductType;
  referencePriceMinor: bigint;
  shelfLifeTicks: number | null;
  transportFactor: string;
}[] = [
  {
    code: 'WHEAT',
    name: 'Wheat',
    category: 'AGRICULTURE',
    unit: 'KG',
    productType: 'RAW_MATERIAL',
    referencePriceMinor: 16n,
    shelfLifeTicks: 180,
    transportFactor: '0.05',
  },
  {
    code: 'FLOUR',
    name: 'Flour',
    category: 'FOOD',
    unit: 'KG',
    productType: 'INTERMEDIATE',
    referencePriceMinor: 45n,
    shelfLifeTicks: 90,
    transportFactor: '0.05',
  },
  {
    code: 'BREAD',
    name: 'Bread',
    category: 'FOOD',
    unit: 'EA',
    productType: 'FINISHED_GOOD',
    referencePriceMinor: 100n,
    shelfLifeTicks: 3,
    transportFactor: '0.5',
  },
  {
    code: 'ELECTRICITY',
    name: 'Electricity',
    category: 'ENERGY',
    unit: 'KWH',
    productType: 'RAW_MATERIAL',
    referencePriceMinor: 12n,
    shelfLifeTicks: 1,
    transportFactor: '0',
  },
  {
    code: 'FUEL',
    name: 'Fuel',
    category: 'ENERGY',
    unit: 'L',
    productType: 'RAW_MATERIAL',
    referencePriceMinor: 40n,
    shelfLifeTicks: null,
    transportFactor: '0.1',
  },
];

export const productsSeeder: Seeder = {
  name: 'products',
  async run(tx) {
    for (const product of PRODUCTS) {
      const [category, unit] = await Promise.all([
        tx.productCategory.findUniqueOrThrow({
          where: { code: product.category },
        }),
        tx.unitOfMeasure.findUniqueOrThrow({ where: { code: product.unit } }),
      ]);
      const values = {
        name: product.name,
        categoryId: category.id,
        unitId: unit.id,
        productType: product.productType,
        referencePriceMinor: product.referencePriceMinor,
        shelfLifeTicks: product.shelfLifeTicks,
        transportFactor: product.transportFactor,
      };
      await tx.product.upsert({
        where: { code: product.code },
        update: values,
        create: { code: product.code, ...values },
      });
    }
  },
};
