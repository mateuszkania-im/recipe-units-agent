import type { ConversionRun, StructuredOutputMode } from '../src/agents/convert.ts';
import type { DatasetRow, Split } from './dataset.ts';
import { percentile, type RunSummary } from './report.ts';
import { aggregate, type CaseScore } from './scorers.ts';

/** One line of runs.jsonl: everything needed to audit or re-score a case. */
export interface CaseResult {
  variant: string;
  model: string;
  structuredOutput?: StructuredOutputMode;
  id: string;
  tags: string[];
  split?: Split;
  input: string;
  expected: DatasetRow['expected'];
  predicted: ConversionRun['output']['lines'][number] | null;
  score: CaseScore;
  usage: ConversionRun['usage'] | null;
  costUsd: number | null;
  latencyMs: number;
  steps: number;
  toolCalls: ConversionRun['toolCalls'];
  error: string | null;
}

export function summarise(results: readonly CaseResult[]): RunSummary {
  const first = results[0];
  if (!first) throw new Error('Cannot summarise an empty run');
  const costs = results.map((r) => r.costUsd);
  const latencies = results.filter((r) => r.error === null).map((r) => r.latencyMs);
  const splits = [...new Set(results.map((r) => r.split).filter((s): s is Split => s !== undefined))].sort().reverse();
  return {
    variant: first.variant,
    model: first.model,
    structuredOutput: first.structuredOutput ?? 'native',
    accuracy: aggregate(results),
    bySplit: Object.fromEntries(splits.map((split) => [split, aggregate(results.filter((r) => r.split === split)).overall])),
    errors: results.filter((r) => r.error !== null).length,
    totalCostUsd: costs.every((c) => c === null) ? null : costs.reduce<number>((sum, c) => sum + (c ?? 0), 0),
    latencyMs: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    avgToolCalls: results.reduce((sum, r) => sum + r.toolCalls.length, 0) / results.length,
  };
}

/** Groups results by variant, model and structured output mode, keeping first-seen order. */
export function summariseAll(results: readonly CaseResult[]): RunSummary[] {
  const groups = new Map<string, CaseResult[]>();
  for (const r of results) {
    const key = `${r.variant}|${r.model}|${r.structuredOutput ?? 'native'}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()].map(summarise);
}
