import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit, convertCelsius, gasMarkToFahrenheit } from './temperature.ts';

describe('convertCelsius', () => {
  it('converts oven temperatures to the nearest 25 °F', () => {
    expect(convertCelsius(180, 'oven')).toBe(350);
    expect(convertCelsius(200, 'oven')).toBe(400);
    expect(convertCelsius(220, 'oven')).toBe(425);
    expect(convertCelsius(160, 'oven')).toBe(325);
    expect(convertCelsius(190, 'oven')).toBe(375);
  });

  it('rounds non-oven temperatures to the nearest 5 °F', () => {
    expect(convertCelsius(180, 'other')).toBe(355);
    expect(convertCelsius(118, 'other')).toBe(245);
  });

  it('keeps the exact formula available', () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });
});

describe('gasMarkToFahrenheit', () => {
  it('maps gas marks to Fahrenheit', () => {
    expect(gasMarkToFahrenheit(4)).toBe(350);
    expect(gasMarkToFahrenheit(6)).toBe(400);
  });

  it('rejects unknown marks', () => {
    expect(() => gasMarkToFahrenheit(11)).toThrow(RangeError);
  });
});
