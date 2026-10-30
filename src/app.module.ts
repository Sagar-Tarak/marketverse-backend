import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration.js';
import { validateEnvironment } from './config/environment.validation.js';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { GeographyModule } from './modules/geography/geography.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { PopulationModule } from './modules/population/population.module.js';
import { WorldSetupModule } from './modules/world-setup/world-setup.module.js';
import { WorldsModule } from './modules/worlds/worlds.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    CatalogModule,
    WorldsModule,
    GeographyModule,
    PopulationModule,
    WorldSetupModule,
  ],
})
export class AppModule {}
