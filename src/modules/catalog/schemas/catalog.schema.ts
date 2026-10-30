// Response shapes of the catalog API. Money and quantities are strings:
// JSON cannot carry BigInt, and numbers would lose precision.

export interface UnitView {
  readonly code: string;
  readonly name: string;
  readonly dimension: string;
}

export interface ProductView {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly productType: string;
  readonly referencePriceMinor: string;
  readonly shelfLifeTicks: number | null;
  readonly transportFactor: string;
  readonly isTradable: boolean;
}

export interface RecipeInputView {
  readonly productCode: string;
  readonly quantityPerBatch: string;
}

export interface RecipeOutputView extends RecipeInputView {
  readonly isByProduct: boolean;
}

export interface RecipeView {
  readonly recipeCode: string;
  readonly version: number;
  readonly name: string;
  readonly facilityType: string | null;
  readonly industry: string | null;
  readonly batchDurationTicks: number;
  readonly laborPerBatch: string;
  readonly inputs: readonly RecipeInputView[];
  readonly outputs: readonly RecipeOutputView[];
}
