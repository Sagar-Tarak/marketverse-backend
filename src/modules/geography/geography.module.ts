import { Module } from '@nestjs/common';
import { WorldsModule } from '../worlds/worlds.module.js';
import { GeographyController } from './geography.controller.js';
import { GeographyService } from './geography.service.js';

@Module({
  imports: [WorldsModule],
  controllers: [GeographyController],
  providers: [GeographyService],
  exports: [GeographyService],
})
export class GeographyModule {}
