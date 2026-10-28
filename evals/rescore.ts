/**
 * Re-scores saved predictions against the current dataset and scorer, without
 * calling a model. Use it after a scorer or dataset fix to see what changed.
 *
 *   pnpm eval:rescore results/<timestamp> [--split tune|test]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadDataset } from './dataset.ts';
import { toMarkdown } from './report.ts';
import { summariseAll, type CaseResult } from './results.ts';
import { scoreCase } from './scorers.ts';

/** Applies the current expected values, split and scorer to saved results. */
export function rescore(results: readonly CaseResult[], rows = loadDataset()): CaseResult[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return results.map((r) => {
    const row = byId.get(r.id);
    if (!row) throw new Error(`Case ${r.id} is not in the current dataset`);
    return { ...r, expected: row.expected, split: row.split, score: scoreCase(row.expected, r.predicted ?? undefined) };
  });
}

function main(): void {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    allowPositionals: true,
    options: { split: { type: 'string' } },
  });
  const dir = positionals[0];
  if (!dir) throw new Error('Usage: pnpm eval:rescore results/<timestamp> [--split tune|test]');
  const saved = readFileSync(join(dir, 'runs.jsonl'), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as CaseResult);
  const rescored = rescore(saved).filter((r) => values.split === undefined || r.split === values.split);
  const markdown = toMarkdown(summariseAll(rescored));
  writeFileSync(join(dir, `rescored${values.split ? `-${values.split}` : ''}.md`), markdown);
  console.log(markdown);
}

if (process.argv[1]?.endsWith('rescore.ts')) main();
