import { CONVERSION_RULES } from '../instructions.ts';
import type { VariantConfig } from '../types.ts';

/** Single prompt, no tools: the model does every conversion in its head. */
export const baseline: VariantConfig = {
  id: 'baseline',
  description: 'Single prompt, no tools, structured output',
  instructions: `${CONVERSION_RULES}\n\nDo the arithmetic carefully yourself.`,
  tools: {},
};
