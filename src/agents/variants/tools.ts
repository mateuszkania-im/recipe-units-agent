import { CONVERSION_RULES, TOOL_GUIDANCE } from '../instructions.ts';
import { naiveUnitTools } from '../tools.ts';
import type { VariantConfig } from '../types.ts';

/**
 * Naive tool calling into the deterministic library, no density data. Kept
 * unchanged as a record of the first design: its "copy the tool's unit" rule
 * conflicts with the conversion rules for flour and butter by weight.
 */
export const tools: VariantConfig = {
  id: 'tools',
  description: 'Naive unit tools (mass, volume, temperature, length)',
  instructions: `${CONVERSION_RULES}\n\n${TOOL_GUIDANCE}`,
  tools: naiveUnitTools,
};
