import { CM_PER_INCH } from './constants.ts';
import { roundToStep } from './fractions.ts';

/** Tins and pans are sold in whole inches; other sizes round to 1/4 inch. */
export type LengthContext = 'tin' | 'size';

export function cmToInches(cm: number, context: LengthContext): number {
  const inches = cm / CM_PER_INCH;
  return context === 'tin' ? Math.round(inches) : Math.max(0.25, roundToStep(inches, 0.25));
}
