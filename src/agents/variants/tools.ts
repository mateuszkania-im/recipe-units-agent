import { CONVERSION_RULES, TOOL_GUIDANCE } from '../instructions.ts';
import { unitTools } from '../tools.ts';
import type { VariantConfig } from '../types.ts';

/** Tool calling into the deterministic unit library, no density data. */
export const tools: VariantConfig = {
  id: 'tools',
  description: 'Unit conversion tools (mass, volume, temperature, length)',
  instructions: `${CONVERSION_RULES}\n\n${TOOL_GUIDANCE}`,
  tools: unitTools,
};
