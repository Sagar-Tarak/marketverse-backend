import { Module } from '@nestjs/common';
import { GeographyModule } from '../geography/geography.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { PopulationModule } from '../population/population.module.js';
import { WorldsModule } from '../worlds/worlds.module.js';
import { WorldSetupController } from './world-setup.controller.js';
import { WorldSetupService } from './world-setup.service.js';

@Module({
  imports: [IdentityModule, WorldsModule, GeographyModule, PopulationModule],
  controllers: [WorldSetupController],
  providers: [WorldSetupService],
})
export class WorldSetupModule {}
