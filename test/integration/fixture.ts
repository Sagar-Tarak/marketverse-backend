import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export function createTestClient(): PrismaClient {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is not set by global-setup.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** TRUNCATE does not fire the row-level append-only triggers, so it can clean ledger rows. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "users","scenario_templates","units_of_measure","product_categories","facility_types","industries","skill_groups" CASCADE',
  );
}

export interface WorldFixture {
  userId: string;
  worldId: string;
  regionId: string;
  cityId: string;
  companyId: string;
  facilityId: string;
  warehouseId: string;
  productId: string;
}

/** A complete minimal world: user → scenario → world → city → company → facility → warehouse + product. */
export async function createWorld(prisma: PrismaClient): Promise<WorldFixture> {
  const tag = randomUUID().slice(0, 8);

  const user = await prisma.user.create({
    data: { id: randomUUID(), email: `${tag}@test.dev` },
  });
  const scenario = await prisma.scenarioTemplate.create({
    data: {
      code: `S-${tag}`,
      version: 1,
      name: 'Test scenario',
      startDate: new Date('2030-01-01'),
      currencyCode: 'NVR',
      currencyMinorUnits: 2,
    },
  });
  const regionDef = await prisma.regionDefinition.create({
    data: { scenarioId: scenario.id, code: 'R', name: 'Region' },
  });
  const cityDef = await prisma.cityDefinition.create({
    data: { regionDefinitionId: regionDef.id, code: 'C', name: 'City' },
  });
  const world = await prisma.gameWorld.create({
    data: {
      ownerUserId: user.id,
      name: `World ${tag}`,
      scenarioCode: scenario.code,
      scenarioVersion: scenario.version,
      currencyCode: 'NVR',
      randomSeed: 1n,
      modelVersion: 'test',
      startingCapitalMinor: 0n,
    },
  });
  const region = await prisma.worldRegion.create({
    data: {
      worldId: world.id,
      regionDefinitionId: regionDef.id,
      code: 'R',
      name: 'Region',
    },
  });
  const city = await prisma.worldCity.create({
    data: {
      worldId: world.id,
      regionId: region.id,
      cityDefinitionId: cityDef.id,
      code: 'C',
      name: 'City',
    },
  });
  const company = await prisma.company.create({
    data: {
      worldId: world.id,
      companyCode: 'CO',
      name: 'Company',
      companyType: 'AI',
    },
  });
  const business = await prisma.business.create({
    data: {
      worldId: world.id,
      companyId: company.id,
      businessType: 'MANUFACTURING',
      name: 'Business',
      cityId: city.id,
    },
  });
  const facilityType = await prisma.facilityType.create({
    data: { code: `FT-${tag}`, name: 'Facility type' },
  });
  const facility = await prisma.facility.create({
    data: {
      worldId: world.id,
      companyId: company.id,
      businessId: business.id,
      facilityTypeId: facilityType.id,
      cityId: city.id,
      name: 'Facility',
      capacity: 1000,
    },
  });
  const warehouse = await prisma.warehouse.create({
    data: {
      worldId: world.id,
      facilityId: facility.id,
      code: 'W',
      capacity: 1000,
    },
  });
  const category = await prisma.productCategory.create({
    data: { code: `CAT-${tag}`, name: 'Category' },
  });
  const unit = await prisma.unitOfMeasure.create({
    data: { code: `U-${tag}`, name: 'Unit', dimension: 'COUNT' },
  });
  const product = await prisma.product.create({
    data: {
      code: `P-${tag}`,
      name: 'Product',
      categoryId: category.id,
      unitId: unit.id,
      productType: 'RAW_MATERIAL',
      referencePriceMinor: 100n,
    },
  });

  return {
    userId: user.id,
    worldId: world.id,
    regionId: region.id,
    cityId: city.id,
    companyId: company.id,
    facilityId: facility.id,
    warehouseId: warehouse.id,
    productId: product.id,
  };
}
