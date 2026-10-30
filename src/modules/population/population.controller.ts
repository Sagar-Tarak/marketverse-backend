import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import { PopulationService } from './population.service.js';
import type {
  LaborPoolView,
  PopulationView,
} from './schemas/population.schema.js';

@ApiTags('population')
@Controller('worlds/:worldId')
export class PopulationController {
  constructor(private readonly population: PopulationService) {}

  @Get('population')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
  ): Promise<PopulationView> {
    return this.population.getPopulation(worldId, user.id);
  }

  @Get('labor')
  labor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId', ParseUUIDPipe) worldId: string,
  ): Promise<LaborPoolView[]> {
    return this.population.getLabor(worldId, user.id);
  }
}
