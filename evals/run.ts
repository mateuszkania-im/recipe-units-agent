/**
 * Eval runner: every variant x model over evals/dataset.jsonl.
 * Writes per-case traces and a summary to results/<timestamp>/.
 *
 *   pnpm eval                                     all variants, cheap and strong model, both splits
 *   pnpm eval -- --variant baseline --model cheap --split tune --limit 10
 *   pnpm eval -- --variant tools-density --structured-output prompt
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createConversionAgent, isVariantId, VARIANT_IDS } from '../src/agents/index.ts';
import { convertRecipe, STRUCTURED_OUTPUT_MODES, type ConversionRun, type StructuredOutputMode } from '../src/agents/convert.ts';
import { createMastra } from '../src/mastra.ts';
import { estimateCostUsd, hasModelCredentials, resolveModel } from '../src/models.ts';
import { loadDataset, SPLITS, type DatasetRow, type Split } from './dataset.ts';
import { mapWithConcurrency } from './pool.ts';
import { toMarkdown } from './report.ts';
import { summariseAll, type CaseResult } from './results.ts';
import { scoreCase } from './scorers.ts';

const list = (value: string | undefined, fallback: readonly string[]): string[] =>
  value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [...fallback];

const isSplit = (value: string): value is Split => (SPLITS as readonly string[]).includes(value);
const isMode = (value: string): value is StructuredOutputMode => (STRUCTURED_OUTPUT_MODES as readonly string[]).includes(value);

function parseOptions() {
  const { values } = parseArgs({
    // pnpm forwards the `--` separator, npm strips it
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      variant: { type: 'string' },
      model: { type: 'string' },
      split: { type: 'string', default: 'all' },
      'structured-output': { type: 'string', default: 'native' },
      limit: { type: 'string' },
      concurrency: { type: 'string', default: '4' },
    },
  });
  const variants = list(values.variant, VARIANT_IDS);
  for (const v of variants) if (!isVariantId(v)) throw new Error(`Unknown variant "${v}". Known: ${VARIANT_IDS.join(', ')}`);
  const split = values.split;
  if (split !== 'all' && !isSplit(split)) throw new Error(`Unknown split "${split}". Use all, ${SPLITS.join(', ')}.`);
  const mode = values['structured-output'];
  if (!isMode(mode)) throw new Error(`Unknown structured output mode "${mode}". Use ${STRUCTURED_OUTPUT_MODES.join(', ')}.`);
  return {
    variants: variants.filter(isVariantId),
    models: list(values.model, ['cheap', 'strong']).map((m) => resolveModel(m)),
    split,
    structuredOutput: mode,
    limit: values.limit ? Number(values.limit) : undefined,
    concurrency: Number(values.concurrency),
  };
}

async function runCase(
  meta: Pick<CaseResult, 'variant' | 'model' | 'structuredOutput'>,
  row: DatasetRow,
  run: (input: string) => Promise<ConversionRun>,
): Promise<CaseResult> {
  const base = { ...meta, id: row.id, tags: row.tags, split: row.split, input: row.input, expected: row.expected };
  const started = performance.now();
  try {
    const result = await run(row.input);
    const predicted = result.output.lines[0] ?? null;
    return {
      ...base,
      predicted,
      score: scoreCase(row.expected, predicted ?? undefined),
      usage: result.usage,
      costUsd: estimateCostUsd(meta.model, result.usage),
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

async function main(): Promise<void> {
  if (!hasModelCredentials()) {
    console.error('No model credentials. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (see .env.example).');
    process.exitCode = 1;
    return;
  }
  const options = parseOptions();
  const rows = loadDataset()
    .filter((row) => options.split === 'all' || row.split === options.split)
    .slice(0, options.limit);
  const outDir = join('results', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(outDir, { recursive: true });

  const allResults: CaseResult[] = [];
  for (const variant of options.variants) {
    for (const model of options.models) {
      const agent = createConversionAgent(variant, model);
      // Registering wires the agent into Mastra (and Langfuse tracing when enabled).
      createMastra({ [agent.id]: agent });
      console.log(`Running ${variant} on ${model} (${rows.length} cases, split ${options.split}, ${options.structuredOutput} structured output)`);
      const meta = { variant, model, structuredOutput: options.structuredOutput };
      const results = await mapWithConcurrency(rows, options.concurrency, (row) =>
        runCase(meta, row, (input) => convertRecipe(agent, input, { structuredOutput: options.structuredOutput })),
      );
      allResults.push(...results);
    }
  }

  const summaries = summariseAll(allResults);
  writeFileSync(join(outDir, 'runs.jsonl'), allResults.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summaries, null, 2));
  const markdown = toMarkdown(summaries);
  writeFileSync(join(outDir, 'summary.md'), markdown);
  console.log(`\n${markdown}\nResults written to ${outDir}`);
}

await main();
