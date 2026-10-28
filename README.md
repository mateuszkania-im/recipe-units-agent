# recipe-units-agent

An agent that converts recipe lines from metric to US units ("800g new potatoes" to "1 3/4 lb new potatoes"), built to show evals done properly: a hand-written dataset, a baseline, swappable variants, metrics for accuracy, cost and latency, per-case traces, and CI.

Built with TypeScript (strict, ESM), [Mastra](https://mastra.ai) agents and tools, Zod structured output, Vitest and an optional Promptfoo view.

## Why

At work I built US localisation for a large recipe website, including metric to US unit conversion. That system is deterministic code. This project asks a different question: how well does an LLM agent do the same job, and what actually moves its accuracy? Prompting alone, tools, a density table, worked examples, a bigger model?

Everything here is written from scratch for this repo. It uses no employer code, data or recipes, and the eval lines are my own wording, not copied from any recipe site.

## How it works

1. A recipe line goes to an agent variant (a Mastra agent).
2. The agent answers with Zod-validated structured output, optionally calling tools that wrap the deterministic unit library.
3. A deterministic scorer compares the answer with the expected value and the runner records accuracy, cost, latency and a trace.

- `src/units/` is a deterministic conversion library with kitchen rounding: grams to oz/lb, ml to tsp/tbsp/cups/fl oz, °C and gas marks to °F, cm to inches, and an ingredient density table for grams to cups. It is fully unit tested.
- `src/agents/` holds the variants. Each is a small config (instructions + tools) built into a Mastra `Agent` for any model id, so the same variant runs on a cheap and a strong model.
- `evals/` holds the dataset, the scorer and the runner.

## Quick start

Requires Node 22 and pnpm (npm works too: `npm install`, `npm run <script>`).

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test            # unit tests, no API key needed
```

To run evals, copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY`, then:

```bash
pnpm eval                                   # every variant x (cheap, strong) model
pnpm eval:baseline                          # baseline only
pnpm eval -- --variant tools,few-shot --model cheap --limit 10
pnpm eval -- --model openrouter/openai/gpt-5-mini   # any Mastra model router id
pnpm eval:promptfoo                         # optional Promptfoo view of the same eval
```

Results land in `results/<timestamp>/`: `summary.md`, `summary.json`, and `runs.jsonl` with one trace per case (input, expected, prediction, score, tokens, cost, latency, every tool call with arguments and result). Set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` to also export Mastra traces to Langfuse; tracing is off otherwise.

## Results

> **Not run yet.** The rows below are placeholders. No model has been called; numbers will be filled in from `results/*/summary.md` after the first run.

| Variant | Model | Accuracy | Quantity | Unit | Ingredient | Cost (60 cases) | p50 latency | p95 latency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | cheap (Claude Haiku 5.5) | not run yet | | | | | | |
| baseline | strong (Claude Sonnet 5.5) | not run yet | | | | | | |
| tools | cheap | not run yet | | | | | | |
| tools | strong | not run yet | | | | | | |
| tools-density | cheap | not run yet | | | | | | |
| tools-density | strong | not run yet | | | | | | |
| few-shot | cheap | not run yet | | | | | | |
| few-shot | strong | not run yet | | | | | | |

Per-tag accuracy (mass, volume, temperature, density, fraction, range, ambiguous, no-conversion, length) is in each run's `summary.md`.

## Method

### Dataset

`evals/dataset.jsonl` has 60 hand-written cases. Each row is `{ id, input, expected: { quantity, unit, ingredient, note? }, tags }`.

- Inputs are written in UK recipe style and include the hard cases: tins ("1 x 400g tin chopped tomatoes"), ranges ("200-250g plain flour"), butter by weight, honey by weight and by volume, gas marks, fan oven notes, a 23cm cake tin, a pinch, and lines that need no conversion ("2 large eggs").
- Expected values are **not typed by hand**. `evals/cases.ts` records the human reading of each line (for example "250 g of all-purpose flour"), and `pnpm dataset:build` computes the expected US answer with the deterministic library. A unit test fails if the JSONL drifts from the library, so the dataset and the conversion policy can never disagree.
- Tags: `mass`, `volume`, `temperature`, `density`, `fraction`, `range`, `ambiguous`, `no-conversion`, plus `length` for tin sizes.

### Conversion policy

Every variant gets the same written rules (`src/agents/instructions.ts`), so variants differ only in tools and examples, not in what "correct" means.

| Input | US output |
| --- | --- |
| Weight under 450 g | oz, nearest 1/4 (below 2 oz) or 1/2 |
| Weight 450 g and over | lb, nearest 1/4 (800 g = 1 3/4 lb) |
| Baking staples by weight | cups, tbsp or tsp via density (250 g flour = 2 cups) |
| Butter by weight | tbsp, nearest 1/2, with a stick note |
| Volume | tsp, tbsp, or cups in quarters and thirds (250 ml = 1 cup) |
| Tins and cans | package size in oz or fl oz (400 g tin = 14 oz) |
| Oven °C or gas mark | °F, nearest 25 (180 °C = 350 °F), fan figure ignored |
| Tin size | whole inches (23 cm = 9 inch) |
| Counts, pinches | unchanged, unit `count` or `pinch` |

### Variants

| Variant | What changes |
| --- | --- |
| `baseline` | One prompt with the rules, no tools, Zod structured output. The model does all arithmetic itself. |
| `tools` | Adds tool calls into the deterministic library: mass, volume, temperature, length. No density data. |
| `tools-density` | Adds a density lookup tool, so grams of flour or butter can become cups or tbsp. |
| `few-shot` | `tools-density` plus five worked examples of tricky lines. A test guarantees none of them appear in the dataset. |

Each variant runs on a cheap and a strong model (defaults: Claude Haiku 5.5 and Claude Sonnet 5.5, via OpenRouter or the Anthropic API depending on which key is set; override with `MODEL_CHEAP`, `MODEL_STRONG` or `--model`).

### Scoring

`evals/scorers.ts` is deterministic, no LLM judge:

- **Unit** must match exactly.
- **Quantity** must be within tolerance in that unit: 10 percent for mass and volume (kitchen rounding legitimately differs, for example 1 2/3 vs 1 3/4 cups), 10 °F for temperatures, 1/2 inch for lengths, exact for counts. A range must be answered as a range.
- **Ingredient** is compared after normalisation: lowercase, accents and plurals stripped, UK names mapped to US names ("double cream" to "heavy cream", "plain flour" to "all-purpose flour"), and one token set must contain the other.
- A case **passes** only when all three are right. That pass rate is the headline accuracy, reported overall and per tag.

### Metrics

- **Accuracy**: pass rate, plus quantity, unit and ingredient rates separately, overall and per tag.
- **Cost**: input and output tokens from Mastra's usage report multiplied by list prices in `src/models.ts`. Unknown models report `n/a` instead of a guess.
- **Latency**: wall clock per case, p50 and p95.
- **Tool calls per case**, and errors (schema failures, API errors) counted as failed cases.

## Project layout

```
src/
  schema.ts            Zod input and output schemas
  units/               deterministic conversion library + tests
  agents/              variants, tools, agent factory, convert()
  models.ts            model ids and prices
  mastra.ts            Mastra instance, optional Langfuse tracing
evals/
  cases.ts             60 hand-written source cases
  dataset.jsonl        generated eval set (pnpm dataset:build)
  scorers.ts           deterministic scorer and per-tag aggregation
  run.ts               eval runner (variant x model)
  promptfoo/           Promptfoo provider, tests and assertion
promptfooconfig.yaml
.github/workflows/ci.yml   typecheck, lint, tests; evals only when a key secret exists
```

## Limitations and next steps

- Single-line cases only; multi-line recipes are supported by the schema but not yet in the eval set.
- The density table uses typical kitchen values. Real flour weight per cup varies with how it is scooped, which is exactly why the tolerance is 10 percent.
- Next: run the matrix, add a held-out split before any prompt tuning, add multi-line recipe cases, and compare against an LLM judge for ingredient naming.

## License

MIT
