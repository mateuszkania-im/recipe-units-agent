/**
 * Model selection and pricing. Model ids use the Mastra model router format
 * "provider/model", so the same variant can run on any configured model.
 */
export type ModelTier = 'cheap' | 'strong';

const DEFAULTS: Record<'openrouter' | 'anthropic', Record<ModelTier, string>> = {
  openrouter: {
    cheap: 'openrouter/anthropic/claude-haiku-5.5',
    strong: 'openrouter/anthropic/claude-sonnet-5.5',
  },
  anthropic: {
    cheap: 'anthropic/claude-haiku-5-5',
    strong: 'anthropic/claude-sonnet-5-5',
  },
};

type Env = Readonly<Record<string, string | undefined>>;

export function hasModelCredentials(env: Env = process.env): boolean {
  return Boolean(env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY);
}

/** Accepts a tier ("cheap", "strong") or a full "provider/model" id. */
export function resolveModel(tierOrId: string, env: Env = process.env): string {
  if (tierOrId.includes('/')) return tierOrId;
  if (tierOrId !== 'cheap' && tierOrId !== 'strong') {
    throw new Error(`Unknown model "${tierOrId}". Use cheap, strong or a provider/model id.`);
  }
  const override = tierOrId === 'cheap' ? env.MODEL_CHEAP : env.MODEL_STRONG;
  if (override) return override;
  const provider = env.OPENROUTER_API_KEY ? 'openrouter' : 'anthropic';
  return DEFAULTS[provider][tierOrId];
}

interface Price {
  inputPerMillion: number;
  outputPerMillion: number;
}

/**
 * USD per million tokens, Anthropic list prices (checked 2026-10).
 * OpenRouter passes these through for Anthropic models; verify before
 * publishing numbers. Unknown models report cost as null.
 */
const PRICES: readonly (readonly [RegExp, Price])[] = [
  [/claude-haiku-5[.-]5/, { inputPerMillion: 0.1, outputPerMillion: 0.5 }],
  [/claude-sonnet-5[.-]5/, { inputPerMillion: 2, outputPerMillion: 10 }],
];

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export function estimateCostUsd(modelId: string, usage: TokenUsage): number | null {
  const price = PRICES.find(([pattern]) => pattern.test(modelId))?.[1];
  if (!price) return null;
  return (usage.inputTokens * price.inputPerMillion + usage.outputTokens * price.outputPerMillion) / 1_000_000;
}
