import { CONVERSION_RULES, TOOL_GUIDANCE } from '../instructions.ts';
import { densityLookupTool, unitTools } from '../tools.ts';
import type { VariantConfig } from '../types.ts';

/** Adds the density lookup so grams of flour or butter become cups or tbsp. */
export const toolsDensity: VariantConfig = {
  id: 'tools-density',
  description: 'Unit tools plus ingredient density lookup',
  instructions: `${CONVERSION_RULES}\n\n${TOOL_GUIDANCE}\nFor baking ingredients given in grams, try convert-by-density first.`,
  tools: { ...unitTools, densityLookupTool },
};
