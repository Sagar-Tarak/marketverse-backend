import { describe, expect, it } from 'vitest';
import { buildRoutes, type CityPoint } from './transport-routes.functions.js';

const rules = {
  transitKmPerTick: 400,
  costPerUnitKmMinor: 0.05,
  capacityPerTick: 1_000_000,
};

// Novara city positions (prisma/SEED_DESIGN.md §3).
const cities: CityPoint[] = [
  { id: 'GREENFORD', x: 100, y: 400 },
  { id: 'MILLHAVEN', x: 180, y: 430 },
  { id: 'EASTPORT', x: 520, y: 300 },
  { id: 'IRONHAVEN', x: 470, y: 360 },
  { id: 'WESTBRIDGE', x: 100, y: 120 },
  { id: 'FAIRVIEW', x: 150, y: 80 },
  { id: 'SOUTHBAY', x: 300, y: 20 },
  { id: 'PORT_AZURE', x: 350, y: 40 },
  { id: 'CENTRALIA', x: 300, y: 220 },
];

const route = (from: string, to: string) =>
  buildRoutes(cities, rules).find(
    (r) => r.fromCityId === from && r.toCityId === to,
  );

describe('buildRoutes', () => {
  it('creates one directed route per ordered pair: 9 × 8 = 72', () => {
    expect(buildRoutes(cities, rules)).toHaveLength(72);
  });

  it('Greenford → Millhaven: 85.44 km, 1 tick, cost 5 (4.272 rounded up)', () => {
    expect(route('GREENFORD', 'MILLHAVEN')).toMatchObject({
      distanceKm: '85.44',
      transitTicks: 1,
      costPerUnitMinor: 5n,
    });
  });

  it('Greenford → Port Azure: 438.29 km, 2 ticks, cost 22 (21.9145 rounded up)', () => {
    expect(route('GREENFORD', 'PORT_AZURE')).toMatchObject({
      distanceKm: '438.29',
      transitTicks: 2,
      costPerUnitMinor: 22n,
    });
  });

  it('Centralia → Southbay: exactly 200 km, 1 tick, cost 10', () => {
    expect(route('CENTRALIA', 'SOUTHBAY')).toMatchObject({
      distanceKm: '200.00',
      transitTicks: 1,
      costPerUnitMinor: 10n,
    });
  });

  it('is symmetric: A → B and B → A cost the same', () => {
    expect(route('EASTPORT', 'WESTBRIDGE')).toMatchObject({
      costPerUnitMinor: route('WESTBRIDGE', 'EASTPORT')?.costPerUnitMinor,
      transitTicks: route('WESTBRIDGE', 'EASTPORT')?.transitTicks,
    });
  });
});
