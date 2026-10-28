import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { QuantitySchema, USUnitSchema } from '../src/schema.ts';
import { convertMeasure } from '../src/units/index.ts';
import { SOURCE_CASES, TAGS, type SourceCase } from './cases.ts';

export const DATASET_PATH = fileURLToPath(new URL('./dataset.jsonl', import.meta.url));

export const ExpectedSchema = z.object({
  quantity: QuantitySchema,
  unit: USUnitSchema,
  ingredient: z.string(),
  note: z.string().optional(),
});
export type Expected = z.infer<typeof ExpectedSchema>;

export const DatasetRowSchema = z.object({
  id: z.string(),
  input: z.string(),
  expected: ExpectedSchema,
  tags: z.array(z.enum(TAGS)).min(1),
});
export type DatasetRow = z.infer<typeof DatasetRowSchema>;

const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;

/** Expected values come from the deterministic library, never by hand. */
export function buildRow(source: SourceCase): DatasetRow {
  const { quantity, ...rest } = convertMeasure(source.measure, source.ingredient);
  const rounded = typeof quantity === 'number' ? round4(quantity) : { min: round4(quantity.min), max: round4(quantity.max) };
  return {
    id: source.id,
    input: source.input,
    expected: { quantity: rounded, ...rest, ingredient: source.ingredient },
    tags: source.tags,
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
