import { mulMinor } from '../../../common/utils/money.util.js';

/**
 * Splits `total` into whole parts proportional to `weights`. The parts always add up to `total`
 * (largest remainder, ties to the earlier weight), so no household is lost to rounding.
 */
export function splitByShares(
  total: number,
  weights: readonly number[],
): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) throw new Error('Weights must add up to more than zero.');

  const exact = weights.map((weight) => (total * weight) / sum);
  const parts = exact.map(Math.floor);
  let remaining = total - parts.reduce((a, b) => a + b, 0);

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of byFraction) {
    if (remaining <= 0) break;
    parts[index] = (parts[index] ?? 0) + 1;
    remaining -= 1;
  }
  return parts;
}

export interface CohortInput {
  readonly id: string;
  readonly householdShare: number;
  readonly dailyIncomeMinor: number;
}

export interface CohortRow {
  readonly cohortDefinitionId: string;
  readonly householdCount: number;
  readonly employedWorkforce: number;
  readonly unemployedWorkforce: number;
  /** Household income per day, summed over the cohort (minor units). */
  readonly disposableIncomeMinor: bigint;
}

/**
 * One city's households split across the income cohorts. Workforce = one earner per household;
 * the city's employed total is rounded once, then shared out in proportion to household counts.
 */
export function buildCityCohorts(
  households: number,
  cohorts: readonly CohortInput[],
  employmentRate: number,
): CohortRow[] {
  const counts = splitByShares(
    households,
    cohorts.map((cohort) => cohort.householdShare),
  );
  const employed = splitByShares(
    Math.round(households * employmentRate),
    counts,
  );

  return cohorts.map((cohort, index) => {
    const householdCount = counts[index] ?? 0;
    const employedWorkforce = Math.min(employed[index] ?? 0, householdCount);
    return {
      cohortDefinitionId: cohort.id,
      householdCount,
      employedWorkforce,
      unemployedWorkforce: householdCount - employedWorkforce,
      disposableIncomeMinor:
        BigInt(householdCount) * BigInt(cohort.dailyIncomeMinor),
    };
  });
}

export interface SkillGroupInput {
  readonly id: string;
  readonly workforceShare: number;
  /** Decimal string, e.g. '1.4'. */
  readonly wageMultiplier: string;
}

export interface LaborPoolRow {
  readonly skillGroupId: string;
  readonly workforce: number;
  readonly employed: number;
  readonly wageRateMinor: bigint;
}

/** A region's workforce split across skill groups, each paid the reference wage × its multiplier. */
export function buildRegionLaborPools(
  regionWorkforce: number,
  skillGroups: readonly SkillGroupInput[],
  employmentRate: number,
  referenceWageMinorPerHour: number,
): LaborPoolRow[] {
  const shares = skillGroups.map((group) => group.workforceShare);
  const workforce = splitByShares(regionWorkforce, shares);
  const employed = splitByShares(
    Math.round(regionWorkforce * employmentRate),
    shares,
  );

  return skillGroups.map((group, index) => {
    const poolWorkforce = workforce[index] ?? 0;
    return {
      skillGroupId: group.id,
      workforce: poolWorkforce,
      employed: Math.min(employed[index] ?? 0, poolWorkforce),
      wageRateMinor: mulMinor(
        BigInt(referenceWageMinorPerHour),
        group.wageMultiplier,
        'HALF_UP',
      ),
    };
  });
}
