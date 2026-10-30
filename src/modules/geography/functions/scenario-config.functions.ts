import type { Prisma } from '@prisma/client';

/** The typed shape of `scenario_templates.config` (seeded by scenario-novara.seeder.ts). */
export interface ScenarioConfig {
  readonly referenceWageMinorPerHour: number;
  readonly employmentRate: number;
  readonly routes: {
    readonly transitKmPerTick: number;
    readonly costPerUnitKmMinor: number;
    readonly capacityPerTick: number;
  };
  readonly cities: Readonly<
    Record<
      string,
      { readonly x: number; readonly y: number; readonly households: number }
    >
  >;
  readonly cohorts: Readonly<
    Record<
      string,
      {
        readonly householdShare: number;
        readonly dailyIncomeMinor: number;
      }
    >
  >;
  readonly skillGroups: Readonly<
    Record<
      string,
      { readonly workforceShare: number; readonly wageMultiplier: string }
    >
  >;
}

type JsonRecord = Record<string, Prisma.JsonValue>;

function record(value: Prisma.JsonValue | undefined, path: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Scenario config: ${path} must be an object.`);
  }
  return value as JsonRecord;
}

function numberAt(obj: JsonRecord, key: string, path: string): number {
  const value = obj[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Scenario config: ${path}.${key} must be a number.`);
  }
  return value;
}

function mapOf<T>(
  obj: JsonRecord,
  key: string,
  path: string,
  read: (entry: JsonRecord, entryPath: string) => T,
): Record<string, T> {
  const section = record(obj[key], `${path}${key}`);
  return Object.fromEntries(
    Object.entries(section).map(([name, entry]) => {
      const entryPath = `${path}${key}.${name}`;
      return [name, read(record(entry, entryPath), entryPath)];
    }),
  );
}

/** Fails loudly on a malformed config: a bad scenario must not create a half-built world. */
export function parseScenarioConfig(json: Prisma.JsonValue): ScenarioConfig {
  const root = record(json, 'config');
  const routes = record(root.routes, 'routes');

  return {
    referenceWageMinorPerHour: numberAt(root, 'referenceWageMinorPerHour', ''),
    employmentRate: numberAt(root, 'employmentRate', ''),
    routes: {
      transitKmPerTick: numberAt(routes, 'transitKmPerTick', 'routes'),
      costPerUnitKmMinor: numberAt(routes, 'costPerUnitKmMinor', 'routes'),
      capacityPerTick: numberAt(routes, 'capacityPerTick', 'routes'),
    },
    cities: mapOf(root, 'cities', '', (city, path) => ({
      x: numberAt(city, 'x', path),
      y: numberAt(city, 'y', path),
      households: numberAt(city, 'households', path),
    })),
    cohorts: mapOf(root, 'cohorts', '', (cohort, path) => ({
      householdShare: numberAt(cohort, 'householdShare', path),
      dailyIncomeMinor: numberAt(cohort, 'dailyIncomeMinor', path),
    })),
    skillGroups: mapOf(root, 'skillGroups', '', (group, path) => {
      const multiplier = group.wageMultiplier;
      if (typeof multiplier !== 'string') {
        throw new Error(
          `Scenario config: ${path}.wageMultiplier must be a decimal string.`,
        );
      }
      return {
        workforceShare: numberAt(group, 'workforceShare', path),
        wageMultiplier: multiplier,
      };
    }),
  };
}
