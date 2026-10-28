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

Requires Node 22.13 or newer and pnpm (npm works too: `npm install`, `npm run <script>`). The optional Promptfoo view needs Node 22.22 or newer.

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test            # unit tests, no API key needed
```

To run evals, copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY`, then:

```bash
pnpm eval                                   # every variant x (cheap, strong) model, both splits
pnpm eval:baseline                          # baseline only
pnpm eval -- --variant tools,few-shot --model cheap --limit 10
pnpm eval -- --model cheap --split tune     # tune split only (what you look at while changing prompts)
pnpm eval -- --variant few-shot --structured-output prompt   # Mastra's jsonPromptInjection workaround
pnpm eval -- --model openrouter/openai/gpt-5-mini   # any Mastra model router id
pnpm eval:rescore results/<timestamp>       # re-score saved traces after a scorer or dataset fix, no model calls
pnpm eval:promptfoo                         # optional Promptfoo view of the same eval
```

Results land in `results/<timestamp>/`: `summary.md`, `summary.json`, and `runs.jsonl` with one trace per case (input, expected, prediction, score, tokens, cost, latency, every tool call with arguments and result). Set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` to also export Mastra traces to Langfuse; tracing is off otherwise.

## Results

Final runs on 2026-10-28, all 60 cases, one run per model after tuning had finished. Accuracy is the share of cases where quantity, unit and ingredient are all right. **Tune** is the 40 cases I was allowed to look at while changing prompts and tools; **Test** is the 20 held-out cases (one case is 5 points). Cost is at Anthropic list prices from the token counts Mastra reports, summed over every step of a tool loop.

| Variant | Model | Tune (n=40) | Test (n=20) | Density tag (n=18) | Cost per 100 conversions | p50 latency | p95 latency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | Haiku 5.5 | 97.5% | 95.0% | 94.4% | $0.033 | 2.4 s | 3.5 s |
| tools (naive) | Haiku 5.5 | 77.5% | 75.0% | 22.2% | $0.075 | 3.3 s | 6.8 s |
| tools-policy | Haiku 5.5 | 100.0% | 95.0% | 94.4% | $0.078 | 3.3 s | 4.5 s |
| tools-density | Haiku 5.5 | 100.0% | 100.0% | 100.0% | $0.081 | 3.0 s | 4.1 s |
| few-shot | Haiku 5.5 | 100.0% | 100.0% | 100.0% | $0.092 | 2.9 s | 4.2 s |
| baseline | Sonnet 5.5 | 90.0% | 95.0% | 88.9% | $0.570 | 2.6 s | 4.1 s |
| tools (naive) | Sonnet 5.5 | 95.0% | 95.0% | 83.3% | $1.295 | 3.2 s | 6.2 s |
| tools-policy | Sonnet 5.5 | 95.0% | 100.0% | 88.9% | $1.436 | 3.1 s | 5.3 s |
| tools-density | Sonnet 5.5 | 100.0% | 100.0% | 100.0% | $1.517 | 3.0 s | 4.5 s |
| few-shot | Sonnet 5.5 | 100.0% | 100.0% | 100.0% | $1.741 | 2.9 s | 4.1 s |

Per-tag highlights:

- **density** (grams of flour, sugar, butter to cups or tbsp) is where variants differ most. Naive tools on Haiku scored 22.2% because it returned oz; with the density tool both models scored 100%.
- **volume** and **range** are where the no-tool baseline loses points: it rounds 100 ml (0.42 cup) to 1/3 cup instead of the nearer 1/2. Sonnet's baseline made this mistake more often than Haiku's (volume 72.7% vs 90.9%).
- **temperature**, **length** and **no-conversion** were 100% for every variant on both models.
- Errors: zero schema or API failures across all 600 final-run cases.

Full tables, including quantity, unit and ingredient rates and every tag, are in [`docs/results/`](docs/results/). How the failures were classified, and the dataset and scorer fixes that came out of it, are in [`docs/error-analysis.md`](docs/error-analysis.md).

### How the numbers moved

| Step | Split | baseline | tools | tools-policy | tools-density | few-shot |
| --- | --- | --- | --- | --- | --- | --- |
| First run, original scorer | all 60 | 86.7% | 73.3% | | | |
| Same predictions, fixed scorer (`eval:rescore`) | all 60 | 93.3% | 73.3% | | | |
| Round 0: variants as first written | tune | 95.0% | 82.5% | | 100% | 100% |
| Round 1: target-unit policy, tool names, tool descriptions | tune | | | 100% | 100% | 100% |
| Final, Haiku 5.5 | test | 95.0% | 75.0% | 95.0% | 100% | 100% |

All rows are Haiku 5.5. I stopped after one round of prompt and tool changes because the tune split hit its ceiling; more rounds would only have fitted noise. The same baseline prompt scored 86.7% (old scorer), 93.3%, 95.0% and 96.7% on different runs and subsets, which is a reminder that a few points on 60 cases is within run-to-run noise.

**Structured output with tools.** Mastra's docs warn that some models cannot combine tools with structured output and offer `jsonPromptInjection` as a workaround. On Claude there was no conflict: with native structured output every conversion case still called a tool (0 to 1 calls per case, 0 errors). I added `--structured-output prompt` to run the documented workaround anyway; on the tune split it scored 97.5% (tools-policy) and 100% (few-shot) against 100% and 100% native, at the same cost. Native stays the default; the flag is there for models that need it.

**Promptfoo.** `promptfooconfig.yaml` was verified once with promptfoo 0.125.1 on Node 23.0.0 (the newest Node installed here that meets its `>=22.22` requirement): 3 cases x 5 cheap providers, 15 of 15 passed. Run a subset with `pnpm eval:promptfoo -- --filter-first-n 3 --filter-providers cheap`.

## What I learned

**Naive tool calling made the cheap model worse.** Adding tools that wrap correct, tested conversion code dropped Haiku from 86.7% to 73.3% on the first run, and the density tag from 72% to 11%. The tools were not wrong; the prompt was. It said "baking staples by weight become cups" and also "do not do arithmetic yourself, copy the tool's unit". For "250g plain flour" the only tool that accepts grams returns ounces, so the model obeyed the more specific instruction and answered 9 oz. In two cases it noticed the conflict, ignored the tool and estimated cups, which showed the model could see the problem but usually resolved it the wrong way.

**What fixed it was deciding the target unit before the tool.** One explicit policy (flour, sugar and butter by weight are volume, never oz; butter is always tbsp; pick the tool that produces the target, and if a tool returns another unit, do not copy it), tool descriptions that say what each tool must not be used for, and tool names that match the names the prompt uses. With the same four tools and no density data, `tools-policy` scored 100% on tune and 95% on test, where naive `tools` scored 77.5% to 82.5% on tune across runs and 75% on test. Adding the density table (`tools-density`) made it 100% on both, on both models. The worked examples in `few-shot` added cost but no measurable accuracy once the policy was in place.

**A stronger model hides a bad prompt, at 17 to 19 times the price.** Sonnet with the naive prompt scored 95%: on 14 of 18 density lines it did what `tools-policy` now spells out (estimate millilitres, call the volume tool) instead of copying ounces from the mass tool. So "tools made it worse" was a cheap-model finding, and the honest fix was the prompt, not the model. Once the prompt and tools were right, Haiku matched Sonnet at 100% for $0.08 per 100 conversions against $1.52, with similar latency. Sonnet's no-tool baseline was not better than Haiku's (both 95% on test).

**Caveats I would want a reviewer to know.**

- `tools-density` calls the same library that generates the expected answers, so its 100% shows that the agent parses each line and routes it to the right tool, not that the conversions are independently right. The library has its own unit tests for that.
- 20 test cases is small: one case is 5 points. The differences between 95% and 100% are one case each.
- My first error analysis read all 60 cases before the split existed, so the test split is held out from tuning rounds, not from my eyes entirely.
- One failure I saw on the test split and deliberately did not fix: Haiku twice renamed "granulated sugar" to "superfine sugar", probably led by the rule line "caster sugar is superfine sugar". Fixing it after seeing it on the test split would turn test into tune.

## Reproduce

```bash
pnpm install && pnpm test                          # no key needed
pnpm dataset:build                                 # regenerates evals/dataset.jsonl (the test fails if it drifts)
pnpm eval -- --model cheap --split tune            # tuning loop: tune split only, under $0.04 per variant
pnpm eval -- --model cheap                         # final cheap run, both splits, about $0.22 for all five variants
pnpm eval -- --model strong                        # final strong run, about $3.90 for all five variants
pnpm eval:rescore results/<timestamp>              # re-score saved traces with the current scorer
```

Total spent on model calls for everything in this README, including tuning runs and the Promptfoo check: about $4.44.

## Method

### Dataset

`evals/dataset.jsonl` has 60 hand-written cases. Each row is `{ id, input, expected: { quantity, unit, ingredient, note?, exact }, tags, split }`.

- Inputs are written in UK recipe style and include the hard cases: tins ("1 x 400g tin chopped tomatoes"), ranges ("200-250g plain flour"), butter by weight, honey by weight and by volume, gas marks, fan oven notes, a 23cm cake tin, a pinch, and lines that need no conversion ("2 large eggs").
- Expected values are **not typed by hand**. `evals/cases.ts` records the human reading of each line (for example "250 g of all-purpose flour"), and `pnpm dataset:build` computes the expected US answer with the deterministic library. A unit test fails if the JSONL drifts from the library, so the dataset and the conversion policy can never disagree.
- `exact` is the same conversion without kitchen rounding (`convertMeasureExact`), so the scorer can tell an answer that is closer to the truth than the rounded reference from one that is wrong.
- `split`: every third source case is `test` (20 cases), the rest `tune` (40). Tuning runs use `--split tune`; test is only reported.
- Tags: `mass`, `volume`, `temperature`, `density`, `fraction`, `range`, `ambiguous`, `no-conversion`, plus `length` for tin sizes (both length cases are in tune).

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
| `tools` | Naive tool calling into the deterministic library: mass, volume, temperature, length, and "copy the tool's unit". No density data. Kept unchanged as a record of the first design. |
| `tools-policy` | The same four tools with a target-unit policy, tool descriptions that say what not to use each tool for, and tool names that match the prompt. No density data: the model estimates millilitres and calls the volume tool. |
| `tools-density` | `tools-policy` plus a density lookup tool, so grams of flour or butter become cups or tbsp from a fixed table. |
| `few-shot` | `tools-density` plus seven worked examples showing the tool call for each. Tests guarantee none of their lines or ingredients appear in the dataset and that every example agrees with the library. |

Each variant runs on a cheap and a strong model (defaults: Claude Haiku 5.5 and Claude Sonnet 5.5, via OpenRouter or the Anthropic API depending on which key is set; override with `MODEL_CHEAP`, `MODEL_STRONG` or `--model`).

### Scoring

`evals/scorers.ts` is deterministic, no LLM judge:

- **Unit** must match exactly.
- **Quantity** must be within tolerance in that unit, of either the rounded reference or the unrounded value: 10 percent for mass and volume (kitchen rounding legitimately differs, for example 1 2/3 vs 1 3/4 cups), 10 °F for temperatures, 1/2 inch for lengths, exact for counts. Against the rounded reference a small absolute floor (0.13) covers its coarsest rounding step; against the unrounded value there is no floor, so 1/3 cup for 100 ml (21% under) still fails. A range must be answered as a range.
- **Ingredient** is compared after normalisation: lowercase, accents and plurals stripped, UK names mapped to US names ("double cream" to "heavy cream", "plain flour" to "all-purpose flour", broth and stock treated as the same), and one token set must contain the other.
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
  results.ts           per-case result type, per-split summaries
  run.ts               eval runner (variant x model x split)
  rescore.ts           re-score saved traces without model calls
  promptfoo/           Promptfoo provider, tests and assertion
docs/
  error-analysis.md    failure causes from the first run, and the eval fixes
  results/             final summaries for both models
promptfooconfig.yaml
.github/workflows/ci.yml   typecheck, lint, tests; evals only when a key secret exists
```

## Limitations and next steps

- Single-line cases only; multi-line recipes are supported by the schema but not yet in the eval set.
- The density table uses typical kitchen values. Real flour weight per cup varies with how it is scooped, which is exactly why the tolerance is 10 percent.
- The test split is 20 cases and each configuration was run once, so differences of one or two cases are within noise. Next: repeat runs to report variance, a fresh held-out set written after tuning, multi-line recipe cases, and an LLM judge for ingredient naming compared against the token-overlap scorer.

## License

MIT
