import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import type { Page } from '../../common/pagination/pagination.js';
import { CatalogService } from './catalog.service.js';
import type {
  ProductView,
  RecipeView,
  UnitView,
} from './schemas/catalog.schema.js';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('units')
  listUnits(): Promise<UnitView[]> {
    return this.catalog.listUnits();
  }

  @Get('products')
  listProducts(@Query() query: PaginationQueryDto): Promise<Page<ProductView>> {
    return this.catalog.listProducts(query);
  }

  @Get('products/:code')
  getProduct(@Param('code') code: string): Promise<ProductView> {
    return this.catalog.getProduct(code);
  }

  @Get('recipes')
  listRecipes(@Query() query: PaginationQueryDto): Promise<Page<RecipeView>> {
    return this.catalog.listRecipes(query);
  }

  @Get('recipes/:code')
  getRecipe(@Param('code') code: string): Promise<RecipeView> {
    return this.catalog.getRecipe(code);
  }
}
