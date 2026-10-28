import type { ToolsInput } from '@mastra/core/agent';

export const VARIANT_IDS = ['baseline', 'tools', 'tools-policy', 'tools-density', 'few-shot'] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

/** A swappable agent configuration. The model is supplied at build time. */
export interface VariantConfig {
  readonly id: VariantId;
  readonly description: string;
  readonly instructions: string;
  readonly tools: ToolsInput;
}
