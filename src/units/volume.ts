import { ML_PER_CUP, ML_PER_FL_OZ, ML_PER_TBSP, ML_PER_TSP } from './constants.ts';
import { roundToCupFraction, roundToStep } from './fractions.ts';

export type VolumeUnit = 'tsp' | 'tbsp' | 'cup' | 'fl oz';

/** Below 1 tbsp use teaspoons, below 1/4 cup use tablespoons, otherwise cups. */
export function volumeUnitFor(ml: number): Exclude<VolumeUnit, 'fl oz'> {
  if (ml < ML_PER_TBSP - 0.5) return 'tsp';
  if (ml < ML_PER_CUP / 4 - 1) return 'tbsp';
  return 'cup';
}

export function quantizeVolume(ml: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'tsp':
      return Math.max(0.25, roundToStep(ml / ML_PER_TSP, 0.25));
    case 'tbsp':
      return Math.max(0.5, roundToStep(ml / ML_PER_TBSP, 0.5));
    case 'cup':
      return Math.max(0.25, roundToCupFraction(ml / ML_PER_CUP));
    case 'fl oz':
      return Math.max(0.5, roundToStep(ml / ML_PER_FL_OZ, 0.5));
  }
}

export function mlToUS(ml: number): { quantity: number; unit: VolumeUnit } {
  const unit = volumeUnitFor(ml);
  return { quantity: quantizeVolume(ml, unit), unit };
}

/** Package sizes (cans, bottles) are labelled in fluid ounces in the US. */
export function mlToFlOz(ml: number): number {
  return quantizeVolume(ml, 'fl oz');
}
