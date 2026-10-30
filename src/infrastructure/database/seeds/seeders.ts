import { aiStrategiesSeeder } from './ai-strategies.seeder.js';
import { catalogSeeder } from './catalog.seeder.js';
import { productsSeeder } from './products.seeder.js';
import { recipesSeeder } from './recipes.seeder.js';
import { scenarioNovaraSeeder } from './scenario-novara.seeder.js';
import type { Seeder } from './seeder.js';
import { unitsSeeder } from './units.seeder.js';

/**
 * Add new seeders here, in dependency order (parents before children).
 * See prisma/SEED_DESIGN.md §7 for the planned order.
 */
export const seeders: readonly Seeder[] = [
  unitsSeeder,
  catalogSeeder,
  productsSeeder,
  recipesSeeder,
  aiStrategiesSeeder,
  scenarioNovaraSeeder,
];
