import type { Seeder } from './seeder.js';

const SCENARIO_CODE = 'NOVARA_PROTOTYPE';
const SCENARIO_VERSION = 1;

// x,y in km; households sum to 11 000. See prisma/SEED_DESIGN.md §3.
const REGIONS = [
  {
    code: 'NORTHVALE',
    name: 'Northvale',
    terrain: 'Fertile plains',
    cities: [
      {
        code: 'GREENFORD',
        name: 'Greenford',
        x: 100,
        y: 400,
        households: 1200,
      },
      { code: 'MILLHAVEN', name: 'Millhaven', x: 180, y: 430, households: 800 },
    ],
  },
  {
    code: 'EASTPORT',
    name: 'Eastport',
    terrain: 'Industrial corridor and seaport',
    cities: [
      { code: 'EASTPORT', name: 'Eastport', x: 520, y: 300, households: 1500 },
      {
        code: 'IRONHAVEN',
        name: 'Ironhaven',
        x: 470,
        y: 360,
        households: 1000,
      },
    ],
  },
  {
    code: 'WESTBRIDGE',
    name: 'Westbridge',
    terrain: 'Dense commercial',
    cities: [
      {
        code: 'WESTBRIDGE',
        name: 'Westbridge',
        x: 100,
        y: 120,
        households: 2000,
      },
      { code: 'FAIRVIEW', name: 'Fairview', x: 150, y: 80, households: 1200 },
    ],
  },
  {
    code: 'SOUTHBAY',
    name: 'Southbay',
    terrain: 'Port and energy coast',
    cities: [
      { code: 'SOUTHBAY', name: 'Southbay', x: 300, y: 20, households: 900 },
      {
        code: 'PORT_AZURE',
        name: 'Port Azure',
        x: 350,
        y: 40,
        households: 600,
      },
    ],
  },
  {
    code: 'CENTRALIA',
    name: 'Centralia',
    terrain: 'Administrative and financial center',
    cities: [
      {
        code: 'CENTRALIA',
        name: 'Centralia',
        x: 300,
        y: 220,
        households: 1800,
      },
    ],
  },
] as const;

// householdShare sums to 1; income is minor units per household per day.
const COHORTS = [
  {
    code: 'LOW_INCOME',
    name: 'Low income',
    householdSize: '3.4',
    priceSensitivity: '0.9',
    savingsPropensity: '0.02',
    householdShare: 0.4,
    dailyIncomeMinor: 8000,
  },
  {
    code: 'MIDDLE_INCOME',
    name: 'Middle income',
    householdSize: '2.8',
    priceSensitivity: '0.6',
    savingsPropensity: '0.10',
    householdShare: 0.45,
    dailyIncomeMinor: 14000,
  },
  {
    code: 'HIGH_INCOME',
    name: 'High income',
    householdSize: '2.2',
    priceSensitivity: '0.3',
    savingsPropensity: '0.25',
    householdShare: 0.15,
    dailyIncomeMinor: 28000,
  },
] as const;

export const scenarioNovaraSeeder: Seeder = {
  name: 'scenario-novara',
  async run(tx) {
    const config = {
      referenceWageMinorPerHour: 1500,
      breadPerHouseholdPerDay: 0.5,
      employmentRate: 0.92,
      // ponytail: capacity is effectively unlimited in the prototype; tighten when logistics matter.
      routes: {
        transitKmPerTick: 400,
        costPerUnitKmMinor: 0.05,
        capacityPerTick: 1_000_000,
      },
      // ponytail: placeholder balancing inputs; wageMultiplier scales referenceWageMinorPerHour.
      skillGroups: {
        UNSKILLED: { workforceShare: 0.6, wageMultiplier: '1' },
        SKILLED: { workforceShare: 0.35, wageMultiplier: '1.4' },
        PROFESSIONAL: { workforceShare: 0.05, wageMultiplier: '2' },
      },
      taxes: { salesTax: 0.1, corporateTax: 0.2 },
      cities: Object.fromEntries(
        REGIONS.flatMap((region) =>
          region.cities.map((city) => [
            city.code,
            { x: city.x, y: city.y, households: city.households },
          ]),
        ),
      ),
      cohorts: Object.fromEntries(
        COHORTS.map((c) => [
          c.code,
          {
            householdShare: c.householdShare,
            dailyIncomeMinor: c.dailyIncomeMinor,
          },
        ]),
      ),
    };
    const values = {
      name: 'Novara prototype',
      description: 'Five regions, nine cities, five products.',
      status: 'PUBLISHED' as const,
      startDate: new Date('2030-01-01'),
      currencyCode: 'NVR',
      currencyMinorUnits: 2,
      config,
    };
    const scenario = await tx.scenarioTemplate.upsert({
      where: {
        code_version: { code: SCENARIO_CODE, version: SCENARIO_VERSION },
      },
      update: values,
      create: { code: SCENARIO_CODE, version: SCENARIO_VERSION, ...values },
    });

    for (const region of REGIONS) {
      const regionRow = await tx.regionDefinition.upsert({
        where: {
          scenarioId_code: { scenarioId: scenario.id, code: region.code },
        },
        update: { name: region.name, terrain: region.terrain },
        create: {
          scenarioId: scenario.id,
          code: region.code,
          name: region.name,
          terrain: region.terrain,
        },
      });
      for (const city of region.cities) {
        await tx.cityDefinition.upsert({
          where: {
            regionDefinitionId_code: {
              regionDefinitionId: regionRow.id,
              code: city.code,
            },
          },
          update: { name: city.name },
          create: {
            regionDefinitionId: regionRow.id,
            code: city.code,
            name: city.name,
          },
        });
      }
    }

    for (const cohort of COHORTS) {
      const cohortValues = {
        name: cohort.name,
        householdSize: cohort.householdSize,
        priceSensitivity: cohort.priceSensitivity,
        savingsPropensity: cohort.savingsPropensity,
      };
      await tx.cohortDefinition.upsert({
        where: {
          scenarioId_code: { scenarioId: scenario.id, code: cohort.code },
        },
        update: cohortValues,
        create: { scenarioId: scenario.id, code: cohort.code, ...cohortValues },
      });
    }
  },
};
