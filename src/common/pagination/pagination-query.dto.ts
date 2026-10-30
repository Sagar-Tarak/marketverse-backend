import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import type { PageRequest } from './pagination.js';

export class PaginationQueryDto implements PageRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
