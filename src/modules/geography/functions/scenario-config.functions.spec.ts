import type { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { parseScenarioConfig } from './scenario-config.functions.js';

const valid: Prisma.JsonObject = {
  referenceWageMinorPerHour: 1500,
  employmentRate: 0.92,
  routes: {
    transitKmPerTick: 400,
    costPerUnitKmMinor: 0.05,
    capacityPerTick: 1000000,
  },
  cities: { GREENFORD: { x: 100, y: 400, households: 1200 } },
  cohorts: { LOW_INCOME: { householdShare: 0.4, dailyIncomeMinor: 8000 } },
  skillGroups: { SKILLED: { workforceShare: 0.35, wageMultiplier: '1.4' } },
};

describe('parseScenarioConfig', () => {
  it('reads a valid config', () => {
    const config = parseScenarioConfig(valid);
    expect(config.cities.GREENFORD).toEqual({
      x: 100,
      y: 400,
      households: 1200,
    });
    expect(config.skillGroups.SKILLED).toEqual({
      workforceShare: 0.35,
      wageMultiplier: '1.4',
    });
    expect(config.routes.transitKmPerTick).toBe(400);
  });

  it('names the missing field instead of building a half-valid world', () => {
    const { employmentRate: _unused, ...rest } = valid;
    expect(() => parseScenarioConfig(rest)).toThrow('employmentRate');
  });

  it('rejects wrong types', () => {
    expect(() =>
      parseScenarioConfig({
        ...valid,
        cities: { A: { x: '1', y: 2, households: 3 } },
      }),
    ).toThrow('cities.A.x');
    expect(() => parseScenarioConfig(null)).toThrow('config must be an object');
  });
});
