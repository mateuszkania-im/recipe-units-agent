import { describe, expect, it } from 'vitest';
import { formatQuantity, roundToCupFraction, roundToStep } from './fractions.ts';

describe('roundToStep', () => {
  it('rounds to quarters', () => {
    expect(roundToStep(1.764, 0.25)).toBe(1.75);
    expect(roundToStep(1.1, 0.25)).toBe(1);
  });

  it('rejects a non-positive step', () => {
    expect(() => roundToStep(1, 0)).toThrow(RangeError);
  });
});

describe('roundToCupFraction', () => {
  it('snaps to quarters and thirds', () => {
    expect(roundToCupFraction(1.6)).toBeCloseTo(5 / 3);
    expect(roundToCupFraction(0.42)).toBe(0.5);
    expect(roundToCupFraction(1.057)).toBe(1);
    expect(roundToCupFraction(0.3)).toBeCloseTo(1 / 3);
  });
});

describe('formatQuantity', () => {
  it('formats mixed numbers', () => {
    expect(formatQuantity(1.75)).toBe('1 3/4');
    expect(formatQuantity(1 / 3)).toBe('1/3');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(5 / 3)).toBe('1 2/3');
  });

  it('falls back to one decimal for odd values', () => {
    expect(formatQuantity(1.42)).toBe('1.4');
  });
});
