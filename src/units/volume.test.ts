import { describe, expect, it } from 'vitest';
import { mlToFlOz, mlToUS } from './volume.ts';

describe('mlToUS', () => {
  it('converts 250 ml to 1 cup', () => {
    expect(mlToUS(250)).toEqual({ quantity: 1, unit: 'cup' });
  });

  it('converts 100 ml to 1/2 cup', () => {
    expect(mlToUS(100)).toEqual({ quantity: 0.5, unit: 'cup' });
  });

  it('converts 150 ml to 2/3 cup', () => {
    const result = mlToUS(150);
    expect(result.unit).toBe('cup');
    expect(result.quantity).toBeCloseTo(2 / 3);
  });

  it('converts 15 ml to 1 tbsp and 5 ml to 1 tsp', () => {
    expect(mlToUS(15)).toEqual({ quantity: 1, unit: 'tbsp' });
    expect(mlToUS(5)).toEqual({ quantity: 1, unit: 'tsp' });
  });

  it('converts 30 ml to 2 tbsp', () => {
    expect(mlToUS(30)).toEqual({ quantity: 2, unit: 'tbsp' });
  });

  it('converts 1 litre to 4 1/4 cups', () => {
    expect(mlToUS(1000)).toEqual({ quantity: 4.25, unit: 'cup' });
  });
});

describe('mlToFlOz', () => {
  it('converts a 330 ml can to 11 fl oz', () => {
    expect(mlToFlOz(330)).toBe(11);
  });

  it('converts a 400 ml can of coconut milk to 13.5 fl oz', () => {
    expect(mlToFlOz(400)).toBe(13.5);
  });
});
