import { GRAMS_PER_LB, GRAMS_PER_OZ } from './constants.ts';
import { roundToStep } from './fractions.ts';

export type MassUnit = 'oz' | 'lb';

/** From roughly one pound up, recipes read better in pounds. */
const LB_THRESHOLD_GRAMS = 450;

export function massUnitFor(grams: number): MassUnit {
  return grams >= LB_THRESHOLD_GRAMS ? 'lb' : 'oz';
}

/** Converts grams into the given unit with kitchen rounding. */
export function quantizeMass(grams: number, unit: MassUnit): number {
  if (unit === 'lb') return Math.max(0.25, roundToStep(grams / GRAMS_PER_LB, 0.25));
  const ounces = grams / GRAMS_PER_OZ;
  return Math.max(0.25, roundToStep(ounces, ounces < 2 ? 0.25 : 0.5));
}

export function gramsToUS(grams: number): { quantity: number; unit: MassUnit } {
  const unit = massUnitFor(grams);
  return { quantity: quantizeMass(grams, unit), unit };
}
