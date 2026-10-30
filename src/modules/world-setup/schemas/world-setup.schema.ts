import { Difficulty } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { WorldView } from '../../worlds/schemas/worlds.schema.js';

export class CreateWorldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  /** Defaults to the Novara prototype. */
  @IsOptional()
  @IsString()
  scenarioCode?: string;

  /** Defaults to the latest published version. */
  @IsOptional()
  @IsInt()
  @Min(1)
  scenarioVersion?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  /** Minor units as digits, e.g. "10000000" = 100 000.00. */
  @IsOptional()
  @Matches(/^\d{1,15}$/, {
    message: 'startingCapitalMinor must be whole minor units',
  })
  startingCapitalMinor?: string;
}

export interface WorldSetupView {
  readonly world: WorldView;
  readonly summary: {
    readonly regions: number;
    readonly cities: number;
    readonly routes: number;
    readonly cohorts: number;
    readonly laborPools: number;
  };
}
