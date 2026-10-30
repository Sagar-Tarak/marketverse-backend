import type { Seeder } from './seeder.js';

interface RecipeSeed {
  recipeCode: string;
  name: string;
  facilityType: string;
  industry: string;
  batchDurationTicks: number;
  laborPerBatch: string;
  inputs: Readonly<Record<string, string>>;
  outputs: Readonly<Record<string, string>>;
}

// Quantities are per batch; margins are worked out in prisma/SEED_DESIGN.md.
const RECIPES: readonly RecipeSeed[] = [
  {
    recipeCode: 'WHEAT_FARM',
    name: 'Wheat farming',
    facilityType: 'WHEAT_FARM',
    industry: 'AGRICULTURE',
    batchDurationTicks: 5,
    laborPerBatch: '8',
    inputs: { FUEL: '40' },
    outputs: { WHEAT: '1000' },
  },
  {
    recipeCode: 'FLOUR_MILL',
    name: 'Flour milling',
    facilityType: 'FLOUR_MILL',
    industry: 'FOOD_PROCESSING',
    batchDurationTicks: 1,
    laborPerBatch: '8',
    inputs: { WHEAT: '1000', ELECTRICITY: '200' },
    outputs: { FLOUR: '800' },
  },
  {
    recipeCode: 'BAKERY_BREAD',
    name: 'Bread baking',
    facilityType: 'BAKERY',
    industry: 'FOOD_PROCESSING',
    batchDurationTicks: 1,
    laborPerBatch: '4',
    inputs: { FLOUR: '40', ELECTRICITY: '20' },
    outputs: { BREAD: '100' },
  },
  {
    recipeCode: 'POWER_PLANT',
    name: 'Electricity generation',
    facilityType: 'POWER_PLANT',
    industry: 'ENERGY_UTILITIES',
    batchDurationTicks: 1,
    laborPerBatch: '2',
    inputs: { FUEL: '200' },
    outputs: { ELECTRICITY: '1000' },
  },
  {
    recipeCode: 'FUEL_WORKS',
    name: 'Fuel production',
    facilityType: 'FUEL_WORKS',
    industry: 'ENERGY_UTILITIES',
    batchDurationTicks: 2,
    laborPerBatch: '20',
    inputs: {},
    outputs: { FUEL: '1000' },
  },
];

const VERSION = 1;

export const recipesSeeder: Seeder = {
  name: 'recipes',
  async run(tx) {
    for (const recipe of RECIPES) {
      const [facilityType, industry] = await Promise.all([
        tx.facilityType.findUniqueOrThrow({
          where: { code: recipe.facilityType },
        }),
        tx.industry.findUniqueOrThrow({ where: { code: recipe.industry } }),
      ]);
      const values = {
        name: recipe.name,
        facilityTypeId: facilityType.id,
        industryId: industry.id,
        batchDurationTicks: recipe.batchDurationTicks,
        laborPerBatch: recipe.laborPerBatch,
        status: 'ACTIVE' as const,
      };
      const row = await tx.productionRecipe.upsert({
        where: {
          recipeCode_version: {
            recipeCode: recipe.recipeCode,
            version: VERSION,
          },
        },
        update: values,
        create: { recipeCode: recipe.recipeCode, version: VERSION, ...values },
      });

      for (const [code, quantityPerBatch] of Object.entries(recipe.inputs)) {
        const product = await tx.product.findUniqueOrThrow({ where: { code } });
        await tx.recipeInput.upsert({
          where: {
            recipeId_productId: { recipeId: row.id, productId: product.id },
          },
          update: { quantityPerBatch },
          create: { recipeId: row.id, productId: product.id, quantityPerBatch },
        });
      }
      for (const [code, quantityPerBatch] of Object.entries(recipe.outputs)) {
        const product = await tx.product.findUniqueOrThrow({ where: { code } });
        await tx.recipeOutput.upsert({
          where: {
            recipeId_productId: { recipeId: row.id, productId: product.id },
          },
          update: { quantityPerBatch },
          create: { recipeId: row.id, productId: product.id, quantityPerBatch },
        });
      }
    }
  },
};
