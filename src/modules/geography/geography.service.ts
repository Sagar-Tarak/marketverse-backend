import { HttpStatus, Injectable } from '@nestjs/common';
import {
  skipTake,
  toPage,
  type Page,
  type PageRequest,
} from '../../common/pagination/pagination.js';
import { throwAppError } from '../../common/utils/app-error.util.js';
import {
  PrismaService,
  type TransactionClient,
} from '../../infrastructure/database/prisma.service.js';
import { WorldsService } from '../worlds/worlds.service.js';
import { parseScenarioConfig } from './functions/scenario-config.functions.js';
import { buildRoutes } from './functions/transport-routes.functions.js';
import type {
  InstantiatedMap,
  RouteView,
  ScenarioRecord,
  ScenarioView,
  WorldMapView,
} from './schemas/geography.schema.js';

@Injectable()
export class GeographyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worlds: WorldsService,
  ) {}

  async listScenarios(): Promise<ScenarioView[]> {
    const rows = await this.prisma.scenarioTemplate.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
    return rows.map((row) => ({
      code: row.code,
      version: row.version,
      name: row.name,
      description: row.description,
      currencyCode: row.currencyCode,
      startDate: row.startDate.toISOString().slice(0, 10),
    }));
  }

  /** The requested version, or the latest published one. */
  async findScenario(code: string, version?: number): Promise<ScenarioRecord> {
    const row = await this.prisma.scenarioTemplate.findFirst({
      where: {
        code,
        status: 'PUBLISHED',
        ...(version !== undefined && { version }),
      },
      orderBy: { version: 'desc' },
    });
    if (!row) {
      throwAppError(`Scenario ${code} not found.`, HttpStatus.NOT_FOUND);
    }
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      startDate: row.startDate,
      currencyCode: row.currencyCode,
      config: parseScenarioConfig(row.config),
    };
  }

  /**
   * Copies the scenario's regions and cities into the world and links every pair of cities with a
   * directed transport route. Runs inside the caller's transaction.
   */
  async instantiate(
    tx: TransactionClient,
    worldId: string,
    scenario: ScenarioRecord,
  ): Promise<InstantiatedMap> {
    const regionDefinitions = await tx.regionDefinition.findMany({
      where: { scenarioId: scenario.id },
      include: { cities: { orderBy: { code: 'asc' } } },
      orderBy: { code: 'asc' },
    });

    const regions: { id: string; code: string }[] = [];
    const cities: {
      id: string;
      code: string;
      regionId: string;
      x: number;
      y: number;
    }[] = [];

    for (const definition of regionDefinitions) {
      const region = await tx.worldRegion.create({
        data: {
          worldId,
          regionDefinitionId: definition.id,
          code: definition.code,
          name: definition.name,
        },
      });
      regions.push({ id: region.id, code: region.code });

      for (const cityDefinition of definition.cities) {
        const settings = scenario.config.cities[cityDefinition.code];
        if (!settings) {
          throw new Error(
            `Scenario ${scenario.code}: config has no entry for city ${cityDefinition.code}.`,
          );
        }
        const city = await tx.worldCity.create({
          data: {
            worldId,
            regionId: region.id,
            cityDefinitionId: cityDefinition.id,
            code: cityDefinition.code,
            name: cityDefinition.name,
            infrastructureCapacity: cityDefinition.infrastructureCapacity,
          },
        });
        cities.push({
          id: city.id,
          code: city.code,
          regionId: region.id,
          x: settings.x,
          y: settings.y,
        });
      }
    }

    const routes = buildRoutes(cities, scenario.config.routes);
    await tx.transportRoute.createMany({
      data: routes.map((route) => ({ worldId, ...route })),
    });

    return {
      regions,
      cities: cities.map(({ id, code, regionId }) => ({ id, code, regionId })),
      routeCount: routes.length,
    };
  }

  async getMap(worldId: string, userId: string): Promise<WorldMapView> {
    await this.worlds.assertParticipant(worldId, userId);
    const regions = await this.prisma.worldRegion.findMany({
      where: { worldId },
      include: { cities: { orderBy: { code: 'asc' } } },
      orderBy: { code: 'asc' },
    });
    return {
      regions: regions.map((region) => ({
        code: region.code,
        name: region.name,
        cities: region.cities.map((city) => ({
          code: city.code,
          name: city.name,
          infrastructureCapacity: city.infrastructureCapacity,
        })),
      })),
    };
  }

  async listRoutes(
    worldId: string,
    userId: string,
    request: PageRequest,
  ): Promise<Page<RouteView>> {
    await this.worlds.assertParticipant(worldId, userId);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.transportRoute.count({ where: { worldId } }),
      this.prisma.transportRoute.findMany({
        where: { worldId },
        include: { fromCity: true, toCity: true },
        orderBy: [{ fromCity: { code: 'asc' } }, { toCity: { code: 'asc' } }],
        ...skipTake(request),
      }),
    ]);
    return toPage(
      rows.map((row) => ({
        from: row.fromCity.code,
        to: row.toCity.code,
        distanceKm: row.distanceKm.toString(),
        transitTicks: row.transitTicks,
        costPerUnitMinor: row.costPerUnitMinor.toString(),
      })),
      total,
      request,
    );
  }
}
