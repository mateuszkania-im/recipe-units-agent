/**
 * Promptfoo custom provider wrapping one variant on one model.
 * promptfoo is run via npx and is not a dependency, so its types are
 * mirrored minimally here.
 */
import { createConversionAgent, isVariantId } from '../../src/agents/index.ts';
import { convertRecipe } from '../../src/agents/convert.ts';
import { createMastra } from '../../src/mastra.ts';
import { estimateCostUsd, resolveModel } from '../../src/models.ts';
import type { Agent } from '@mastra/core/agent';
import type { ConversionOutput } from '../../src/schema.ts';

interface ProviderOptions {
  id?: string;
  label?: string;
  config?: { variant?: string; model?: string };
}

interface ProviderResponse {
  output?: ConversionOutput;
  error?: string;
  tokenUsage?: { total: number; prompt: number; completion: number };
  cost?: number;
  metadata?: Record<string, unknown>;
}

export default class RecipeUnitsProvider {
  private readonly agent: Agent;
  private readonly model: string;
  private readonly label: string;

  constructor(options: ProviderOptions) {
    const variant = options.config?.variant ?? 'baseline';
    if (!isVariantId(variant)) throw new Error(`Unknown variant "${variant}"`);
    const tier = options.config?.model ?? 'cheap';
    this.model = resolveModel(tier);
    this.agent = createConversionAgent(variant, this.model);
    createMastra({ [this.agent.id]: this.agent });
    // options.id is the file:// path; a variant/tier id makes --filter-providers work.
    this.label = options.label ?? `${variant}/${tier}`;
  }

  id(): string {
    return this.label;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    try {
      const run = await convertRecipe(this.agent, prompt);
      const { inputTokens, outputTokens } = run.usage;
      return {
        output: run.output,
        tokenUsage: { prompt: inputTokens, completion: outputTokens, total: inputTokens + outputTokens },
        cost: estimateCostUsd(this.model, run.usage) ?? undefined,
        metadata: { toolCalls: run.toolCalls, steps: run.steps, latencyMs: run.latencyMs },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}
