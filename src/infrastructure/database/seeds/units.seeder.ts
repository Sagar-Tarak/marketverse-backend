import type { UnitDimension } from '@prisma/client';
import type { Seeder } from './seeder.js';

const UNITS: readonly {
  code: string;
  name: string;
  dimension: UnitDimension;
}[] = [
  { code: 'KG', name: 'kilogram', dimension: 'MASS' },
  { code: 'T', name: 'tonne', dimension: 'MASS' },
  { code: 'L', name: 'litre', dimension: 'VOLUME' },
  { code: 'KWH', name: 'kilowatt-hour', dimension: 'ENERGY' },
  { code: 'EA', name: 'each', dimension: 'COUNT' },
  { code: 'HR', name: 'labor-hour', dimension: 'TIME' },
];

const CONVERSIONS: readonly { from: string; to: string; factor: string }[] = [
  { from: 'T', to: 'KG', factor: '1000' },
  { from: 'KG', to: 'T', factor: '0.001' },
];

export const unitsSeeder: Seeder = {
  name: 'units',
  async run(tx) {
    for (const unit of UNITS) {
      await tx.unitOfMeasure.upsert({
        where: { code: unit.code },
        update: { name: unit.name, dimension: unit.dimension },
        create: unit,
      });
    }

    for (const conversion of CONVERSIONS) {
      const [fromUnit, toUnit] = await Promise.all([
        tx.unitOfMeasure.findUniqueOrThrow({
          where: { code: conversion.from },
        }),
        tx.unitOfMeasure.findUniqueOrThrow({ where: { code: conversion.to } }),
      ]);
      await tx.unitConversion.upsert({
        where: {
          fromUnitId_toUnitId: { fromUnitId: fromUnit.id, toUnitId: toUnit.id },
        },
        update: { factor: conversion.factor },
        create: {
          fromUnitId: fromUnit.id,
          toUnitId: toUnit.id,
          factor: conversion.factor,
        },
      });
    }
  },
};
