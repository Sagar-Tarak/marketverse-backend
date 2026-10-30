/**
 * Money is a `bigint` count of minor units (cents). Never a float.
 * Amounts and factors travel as decimal strings ("12.34", "0.05") so nothing is lost in JSON.
 *
 * Rounding happens once, in `mulMinor`, with an explicit mode. House rules (docs/05 §6):
 *  - taxes, interest, prices     → HALF_UP
 *  - shipping cost per line      → CEIL (never under-charge)
 *  - inventory quantities        → not money, use Decimal
 */
export type RoundingMode = 'HALF_UP' | 'CEIL' | 'FLOOR';

const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;

function parseDecimal(value: string): {
  numerator: bigint;
  denominator: bigint;
} {
  const match = DECIMAL.exec(value);
  if (!match) throw new Error(`Not a decimal number: "${value}"`);
  const [, sign = '', whole = '0', fraction = ''] = match;
  return {
    numerator: BigInt(`${sign}${whole}${fraction}`),
    denominator: 10n ** BigInt(fraction.length),
  };
}

/** "12.34" with 2 minor units → 1234n. Throws on more decimals than the currency has. */
export function parseMinor(amount: string, minorUnits: number): bigint {
  const match = DECIMAL.exec(amount);
  if (!match) throw new Error(`Not a money amount: "${amount}"`);
  const [, sign = '', whole = '0', fraction = ''] = match;
  if (fraction.length > minorUnits) {
    throw new Error(`"${amount}" has more than ${minorUnits} decimal places.`);
  }
  return BigInt(`${sign}${whole}${fraction.padEnd(minorUnits, '0')}`);
}

/** 1234n with 2 minor units → "12.34". */
export function formatMinor(minor: bigint, minorUnits: number): string {
  const sign = minor < 0n ? '-' : '';
  const digits = (minor < 0n ? -minor : minor)
    .toString()
    .padStart(minorUnits + 1, '0');
  if (minorUnits === 0) return `${sign}${digits}`;
  const split = digits.length - minorUnits;
  return `${sign}${digits.slice(0, split)}.${digits.slice(split)}`;
}

function divideRounded(
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode,
): bigint {
  const quotient = numerator / denominator; // truncates toward zero
  const remainder = numerator % denominator;
  if (remainder === 0n) return quotient;

  const negative = numerator < 0n;
  const absRemainder = negative ? -remainder : remainder;
  const roundAwayFromZero =
    mode === 'HALF_UP'
      ? absRemainder * 2n >= denominator
      : mode === 'CEIL'
        ? !negative
        : negative; // FLOOR
  return roundAwayFromZero ? quotient + (negative ? -1n : 1n) : quotient;
}

/** `minor × factor` rounded once. mulMinor(22_000n, '0.05', 'CEIL') → 1100n. */
export function mulMinor(
  minor: bigint,
  factor: string,
  mode: RoundingMode,
): bigint {
  const { numerator, denominator } = parseDecimal(factor);
  return divideRounded(minor * numerator, denominator, mode);
}
