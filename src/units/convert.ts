import { ML_PER_CUP, ML_PER_TBSP } from './constants.ts';
import { lookupDensity } from './density.ts';
import { formatQuantity, roundToStep } from './fractions.ts';
import { cmToInches, type LengthContext } from './length.ts';
import { massUnitFor, quantizeMass } from './mass.ts';
import { convertCelsius, gasMarkToFahrenheit, type TemperatureContext } from './temperature.ts';
import { quantizeVolume, volumeUnitFor } from './volume.ts';
import type { Quantity, USUnit } from '../schema.ts';

/** A parsed metric measurement. `value` may be a range. */
export type MetricMeasure =
  | { kind: 'mass'; grams: Quantity; packaged?: boolean }
  | { kind: 'volume'; ml: Quantity; packaged?: boolean }
  | { kind: 'temperature'; celsius: number; context: TemperatureContext }
  | { kind: 'gas-mark'; mark: number }
  | { kind: 'length'; cm: number; context: LengthContext }
  | { kind: 'count'; count: Quantity }
  | { kind: 'pinch'; count: number };

export interface USMeasure {
  quantity: Quantity;
  unit: USUnit;
  note?: string;
}

/** Applies `fn` to a scalar or to both ends of a range. */
function mapQuantity(value: Quantity, fn: (n: number) => number): Quantity {
  return typeof value === 'number' ? fn(value) : { min: fn(value.min), max: fn(value.max) };
}

/** The unit is picked from the larger end, so a range never mixes units. */
function upper(value: Quantity): number {
  return typeof value === 'number' ? value : value.max;
}

function convertVolumeMl(ml: Quantity): USMeasure {
  const unit = volumeUnitFor(upper(ml));
  return { quantity: mapQuantity(ml, (n) => quantizeVolume(n, unit)), unit };
}

function convertButter(grams: Quantity, gramsPerCup: number): USMeasure {
  const gramsPerTbsp = gramsPerCup / (ML_PER_CUP / ML_PER_TBSP);
  const quantity = mapQuantity(grams, (g) => Math.max(0.5, roundToStep(g / gramsPerTbsp, 0.5)));
  const sticks = roundToStep(upper(quantity) / 8, 0.25);
  const measure: USMeasure = { quantity, unit: 'tbsp' };
  if (sticks >= 0.5) measure.note = `about ${formatQuantity(sticks)} ${sticks <= 1 ? 'stick' : 'sticks'}`;
  return measure;
}

function convertMass(grams: Quantity, ingredient: string, packaged: boolean): USMeasure {
  const density = packaged ? undefined : lookupDensity(ingredient);
  if (density?.measuredIn === 'tbsp') return convertButter(grams, density.gramsPerCup);
  if (density) {
    const ml = mapQuantity(grams, (g) => (g / density.gramsPerCup) * ML_PER_CUP);
    return convertVolumeMl(ml);
  }
  const unit = packaged ? 'oz' : massUnitFor(upper(grams));
  return { quantity: mapQuantity(grams, (g) => quantizeMass(g, unit)), unit };
}

/**
 * Reference conversion policy. The eval's expected values are produced by
 * this function, and the tool-using agents call the same code.
 */
export function convertMeasure(measure: MetricMeasure, ingredient = ''): USMeasure {
  switch (measure.kind) {
    case 'mass':
      return convertMass(measure.grams, ingredient, measure.packaged ?? false);
    case 'volume':
      return measure.packaged
        ? { quantity: mapQuantity(measure.ml, (n) => quantizeVolume(n, 'fl oz')), unit: 'fl oz' }
        : convertVolumeMl(measure.ml);
    case 'temperature':
      return { quantity: convertCelsius(measure.celsius, measure.context), unit: '°F' };
    case 'gas-mark':
      return { quantity: gasMarkToFahrenheit(measure.mark), unit: '°F' };
    case 'length':
      return { quantity: cmToInches(measure.cm, measure.context), unit: 'inch' };
    case 'count':
      return { quantity: measure.count, unit: 'count' };
    case 'pinch':
      return { quantity: measure.count, unit: 'pinch' };
  }
}
