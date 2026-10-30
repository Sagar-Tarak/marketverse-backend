export interface CohortView {
  readonly city: string;
  readonly cohort: string;
  readonly householdCount: number;
  readonly employedWorkforce: number;
  readonly unemployedWorkforce: number;
  readonly disposableIncomeMinor: string;
}

export interface PopulationView {
  readonly totals: {
    readonly households: number;
    readonly employed: number;
    readonly unemployed: number;
  };
  readonly cohorts: readonly CohortView[];
}

export interface LaborPoolView {
  readonly region: string;
  readonly skillGroup: string;
  readonly workforce: number;
  readonly employed: number;
  readonly wageRateMinor: string;
  readonly productivity: string;
}
