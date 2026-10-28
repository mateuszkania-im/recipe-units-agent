import { describe, expect, it } from 'vitest';
import { cmToInches } from './length.ts';

describe('cmToInches', () => {
  it('converts a 23 cm tin to 9 inches', () => {
    expect(cmToInches(23, 'tin')).toBe(9);
  });

  it('converts a 20 cm tin to 8 inches', () => {
    expect(cmToInches(20, 'tin')).toBe(8);
  });

  it('converts 2.5 cm cubes to 1 inch', () => {
    expect(cmToInches(2.5, 'size')).toBe(1);
  });

  it('converts 2 cm to 3/4 inch', () => {
    expect(cmToInches(2, 'size')).toBe(0.75);
  });
});
