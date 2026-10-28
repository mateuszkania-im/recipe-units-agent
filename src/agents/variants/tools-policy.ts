import { CONVERSION_RULES, NO_DENSITY_FALLBACK, TARGET_UNIT_POLICY } from '../instructions.ts';
import { unitTools } from '../tools.ts';
import type { VariantConfig } from '../types.ts';

/** Same four unit tools as `tools`, but the target unit is decided before the tool. */
export const toolsPolicy: VariantConfig = {
  id: 'tools-policy',
  description: 'Unit tools with a target-unit policy, no density data',
  instructions: `${CONVERSION_RULES}\n\n${TARGET_UNIT_POLICY}\n\n${NO_DENSITY_FALLBACK}`,
  tools: unitTools,
};
