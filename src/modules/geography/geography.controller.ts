import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import type { Page } from '../../common/pagination/pagination.js';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import { GeographyService } from './geography.service.js';
import type {
  RouteView,
  ScenarioView,
  WorldMapView,
} from './schemas/geography.schema.js';

@ApiTags('geography')
@Controller()
export class GeographyController {
  constructor(private readonly geography: GeographyService) {}

  @Get('scenarios')
  listScenarios(): Promise<ScenarioView[]> {
    return this.geography.listScenarios();
  }

  @Get('worlds/:worldId/map')
  map(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
  ): Promise<WorldMapView> {
    return this.geography.getMap(worldId, user.id);
  }

  @Get('worlds/:worldId/routes')
  routes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<RouteView>> {
    return this.geography.listRoutes(worldId, user.id, query);
  }
}
