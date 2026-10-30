import { describe, expect, it } from 'vitest';
import {
  buildCityCohorts,
  buildRegionLaborPools,
  splitByShares,
} from './population.functions.js';

// Novara scenario (prisma/SEED_DESIGN.md §2–§3).
const cohorts = [
  { id: 'low', householdShare: 0.4, dailyIncomeMinor: 8000 },
  { id: 'mid', householdShare: 0.45, dailyIncomeMinor: 14000 },
  { id: 'high', householdShare: 0.15, dailyIncomeMinor: 28000 },
];
const cityHouseholds = {
  GREENFORD: 1200,
  MILLHAVEN: 800,
  EASTPORT: 1500,
  IRONHAVEN: 1000,
  WESTBRIDGE: 2000,
  FAIRVIEW: 1200,
  SOUTHBAY: 900,
  PORT_AZURE: 600,
  CENTRALIA: 1800,
};
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

describe('splitByShares', () => {
  it('always adds back up to the total', () => {
    for (const total of [0, 1, 7, 999, 1201, 10_120]) {
      expect(sum(splitByShares(total, [0.4, 0.45, 0.15]))).toBe(total);
    }
  });

  it('gives the extra unit to the largest remainder: 10 in thirds → 4, 3, 3', () => {
    expect(splitByShares(10, [1, 1, 1])).toEqual([4, 3, 3]);
  });

  it('rejects weights that add up to nothing', () => {
    expect(() => splitByShares(10, [0, 0])).toThrow('more than zero');
  });
});

describe('buildCityCohorts', () => {
  it('splits Greenford 1200 households 40/45/15 into 480/540/180', () => {
    const rows = buildCityCohorts(1200, cohorts, 0.92);
    expect(rows.map((r) => r.householdCount)).toEqual([480, 540, 180]);
  });

  it('shares Greenford’s 1104 employed (1200 × 0.92) in proportion', () => {
    const rows = buildCityCohorts(1200, cohorts, 0.92);
    expect(sum(rows.map((r) => r.employedWorkforce))).toBe(1104);
    for (const row of rows) {
      expect(row.employedWorkforce + row.unemployedWorkforce).toBe(
        row.householdCount,
      );
    }
  });

  it('prices the cohort income: 480 households × 8 000 = 3 840 000 per day', () => {
    expect(
      buildCityCohorts(1200, cohorts, 0.92)[0]?.disposableIncomeMinor,
    ).toBe(3_840_000n);
  });

  it('builds 27 cohorts, 11 000 households and 10 120 employed for the whole country', () => {
    const rows = Object.values(cityHouseholds).flatMap((households) =>
      buildCityCohorts(households, cohorts, 0.92),
    );
    expect(rows).toHaveLength(27);
    expect(sum(rows.map((r) => r.householdCount))).toBe(11_000);
    expect(sum(rows.map((r) => r.employedWorkforce))).toBe(10_120);
  });
});

describe('buildRegionLaborPools', () => {
  const groups = [
    { id: 'unskilled', workforceShare: 0.6, wageMultiplier: '1' },
    { id: 'skilled', workforceShare: 0.35, wageMultiplier: '1.4' },
    { id: 'professional', workforceShare: 0.05, wageMultiplier: '2' },
  ];

  it('splits Northvale’s 2000 workers 1200/700/100 and pays 1500/2100/3000 per hour', () => {
    const pools = buildRegionLaborPools(2000, groups, 0.92, 1500);
    expect(pools.map((p) => p.workforce)).toEqual([1200, 700, 100]);
    expect(pools.map((p) => p.wageRateMinor)).toEqual([1500n, 2100n, 3000n]);
  });

  it('never employs more workers than a pool has', () => {
    for (const pool of buildRegionLaborPools(37, groups, 0.92, 1500)) {
      expect(pool.employed).toBeLessThanOrEqual(pool.workforce);
    }
  });

  it('matches the city view: the five regions employ 10 120 in total', () => {
    const regionWorkforces = [2000, 2500, 3200, 1500, 1800];
    const employed = regionWorkforces.flatMap((workforce) =>
      buildRegionLaborPools(workforce, groups, 0.92, 1500).map(
        (p) => p.employed,
      ),
    );
    expect(sum(employed)).toBe(10_120);
  });
});
