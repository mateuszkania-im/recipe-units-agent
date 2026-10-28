import { describe, expect, it } from 'vitest';
import { gramsToUS, quantizeMass } from './mass.ts';

describe('gramsToUS', () => {
  it('converts 800 g potatoes to 1 3/4 lb', () => {
    expect(gramsToUS(800)).toEqual({ quantity: 1.75, unit: 'lb' });
  });

  it('converts 1 kg to 2 1/4 lb', () => {
    expect(gramsToUS(1000)).toEqual({ quantity: 2.25, unit: 'lb' });
  });

  it('keeps smaller weights in ounces, to the nearest half', () => {
    expect(gramsToUS(200)).toEqual({ quantity: 7, unit: 'oz' });
    expect(gramsToUS(100)).toEqual({ quantity: 3.5, unit: 'oz' });
  });

  it('uses quarter ounces below 2 oz', () => {
    expect(gramsToUS(15)).toEqual({ quantity: 0.5, unit: 'oz' });
  });

  it('never rounds down to zero', () => {
    expect(quantizeMass(2, 'oz')).toBe(0.25);
  });
});
