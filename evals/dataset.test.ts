import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEW_SHOT_EXAMPLES } from '../src/agents/variants/few-shot.ts';
import { convertMeasure } from '../src/units/index.ts';
import { TAGS } from './cases.ts';
import { buildDataset, DATASET_PATH, loadDataset, serializeDataset } from './dataset.ts';

describe('evals/dataset.jsonl', () => {
  const rows = loadDataset();

  it('has 60 valid cases with unique ids', () => {
    expect(rows).toHaveLength(60);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('matches the deterministic library (run npm run dataset:build after edits)', () => {
    expect(readFileSync(DATASET_PATH, 'utf8')).toBe(serializeDataset(buildDataset()));
  });

  it('holds out every third case as a 20-case test split covering most tags', () => {
    const test = rows.filter((r) => r.split === 'test');
    expect(test).toHaveLength(20);
    const testTags = new Set(test.flatMap((r) => r.tags));
    // Only two length cases exist; both land in the tune split.
    for (const tag of TAGS.filter((t) => t !== 'length')) expect(testTags.has(tag), tag).toBe(true);
  });

  it('records the unrounded value next to every rounded expectation', () => {
    for (const row of rows) {
      expect(row.expected.exact, row.id).toBeDefined();
      expect(typeof row.expected.exact === 'number', row.id).toBe(typeof row.expected.quantity === 'number');
    }
  });

  it('covers every tag', () => {
    const used = new Set(rows.flatMap((r) => r.tags));
    for (const tag of TAGS) expect(used.has(tag), tag).toBe(true);
  });

  it('does not leak few-shot examples into the eval set', () => {
    const inputs = new Set(rows.map((r) => r.input.toLowerCase()));
    for (const example of FEW_SHOT_EXAMPLES) expect(inputs.has(example.input.toLowerCase())).toBe(false);
  });
});

describe('few-shot examples', () => {
  it('agree with the deterministic library', () => {
    const measures = [
      convertMeasure({ kind: 'mass', grams: 350 }, 'floury potatoes'),
      convertMeasure({ kind: 'mass', grams: 75 }, 'unsalted butter'),
      convertMeasure({ kind: 'volume', ml: 200, packaged: true }),
      convertMeasure({ kind: 'temperature', celsius: 160, context: 'oven' }),
      convertMeasure({ kind: 'count', count: 3 }),
    ];
    FEW_SHOT_EXAMPLES.forEach((example, i) => {
      expect(example.output.quantity).toBe(measures[i]?.quantity);
      expect(example.output.unit).toBe(measures[i]?.unit);
    });
  });
});
