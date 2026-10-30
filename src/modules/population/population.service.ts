import { Injectable } from '@nestjs/common';
import {
  PrismaService,
  type TransactionClient,
} from '../../infrastructure/database/prisma.service.js';
import type {
  InstantiatedMap,
  ScenarioRecord,
} from '../geography/schemas/geography.schema.js';
import { WorldsService } from '../worlds/worlds.service.js';
import {
  buildCityCohorts,
  buildRegionLaborPools,
} from './functions/population.functions.js';
import type {
  LaborPoolView,
  PopulationView,
} from './schemas/population.schema.js';

export interface PopulationSummary {
  readonly cohorts: number;
  readonly laborPools: number;
}

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

@Injectable()
export class PopulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worlds: WorldsService,
  ) {}

  /**
   * Fills each city with income cohorts and each region with labor pools, from the scenario config.
   * Runs inside the caller's transaction, after the cities exist.
   */
  async instantiate(
    tx: TransactionClient,
    worldId: string,
    scenario: ScenarioRecord,
    cities: InstantiatedMap['cities'],
  ): Promise<PopulationSummary> {
    const { config } = scenario;

    const cohortDefinitions = await tx.cohortDefinition.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { code: 'asc' },
    });
    const cohorts = cohortDefinitions.map((definition) => {
      const settings = config.cohorts[definition.code];
      if (!settings) {
        throw new Error(
          `Scenario ${scenario.code}: config has no entry for cohort ${definition.code}.`,
        );
      }
      return { id: definition.id, ...settings };
    });

    const skillGroupRows = await tx.skillGroup.findMany({
      orderBy: { code: 'asc' },
    });
    const skillGroups = Object.entries(config.skillGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, settings]) => {
        const row = skillGroupRows.find((group) => group.code === code);
        if (!row)
          throw new Error(
            `Scenario ${scenario.code}: unknown skill group ${code}.`,
          );
        return { id: row.id, ...settings };
      });

    const cohortRows = [];
    const regionWorkforce = new Map<string, number>();
    for (const city of cities) {
      const settings = config.cities[city.code];
      if (!settings)
        throw new Error(
          `Scenario ${scenario.code}: config has no entry for city ${city.code}.`,
        );

      for (const row of buildCityCohorts(
        settings.households,
        cohorts,
        config.employmentRate,
      )) {
        cohortRows.push({ worldId, cityId: city.id, ...row });
      }
      regionWorkforce.set(
        city.regionId,
        (regionWorkforce.get(city.regionId) ?? 0) + settings.households,
      );
    }
    await tx.populationCohort.createMany({ data: cohortRows });

    const poolRows = [...regionWorkforce].flatMap(([regionId, workforce]) =>
      buildRegionLaborPools(
        workforce,
        skillGroups,
        config.employmentRate,
        config.referenceWageMinorPerHour,
      ).map((pool) => ({ worldId, regionId, ...pool })),
    );
    await tx.laborPool.createMany({ data: poolRows });

    return { cohorts: cohortRows.length, laborPools: poolRows.length };
  }

  async getPopulation(
    worldId: string,
    userId: string,
  ): Promise<PopulationView> {
    await this.worlds.assertParticipant(worldId, userId);
    const rows = await this.prisma.populationCohort.findMany({
      where: { worldId },
      include: { city: true, cohortDefinition: true },
      orderBy: [
        { city: { code: 'asc' } },
        { cohortDefinition: { code: 'asc' } },
      ],
    });

    const households = sum(rows.map((row) => row.householdCount));
    const employed = sum(rows.map((row) => row.employedWorkforce));
    return {
      totals: { households, employed, unemployed: households - employed },
      cohorts: rows.map((row) => ({
        city: row.city.code,
        cohort: row.cohortDefinition.code,
        householdCount: row.householdCount,
        employedWorkforce: row.employedWorkforce,
        unemployedWorkforce: row.unemployedWorkforce,
        disposableIncomeMinor: row.disposableIncomeMinor.toString(),
      })),
    };
  }

  async getLabor(worldId: string, userId: string): Promise<LaborPoolView[]> {
    await this.worlds.assertParticipant(worldId, userId);
    const rows = await this.prisma.laborPool.findMany({
      where: { worldId },
      include: { region: true, skillGroup: true },
      orderBy: [{ region: { code: 'asc' } }, { skillGroup: { code: 'asc' } }],
    });
    return rows.map((row) => ({
      region: row.region.code,
      skillGroup: row.skillGroup.code,
      workforce: row.workforce,
      employed: row.employed,
      wageRateMinor: row.wageRateMinor.toString(),
      productivity: row.productivity.toString(),
    }));
  }
}
