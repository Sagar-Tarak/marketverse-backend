import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import type { Page } from '../../common/pagination/pagination.js';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import type { ClockView, WorldView } from './schemas/worlds.schema.js';
import { WorldsService } from './worlds.service.js';

@ApiTags('worlds')
@Controller('worlds')
export class WorldsController {
  constructor(private readonly worlds: WorldsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<WorldView>> {
    return this.worlds.listForUser(user.id, query);
  }

  @Get(':worldId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
  ): Promise<WorldView> {
    return this.worlds.getForUser(worldId, user.id);
  }

  @Get(':worldId/clock')
  clock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
  ): Promise<ClockView> {
    return this.worlds.getClock(worldId, user.id);
  }
}
