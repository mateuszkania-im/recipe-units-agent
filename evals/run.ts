/**
 * Eval runner: every variant x model over evals/dataset.jsonl.
 * Writes per-case traces and a summary to results/<timestamp>/.
 *
 *   npm run eval                                  all variants, cheap and strong model
 *   npm run eval -- --variant baseline --model cheap --limit 10
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createConversionAgent, isVariantId, VARIANT_IDS, type VariantId } from '../src/agents/index.ts';
import { convertRecipe, type ConversionRun } from '../src/agents/convert.ts';
import { createMastra } from '../src/mastra.ts';
import { estimateCostUsd, hasModelCredentials, resolveModel } from '../src/models.ts';
import { loadDataset, type DatasetRow } from './dataset.ts';
import { mapWithConcurrency } from './pool.ts';
import { percentile, toMarkdown, type RunSummary } from './report.ts';
import { aggregate, scoreCase, type CaseScore } from './scorers.ts';

interface CaseResult {
  variant: VariantId;
  model: string;
  id: string;
  tags: string[];
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

const list = (value: string | undefined, fallback: readonly string[]): string[] =>
  value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [...fallback];

function parseOptions() {
  const { values } = parseArgs({
    options: {
      variant: { type: 'string' },
      model: { type: 'string' },
      limit: { type: 'string' },
      concurrency: { type: 'string', default: '4' },
    },
  });
  const variants = list(values.variant, VARIANT_IDS);
  for (const v of variants) if (!isVariantId(v)) throw new Error(`Unknown variant "${v}". Known: ${VARIANT_IDS.join(', ')}`);
  return {
    variants: variants.filter(isVariantId),
    models: list(values.model, ['cheap', 'strong']).map((m) => resolveModel(m)),
    limit: values.limit ? Number(values.limit) : undefined,
    concurrency: Number(values.concurrency),
  };
}

async function runCase(variant: VariantId, model: string, row: DatasetRow, run: (input: string) => Promise<ConversionRun>): Promise<CaseResult> {
  const base = { variant, model, id: row.id, tags: row.tags, input: row.input, expected: row.expected };
  const started = performance.now();
  try {
    const result = await run(row.input);
    const predicted = result.output.lines[0] ?? null;
    return {
      ...base,
      predicted,
      score: scoreCase(row.expected, predicted ?? undefined),
      usage: result.usage,
      costUsd: estimateCostUsd(model, result.usage),
      latencyMs: result.latencyMs,
      steps: result.steps,
      toolCalls: result.toolCalls,
      error: null,
    };
  } catch (error) {
    return {
      ...base,
      predicted: null,
      score: scoreCase(row.expected, undefined),
      usage: null,
      costUsd: null,
      latencyMs: performance.now() - started,
      steps: 0,
      toolCalls: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarise(variant: VariantId, model: string, results: readonly CaseResult[]): RunSummary {
  const costs = results.map((r) => r.costUsd);
  const latencies = results.filter((r) => r.error === null).map((r) => r.latencyMs);
  return {
    variant,
    model,
    accuracy: aggregate(results),
    errors: results.filter((r) => r.error !== null).length,
    totalCostUsd: costs.every((c) => c === null) ? null : costs.reduce<number>((sum, c) => sum + (c ?? 0), 0),
    latencyMs: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    avgToolCalls: results.reduce((sum, r) => sum + r.toolCalls.length, 0) / Math.max(1, results.length),
  };
}

async function main(): Promise<void> {
  if (!hasModelCredentials()) {
    console.error('No model credentials. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (see .env.example).');
    process.exitCode = 1;
    return;
  }
  const options = parseOptions();
  const rows = loadDataset().slice(0, options.limit);
  const outDir = join('results', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(outDir, { recursive: true });

  const summaries: RunSummary[] = [];
  const allResults: CaseResult[] = [];
  for (const variant of options.variants) {
    for (const model of options.models) {
      const agent = createConversionAgent(variant, model);
      // Registering wires the agent into Mastra (and Langfuse tracing when enabled).
      createMastra({ [agent.id]: agent });
      console.log(`Running ${variant} on ${model} (${rows.length} cases)`);
      const results = await mapWithConcurrency(rows, options.concurrency, (row) =>
        runCase(variant, model, row, (input) => convertRecipe(agent, input)),
      );
      allResults.push(...results);
      summaries.push(summarise(variant, model, results));
    }
  }

  writeFileSync(join(outDir, 'runs.jsonl'), allResults.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summaries, null, 2));
  const markdown = toMarkdown(summaries);
  writeFileSync(join(outDir, 'summary.md'), markdown);
  console.log(`\n${markdown}\nResults written to ${outDir}`);
}

await main();
