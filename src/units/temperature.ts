import { roundToStep } from './fractions.ts';

export type TemperatureContext = 'oven' | 'other';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/** Oven dials in the US step in 25 °F; other temperatures round to 5 °F. */
export function convertCelsius(celsius: number, context: TemperatureContext): number {
  return roundToStep(celsiusToFahrenheit(celsius), context === 'oven' ? 25 : 5);
}

const GAS_MARK_FAHRENHEIT: Readonly<Record<number, number>> = {
  0.25: 225,
  0.5: 250,
  1: 275,
  2: 300,
  3: 325,
  4: 350,
  5: 375,
  6: 400,
  7: 425,
  8: 450,
  9: 475,
};

export function gasMarkToFahrenheit(mark: number): number {
  const fahrenheit = GAS_MARK_FAHRENHEIT[mark];
  if (fahrenheit === undefined) throw new RangeError(`Unknown gas mark: ${mark}`);
  return fahrenheit;
}
