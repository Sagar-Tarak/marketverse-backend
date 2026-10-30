import { Module } from '@nestjs/common';
import { WorldsModule } from '../worlds/worlds.module.js';
import { PopulationController } from './population.controller.js';
import { PopulationService } from './population.service.js';

@Module({
  imports: [WorldsModule],
  controllers: [PopulationController],
  providers: [PopulationService],
  exports: [PopulationService],
})
export class PopulationModule {}
