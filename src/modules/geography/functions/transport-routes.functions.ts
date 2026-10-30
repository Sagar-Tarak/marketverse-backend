import { formatMinor, mulMinor } from '../../../common/utils/money.util.js';

export interface CityPoint {
  readonly id: string;
  /** Position in km. */
  readonly x: number;
  readonly y: number;
}

export interface RouteRules {
  readonly transitKmPerTick: number;
  /** Minor units per unit per km. */
  readonly costPerUnitKmMinor: number;
  readonly capacityPerTick: number;
}

export interface RouteRow {
  readonly fromCityId: string;
  readonly toCityId: string;
  /** Decimal string with 2 places. */
  readonly distanceKm: string;
  readonly transitTicks: number;
  /** Per unit, before the product's transport factor. */
  readonly costPerUnitMinor: bigint;
  readonly capacityPerTick: string;
}

/**
 * One directed route for every ordered pair of cities.
 * distance = straight line, rounded to 0.01 km; ticks = ceil(distance / transitKmPerTick), at least 1;
 * cost = ceil(distance × costPerUnitKmMinor).
 * Distance is held in hundredths of a km (an integer) so the rounding is exact and deterministic.
 */
export function buildRoutes(
  cities: readonly CityPoint[],
  rules: RouteRules,
): RouteRow[] {
  const costPerCentiKm = (rules.costPerUnitKmMinor / 100).toFixed(6);

  return cities.flatMap((from) =>
    cities
      .filter((to) => to.id !== from.id)
      .map((to) => {
        const centiKm = Math.round(
          Math.hypot(to.x - from.x, to.y - from.y) * 100,
        );
        return {
          fromCityId: from.id,
          toCityId: to.id,
          distanceKm: formatMinor(BigInt(centiKm), 2),
          transitTicks: Math.max(
            1,
            Math.ceil(centiKm / (rules.transitKmPerTick * 100)),
          ),
          costPerUnitMinor: mulMinor(BigInt(centiKm), costPerCentiKm, 'CEIL'),
          capacityPerTick: rules.capacityPerTick.toString(),
        };
      }),
  );
}
