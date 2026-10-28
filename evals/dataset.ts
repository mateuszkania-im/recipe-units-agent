import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { QuantitySchema, USUnitSchema, type Quantity } from '../src/schema.ts';
import { convertMeasure, convertMeasureExact } from '../src/units/index.ts';
import { SOURCE_CASES, TAGS, type SourceCase } from './cases.ts';

export const DATASET_PATH = fileURLToPath(new URL('./dataset.jsonl', import.meta.url));

/**
 * `tune` cases may be inspected while changing prompts and tools; `test` cases
 * are held out and only reported. Every third source case is held out, which
 * spreads the test split across every group in cases.ts.
 */
export const SPLITS = ['tune', 'test'] as const;
export type Split = (typeof SPLITS)[number];

export function splitFor(index: number): Split {
  return index % 3 === 2 ? 'test' : 'tune';
}

export const ExpectedSchema = z.object({
  quantity: QuantitySchema,
  unit: USUnitSchema,
  ingredient: z.string(),
  note: z.string().optional(),
  /** The unrounded conversion in the same unit; the scorer accepts answers close to either. */
  exact: QuantitySchema.optional(),
});
export type Expected = z.infer<typeof ExpectedSchema>;

export const DatasetRowSchema = z.object({
  id: z.string(),
  input: z.string(),
  expected: ExpectedSchema,
  tags: z.array(z.enum(TAGS)).min(1),
  split: z.enum(SPLITS),
});
export type DatasetRow = z.infer<typeof DatasetRowSchema>;

const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;
const roundQuantity = (q: Quantity): Quantity =>
  typeof q === 'number' ? round4(q) : { min: round4(q.min), max: round4(q.max) };

/** Expected values come from the deterministic library, never by hand. */
export function buildRow(source: SourceCase, index: number): DatasetRow {
  const { quantity, ...rest } = convertMeasure(source.measure, source.ingredient);
  const exact = convertMeasureExact(source.measure, source.ingredient).quantity;
  return {
    id: source.id,
    input: source.input,
    expected: { quantity: roundQuantity(quantity), ...rest, ingredient: source.ingredient, exact: roundQuantity(exact) },
    tags: source.tags,
    split: splitFor(index),
  };
}

export function buildDataset(): DatasetRow[] {
  return SOURCE_CASES.map(buildRow);
}

export function serializeDataset(rows: readonly DatasetRow[]): string {
  return rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
}

export function loadDataset(path: string = DATASET_PATH): DatasetRow[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => DatasetRowSchema.parse(JSON.parse(line)));
}
