import type { Seeder } from './seeder.js';

const CATEGORIES = [
  { code: 'AGRICULTURE', name: 'Agriculture' },
  { code: 'FOOD', name: 'Food' },
  { code: 'ENERGY', name: 'Energy' },
] as const;

const INDUSTRIES = [
  { code: 'AGRICULTURE', name: 'Agriculture' },
  { code: 'FOOD_PROCESSING', name: 'Food processing' },
  { code: 'ENERGY_UTILITIES', name: 'Energy and utilities' },
  { code: 'RETAIL_DISTRIBUTION', name: 'Retail and distribution' },
] as const;

const SKILL_GROUPS = [
  { code: 'UNSKILLED', name: 'Unskilled labor' },
  { code: 'SKILLED', name: 'Skilled labor' },
  { code: 'PROFESSIONAL', name: 'Professional labor' },
] as const;

export const FACILITY_TYPES = [
  { code: 'WHEAT_FARM', name: 'Wheat farm', industry: 'AGRICULTURE' },
  { code: 'FLOUR_MILL', name: 'Flour mill', industry: 'FOOD_PROCESSING' },
  { code: 'BAKERY', name: 'Bakery', industry: 'FOOD_PROCESSING' },
  { code: 'POWER_PLANT', name: 'Power plant', industry: 'ENERGY_UTILITIES' },
  { code: 'FUEL_WORKS', name: 'Fuel works', industry: 'ENERGY_UTILITIES' },
  {
    code: 'RETAIL_STORE',
    name: 'Retail store',
    industry: 'RETAIL_DISTRIBUTION',
  },
] as const;

export const catalogSeeder: Seeder = {
  name: 'catalog',
  async run(tx) {
    for (const category of CATEGORIES) {
      await tx.productCategory.upsert({
        where: { code: category.code },
        update: { name: category.name },
        create: category,
      });
    }

    for (const industry of INDUSTRIES) {
      await tx.industry.upsert({
        where: { code: industry.code },
        update: { name: industry.name },
        create: industry,
      });
    }

    for (const skillGroup of SKILL_GROUPS) {
      await tx.skillGroup.upsert({
        where: { code: skillGroup.code },
        update: { name: skillGroup.name },
        create: skillGroup,
      });
    }

    for (const type of FACILITY_TYPES) {
      const industry = await tx.industry.findUniqueOrThrow({
        where: { code: type.industry },
      });
      await tx.facilityType.upsert({
        where: { code: type.code },
        update: { name: type.name, industryId: industry.id },
        create: { code: type.code, name: type.name, industryId: industry.id },
      });
    }
  },
};
