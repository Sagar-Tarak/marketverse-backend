import { describe, expect, it } from 'vitest';
import { formatMinor, mulMinor, parseMinor } from './money.util.js';

describe('parseMinor / formatMinor', () => {
  it('converts between decimal strings and minor units', () => {
    expect(parseMinor('12.34', 2)).toBe(1234n);
    expect(parseMinor('12', 2)).toBe(1200n);
    expect(parseMinor('-0.05', 2)).toBe(-5n);
    expect(formatMinor(5n, 2)).toBe('0.05');
    expect(formatMinor(-1234n, 2)).toBe('-12.34');
    expect(formatMinor(100n, 0)).toBe('100');
  });

  it('rejects more decimals than the currency has instead of rounding silently', () => {
    expect(() => parseMinor('12.345', 2)).toThrow('decimal places');
    expect(() => parseMinor('12,34', 2)).toThrow('Not a money amount');
  });

  it('round-trips a value beyond Number.MAX_SAFE_INTEGER', () => {
    const minor = 9_007_199_254_740_993n;
    expect(parseMinor(formatMinor(minor, 2), 2)).toBe(minor);
  });
});

describe('mulMinor', () => {
  it('prices a 1000 kg wheat shipment: 22 per unit-km × 0.05 × 1000 = 1100', () => {
    expect(mulMinor(22n * 1000n, '0.05', 'CEIL')).toBe(1100n);
  });

  it('takes 10% sales tax from the 1960 bakery margin', () => {
    expect(mulMinor(1960n, '0.1', 'HALF_UP')).toBe(196n);
  });

  it('rounds 2.5 by mode', () => {
    expect(mulMinor(5n, '0.5', 'HALF_UP')).toBe(3n);
    expect(mulMinor(5n, '0.5', 'CEIL')).toBe(3n);
    expect(mulMinor(5n, '0.5', 'FLOOR')).toBe(2n);
  });

  it('rounds negatives symmetrically (credits mirror debits)', () => {
    expect(mulMinor(-5n, '0.5', 'HALF_UP')).toBe(-3n);
    expect(mulMinor(-5n, '0.5', 'CEIL')).toBe(-2n);
    expect(mulMinor(-5n, '0.5', 'FLOOR')).toBe(-3n);
  });

  it('leaves exact results alone in every mode', () => {
    for (const mode of ['HALF_UP', 'CEIL', 'FLOOR'] as const) {
      expect(mulMinor(200n, '0.25', mode)).toBe(50n);
    }
  });

  it('rejects a non-decimal factor', () => {
    expect(() => mulMinor(1n, '1e3', 'HALF_UP')).toThrow('Not a decimal');
  });
});
