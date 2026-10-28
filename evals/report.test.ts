import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './pool.ts';
import { percentile, toMarkdown } from './report.ts';

describe('percentile', () => {
  it('uses nearest rank', () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(20);
    expect(percentile([10, 20, 30, 40], 95)).toBe(40);
    expect(percentile([], 50)).toBe(0);
  });
});

describe('toMarkdown', () => {
  it('renders overall and per-tag tables', () => {
    const accuracy = { n: 2, pass: 0.5, quantity: 0.5, unit: 1, ingredient: 1 };
    const md = toMarkdown([
      {
        variant: 'baseline',
        model: 'anthropic/claude-haiku-5-5',
        accuracy: { overall: accuracy, byTag: { mass: accuracy } },
        bySplit: { tune: accuracy },
        errors: 0,
        totalCostUsd: 0.0012,
        latencyMs: { p50: 800, p95: 1200 },
        avgToolCalls: 0,
      },
    ]);
    expect(md).toContain('| baseline | anthropic/claude-haiku-5-5 | 50.0% | 50.0% (n=2) | - |');
    expect(md).toContain('$0.0012');
    expect(md).toContain('$0.0600');
    expect(md).toContain('| Variant | Model | mass |');
  });
});

describe('mapWithConcurrency', () => {
  it('keeps input order', async () => {
    const out = await mapWithConcurrency([30, 10, 20], 2, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms;
    });
    expect(out).toEqual([30, 10, 20]);
  });
});
