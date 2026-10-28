import { Agent } from '@mastra/core/agent';
import { baseline } from './variants/baseline.ts';
import { fewShot } from './variants/few-shot.ts';
import { toolsDensity } from './variants/tools-density.ts';
import { toolsPolicy } from './variants/tools-policy.ts';
import { tools } from './variants/tools.ts';
import { VARIANT_IDS, type VariantConfig, type VariantId } from './types.ts';

export { VARIANT_IDS, type VariantConfig, type VariantId };

export const VARIANTS: Record<VariantId, VariantConfig> = {
  baseline,
  tools,
  'tools-policy': toolsPolicy,
  'tools-density': toolsDensity,
  'few-shot': fewShot,
};

export function isVariantId(value: string): value is VariantId {
  return (VARIANT_IDS as readonly string[]).includes(value);
}

/** Builds an agent for one variant on one model ("provider/model"). */
export function createConversionAgent(variantId: VariantId, modelId: string): Agent {
  const variant = VARIANTS[variantId];
  const id = `${variant.id}--${modelId.replace(/[^a-z0-9]+/gi, '-')}`;
  return new Agent({
    id,
    name: id,
    description: variant.description,
    instructions: variant.instructions,
    model: modelId,
    tools: variant.tools,
  });
}
