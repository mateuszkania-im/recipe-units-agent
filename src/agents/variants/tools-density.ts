import { CONVERSION_RULES, TARGET_UNIT_POLICY } from '../instructions.ts';
import { densityTools, unitTools } from '../tools.ts';
import type { VariantConfig } from '../types.ts';

/** Adds the density lookup so grams of flour or butter become cups or tbsp. */
export const toolsDensity: VariantConfig = {
  id: 'tools-density',
  description: 'Unit tools plus ingredient density lookup, with the target-unit policy',
  instructions: `${CONVERSION_RULES}\n\n${TARGET_UNIT_POLICY}\nFor baking staples and butter given in grams, call convert-by-density; use convert-mass only if it returns found=false.`,
  tools: { ...unitTools, ...densityTools },
};
