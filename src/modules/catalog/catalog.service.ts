import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, UnitOfMeasure } from '@prisma/client';
import {
  skipTake,
  toPage,
  type Page,
  type PageRequest,
} from '../../common/pagination/pagination.js';
import { throwAppError } from '../../common/utils/app-error.util.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type {
  ProductView,
  RecipeView,
  UnitView,
} from './schemas/catalog.schema.js';

const productInclude = {
  category: true,
  unit: true,
} satisfies Prisma.ProductInclude;

const recipeInclude = {
  facilityType: true,
  industry: true,
  inputs: { include: { product: true }, orderBy: { product: { code: 'asc' } } },
  outputs: {
    include: { product: true },
    orderBy: { product: { code: 'asc' } },
  },
} satisfies Prisma.ProductionRecipeInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type RecipeRow = Prisma.ProductionRecipeGetPayload<{
  include: typeof recipeInclude;
}>;

const toUnitView = (row: UnitOfMeasure): UnitView => ({
  code: row.code,
  name: row.name,
  dimension: row.dimension,
});

const toProductView = (row: ProductRow): ProductView => ({
  code: row.code,
  name: row.name,
  category: row.category.code,
  unit: row.unit.code,
  productType: row.productType,
  referencePriceMinor: row.referencePriceMinor.toString(),
  shelfLifeTicks: row.shelfLifeTicks,
  transportFactor: row.transportFactor.toString(),
  isTradable: row.isTradable,
});

const toRecipeView = (row: RecipeRow): RecipeView => ({
  recipeCode: row.recipeCode,
  version: row.version,
  name: row.name,
  facilityType: row.facilityType?.code ?? null,
  industry: row.industry?.code ?? null,
  batchDurationTicks: row.batchDurationTicks,
  laborPerBatch: row.laborPerBatch.toString(),
  inputs: row.inputs.map((input) => ({
    productCode: input.product.code,
    quantityPerBatch: input.quantityPerBatch.toString(),
  })),
  outputs: row.outputs.map((output) => ({
    productCode: output.product.code,
    quantityPerBatch: output.quantityPerBatch.toString(),
    isByProduct: output.isByProduct,
  })),
});

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listUnits(): Promise<UnitView[]> {
    const rows = await this.prisma.unitOfMeasure.findMany({
      orderBy: { code: 'asc' },
    });
    return rows.map(toUnitView);
  }

  async listProducts(request: PageRequest): Promise<Page<ProductView>> {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.product.findMany({
        include: productInclude,
        orderBy: { code: 'asc' },
        ...skipTake(request),
      }),
    ]);
    return toPage(rows.map(toProductView), total, request);
  }

  async getProduct(code: string): Promise<ProductView> {
    const row = await this.prisma.product.findUnique({
      where: { code },
      include: productInclude,
    });
    if (!row) throwAppError(`Product ${code} not found.`, HttpStatus.NOT_FOUND);
    return toProductView(row);
  }

  async listRecipes(request: PageRequest): Promise<Page<RecipeView>> {
    const where = { status: 'ACTIVE' } as const;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.productionRecipe.count({ where }),
      this.prisma.productionRecipe.findMany({
        where,
        include: recipeInclude,
        orderBy: [{ recipeCode: 'asc' }, { version: 'desc' }],
        ...skipTake(request),
      }),
    ]);
    return toPage(rows.map(toRecipeView), total, request);
  }

  /** Latest ACTIVE version of the recipe. */
  async getRecipe(recipeCode: string): Promise<RecipeView> {
    const row = await this.prisma.productionRecipe.findFirst({
      where: { recipeCode, status: 'ACTIVE' },
      include: recipeInclude,
      orderBy: { version: 'desc' },
    });
    if (!row) {
      throwAppError(`Recipe ${recipeCode} not found.`, HttpStatus.NOT_FOUND);
    }
    return toRecipeView(row);
  }
}
