import { describe, expect, it } from 'vitest';
import { convertMeasure } from './convert.ts';

describe('convertMeasure', () => {
  it('converts 800 g potatoes to 1 3/4 lb', () => {
    expect(convertMeasure({ kind: 'mass', grams: 800 }, 'potatoes')).toEqual({ quantity: 1.75, unit: 'lb' });
  });

  it('converts flour by weight to cups via density', () => {
    expect(convertMeasure({ kind: 'mass', grams: 250 }, 'plain flour')).toEqual({ quantity: 2, unit: 'cup' });
  });

  it('converts a small sugar weight to tablespoons', () => {
    expect(convertMeasure({ kind: 'mass', grams: 25 }, 'caster sugar')).toEqual({ quantity: 2, unit: 'tbsp' });
  });

  it('converts butter to tablespoons with a stick note', () => {
    expect(convertMeasure({ kind: 'mass', grams: 113 }, 'butter')).toEqual({
      quantity: 8,
      unit: 'tbsp',
      note: 'about 1 stick',
    });
  });

  it('converts a range without mixing units', () => {
    const result = convertMeasure({ kind: 'mass', grams: { min: 600, max: 700 } }, 'potatoes');
    expect(result).toEqual({ quantity: { min: 1.25, max: 1.5 }, unit: 'lb' });
  });

  it('keeps tinned goods in ounces', () => {
    expect(convertMeasure({ kind: 'mass', grams: 400, packaged: true }, 'chopped tomatoes')).toEqual({
      quantity: 14,
      unit: 'oz',
    });
  });

  it('converts ml of honey by volume, not by weight', () => {
    expect(convertMeasure({ kind: 'volume', ml: 30 }, 'honey')).toEqual({ quantity: 2, unit: 'tbsp' });
  });

  it('converts oven temperature, gas mark and tin size', () => {
    expect(convertMeasure({ kind: 'temperature', celsius: 180, context: 'oven' })).toEqual({ quantity: 350, unit: '°F' });
    expect(convertMeasure({ kind: 'gas-mark', mark: 6 })).toEqual({ quantity: 400, unit: '°F' });
    expect(convertMeasure({ kind: 'length', cm: 23, context: 'tin' })).toEqual({ quantity: 9, unit: 'inch' });
  });

  it('leaves counts alone', () => {
    expect(convertMeasure({ kind: 'count', count: 2 }, 'large eggs')).toEqual({ quantity: 2, unit: 'count' });
  });
});
