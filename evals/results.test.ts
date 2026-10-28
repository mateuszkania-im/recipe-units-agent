import { describe, expect, it } from 'vitest';
import type { DatasetRow } from './dataset.ts';
import { costPer100, toMarkdown } from './report.ts';
import { rescore } from './rescore.ts';
import { summarise, summariseAll, type CaseResult } from './results.ts';
import { scoreCase } from './scorers.ts';

const expected: DatasetRow['expected'] = { quantity: 0.5, exact: 0.4227, unit: 'cup', ingredient: 'heavy cream' };

function result(overrides: Partial<CaseResult>): CaseResult {
  const predicted = { original: 'x', quantity: 0.5, unit: 'cup' as const, ingredient: 'heavy cream', confidence: 1 };
  return {
    variant: 'baseline',
    model: 'anthropic/claude-haiku-5-5',
    id: 'volume-02',
    tags: ['volume'],
    split: 'tune',
    input: '100ml double cream',
    expected,
    predicted,
    score: scoreCase(expected, predicted),
    usage: { inputTokens: 1000, outputTokens: 100 },
    costUsd: 0.001,
    latencyMs: 1000,
    steps: 1,
    toolCalls: [],
    error: null,
    ...overrides,
  };
}

describe('summarise', () => {
  it('reports accuracy per split and cost per 100 conversions', () => {
    const fail = { quantity: false, unit: true, ingredient: true, pass: false };
    const summary = summarise([result({}), result({ split: 'test', score: fail }), result({ split: 'test' })]);
    expect(summary.bySplit?.tune?.pass).toBe(1);
    expect(summary.bySplit?.test?.pass).toBe(0.5);
    expect(summary.accuracy.overall.n).toBe(3);
    expect(costPer100(summary)).toBeCloseTo(0.1, 10);
    expect(summary.structuredOutput).toBe('native');
  });

  it('groups by variant, model and structured output mode', () => {
    const groups = summariseAll([result({}), result({ variant: 'tools' }), result({ structuredOutput: 'prompt' })]);
    expect(groups.map((g) => [g.variant, g.structuredOutput])).toEqual([
      ['baseline', 'native'],
      ['tools', 'native'],
      ['baseline', 'prompt'],
    ]);
    expect(toMarkdown(groups)).toContain('| baseline (prompt json) |');
  });
});

describe('rescore', () => {
  it('applies the current expected values, split and scorer to saved predictions', () => {
    const row: DatasetRow = { id: 'volume-02', input: '100ml double cream', expected, tags: ['volume'], split: 'test' };
    const stale = result({
      split: undefined,
      expected: { quantity: 0.5, unit: 'cup', ingredient: 'heavy cream' },
      predicted: { original: 'x', quantity: 0.4, unit: 'cup', ingredient: 'heavy cream', confidence: 1 },
      score: { quantity: false, unit: true, ingredient: true, pass: false },
    });
    const [fresh] = rescore([stale], [row]);
    expect(fresh?.split).toBe('test');
    expect(fresh?.score.pass).toBe(true);
  });

  it('refuses cases missing from the dataset', () => {
    expect(() => rescore([result({ id: 'gone' })], [])).toThrow(/gone/);
  });
});
