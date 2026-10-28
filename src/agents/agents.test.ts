import { describe, expect, it } from 'vitest';
import { buildPrompt } from './convert.ts';
import { createConversionAgent, VARIANT_IDS, VARIANTS } from './index.ts';
import { convertMassTool, densityLookupTool } from './tools.ts';

describe('variants', () => {
  it('builds an agent for every variant without calling a model', () => {
    for (const id of VARIANT_IDS) {
      const agent = createConversionAgent(id, 'anthropic/claude-haiku-5-5');
      expect(agent.id).toContain(id);
    }
  });

  it('adds tools step by step', () => {
    expect(Object.keys(VARIANTS.baseline.tools)).toHaveLength(0);
    expect(Object.keys(VARIANTS.tools.tools)).toHaveLength(4);
    expect(Object.keys(VARIANTS['tools-density'].tools)).toHaveLength(5);
    expect(VARIANTS['few-shot'].tools).toBe(VARIANTS['tools-density'].tools);
    expect(VARIANTS['few-shot'].instructions).toContain('Examples');
  });
});

describe('tools', () => {
  it('convert-mass returns the library result', async () => {
    const result = await convertMassTool.execute?.({ grams: 800 }, {});
    expect(result).toMatchObject({ quantity: 1.75, unit: 'lb', display: '1 3/4 lb' });
  });

  it('convert-by-density reports unknown ingredients', async () => {
    expect(await densityLookupTool.execute?.({ ingredient: 'potatoes', grams: 100 }, {})).toEqual({ found: false });
    expect(await densityLookupTool.execute?.({ ingredient: 'plain flour', grams: 250 }, {})).toMatchObject({
      found: true,
      matched: 'all-purpose flour',
      quantity: 2,
      unit: 'cup',
    });
  });
});

describe('buildPrompt', () => {
  it('numbers lines from a small recipe', () => {
    expect(buildPrompt({ ingredients: ['250g plain flour'], ovenTemperature: 'Heat oven to 180C' })).toBe(
      'Convert these recipe lines to US units:\n1. 250g plain flour\n2. Heat oven to 180C',
    );
  });
});
