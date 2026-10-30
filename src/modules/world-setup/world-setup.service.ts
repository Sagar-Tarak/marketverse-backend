import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { GeographyService } from '../geography/geography.service.js';
import { PopulationService } from '../population/population.service.js';
import { WorldsService } from '../worlds/worlds.service.js';
import type {
  CreateWorldDto,
  WorldSetupView,
} from './schemas/world-setup.schema.js';

const DEFAULT_SCENARIO = 'NOVARA_PROTOTYPE';
/** 100 000.00 in minor units. */
const DEFAULT_STARTING_CAPITAL_MINOR = 10_000_000n;
const MODEL_VERSION = 'v0.1';
const TRANSACTION_TIMEOUT_MS = 30_000;

/**
 * Builds a new world from a scenario, in one transaction so a failure leaves nothing behind
 * (docs/02 §12). Phase 1 covers world, clock, map and people; companies, stock and the opening
 * ledger join here as their modules arrive, and only then does the world become ACTIVE.
 */
@Injectable()
export class WorldSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worlds: WorldsService,
    private readonly geography: GeographyService,
    private readonly population: PopulationService,
  ) {}

  async createWorld(
    user: AuthenticatedUser,
    dto: CreateWorldDto,
  ): Promise<WorldSetupView> {
    const scenario = await this.geography.findScenario(
      dto.scenarioCode ?? DEFAULT_SCENARIO,
      dto.scenarioVersion,
    );

    return this.prisma.$transaction(
      async (tx) => {
        const world = await this.worlds.create(tx, {
          ownerUserId: user.id,
          name: dto.name,
          scenarioCode: scenario.code,
          scenarioVersion: scenario.version,
          currencyCode: scenario.currencyCode,
          difficulty: dto.difficulty ?? 'NORMAL',
          startingCapitalMinor: dto.startingCapitalMinor
            ? BigInt(dto.startingCapitalMinor)
            : DEFAULT_STARTING_CAPITAL_MINOR,
          startDate: scenario.startDate,
          modelVersion: MODEL_VERSION,
        });

        const map = await this.geography.instantiate(tx, world.id, scenario);
        const people = await this.population.instantiate(
          tx,
          world.id,
          scenario,
          map.cities,
        );

        return {
          world,
          summary: {
            regions: map.regions.length,
            cities: map.cities.length,
            routes: map.routeCount,
            cohorts: people.cohorts,
            laborPools: people.laborPools,
          },
        };
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }
}
