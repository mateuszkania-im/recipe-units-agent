# Error analysis: first full run

Run analysed: `results/2026-10-28T14-18-37-356Z` (not committed; `results/` is git-ignored). Model: Claude Haiku 5.5 (`anthropic/claude-haiku-5-5`). All 60 cases, before any prompt tuning and before the held-out split existed.

| Variant | Accuracy as first scored | Failures | Cost |
| --- | --- | --- | --- |
| baseline | 86.7% (52/60) | 8 | $0.0197 |
| tools | 73.3% (44/60) | 16 | $0.0466 |

I read every failing trace (input, expected, prediction, every tool call with arguments and result) and gave each failure one primary cause. A case that is wrong in two ways is counted once, under the cause that decided it, with the second problem noted.

## Failures by cause

| Cause | baseline | tools | Whose fault |
| --- | --- | --- | --- |
| Wrong tool / wrong unit target (oz or cups where the policy wants cups or tbsp) | 0 | 15 | agent design |
| Density estimate differs from the reference table | 2 | 1 | model (no density data) |
| Rounding to the cup grid | 4 | 0 | 2 model, 2 eval |
| Ingredient naming | 2 | 0 | eval |
| Parsing ranges | 0 | 0 | none |
| Dataset ambiguity (expected value wrong) | 0 | 0 | none found |
| **Total** | **8** | **16** | |

Ranges were parsed correctly in every case: all four range lines came back as `{min, max}` in one unit. The range failures (range-01, range-03) are rounding or wrong-unit failures and are counted there.

### 1. Wrong tool / wrong unit target (tools: 15)

The `tools` variant has unit tools for mass, volume, temperature and length but no density data. Its prompt has two instructions that cannot both be followed for a line like "250g plain flour":

- the shared rules say baking staples given by weight become cups or spoons, and butter becomes tablespoons;
- the tool guidance says "Do not do unit arithmetic yourself. Call the matching conversion tool, and copy its quantity and unit into your answer."

The only tool that accepts grams is `convert-mass`, whose description says it does not know densities and which returns oz or lb. The model followed the later, more specific instruction in 14 of 15 cases: it called the mass tool and copied the oz answer. That is why the density tag fell from 72.2% to 11.1% and unit match from 100% to 75%.

- `density-01` "250g plain flour": expected 2 cup. Called `convertMassTool({grams: 250})`, got 9 oz, answered 9 oz.
- `density-14` "250g unsalted butter, softened": expected 17.5 tbsp ("about 2 1/4 sticks"). Called the mass tool, answered 9 oz.
- `range-01` "200-250g plain flour": expected 1 2/3 to 2 cup. Called `convertMassTool({grams: 200, gramsMax: 250})`, answered 7 to 9 oz. The range itself was parsed perfectly.

One case went the other way and still missed the unit policy: `density-15` "115g butter" was turned into 118 ml by the model and sent to the volume tool, which answered 1/2 cup. That is the right amount (8 tbsp is 1/2 cup), but the policy says butter is given in tablespoons.

Telling detail: in the two density cases that passed (`density-04`, `density-10`), the model called the mass tool, noticed that oz was not what the rules asked for, ignored the tool and estimated cups itself, with a note saying the tool "does not know ingredient density". So the model can see the conflict; it just resolves it the wrong way most of the time.

Also noted: `density-13` "350g granulated sugar" was renamed to "superfine sugar" on top of the wrong unit. A genuine naming error, but the unit had already failed the case.

A related bug found while reading the traces: tool names. Mastra exposes each tool under its key in the `tools` object, so the model saw `convertMassTool`, `densityLookupTool` and so on, while the instructions (and the tool descriptions) refer to `convert-mass` and `convert-by-density`. It did not cause a failure in this run (the `tools` prompt names no tool), but the `tools-density` prompt says "try convert-by-density first", a name the model never sees.

### 2. Density estimate differs from the reference table (baseline 2, tools 1)

Without the density table the model uses its own grams-per-cup figure. Some of those are published figures, just not the ones in `src/units/density.ts`.

- `density-06` "100g porridge oats": expected 1 cup (table: 90 g/cup, exact 1.11 cup). Baseline said 1 1/4 cup, which implies 80 g/cup. 12.6% off the exact value.
- `density-10` "500g strong white bread flour": expected 3 3/4 cup (table: 130 g/cup, exact 3.85). Baseline said 4 1/4 cup, which implies about 118 g/cup, a figure some US sources use for bread flour. 10.5% off.
- `density-11` (tools) "15g caster sugar": expected 1 tbsp (exact 1.2 tbsp). The model estimated 18.75 ml itself, sent it to the volume tool and got 1 1/2 tbsp.

I did not change the table. Flour density genuinely varies with how it is scooped, the table is a documented policy, and the point of the `tools-density` variant is to give the model that policy instead of letting it guess. These stay as model failures.

### 3. Rounding to the cup grid (baseline 4: 2 eval, 2 model)

Volumes are rounded to whole cups plus quarters and thirds. Two failures were the eval's fault: the reference was rounded first and the 10% tolerance was applied to the rounded number, so an answer could be closer to the true amount than the reference and still fail.

- `range-01` "200-250g plain flour": true value 1.6 to 2 cups, reference 1 2/3 to 2. Baseline answered 1 1/2 to 2. 1 1/2 is 6% from 1.6 but exactly 10.0% from 1 2/3, and failed on floating point. **Eval fault.**
- `density-03` "175g self-raising flour": true value 1.4 cups, reference 1 1/3. Baseline answered 1 1/2, 7% from the true value, 12.5% from the reference. **Eval fault.**
- `volume-02` "100ml double cream": true value 0.42 cup, reference 1/2. Baseline answered 1/3 cup, 21% under the true amount. **Model fault**: 1/2 is the nearer grid point.
- `range-03` "100-150ml milk": same 100 ml lower end, answered 1/3 instead of 1/2. **Model fault.**

### 4. Ingredient naming (baseline 2, both eval)

Both were valid US names that the scorer's synonym list did not know.

- `volume-04` "1 litre chicken stock": baseline answered "chicken broth". US recipes and shops use broth and stock interchangeably for the boxed product. **Eval fault.**
- `density-08` "100g ground almonds": baseline answered "almond meal". UK ground almonds are at least as close to US almond meal as to almond flour. **Eval fault.**

### 5. Dataset ambiguity

I checked every expected value that a failure touched against the deterministic library and against kitchen common sense. None was wrong. The ambiguity was in how answers were scored (causes 3 and 4), not in the expected values themselves.

## What I changed in the eval, and why it is not flattering

All changes go through the generator (`pnpm dataset:build`) and the scorer, apply to every variant equally, and are covered by unit tests.

1. **Unrounded reference values.** `convertMeasureExact` in `src/units/convert.ts` computes the same conversion without kitchen rounding, and the generator stores it as `expected.exact`. The scorer passes a quantity that is within tolerance of the rounded reference or within 10% of the exact value. The exact comparison deliberately has no absolute floor, so 1/3 cup for 100 ml (21% under) still fails.
2. **Synonyms.** `broth` and `stock` are treated as the same item; `almond meal` is an alias of almond flour in the density table (which the scorer uses to canonicalise names).
3. **Held-out split.** Every third source case is now `split: "test"` (20 cases), the rest `tune` (40). The rule is mechanical and spreads the test split across every group in `evals/cases.ts`. Both `length` cases land in tune. Honest caveat: this first error analysis read all 60 cases before the split existed, so the test split is held out from the tuning rounds, not from my eyes entirely. From here on, tuning runs use `--split tune` only.

Effect on the same saved predictions (`pnpm eval:rescore results/2026-10-28T14-18-37-356Z`), no model calls:

| Variant | Before | After | Cases that flipped |
| --- | --- | --- | --- |
| baseline | 86.7% | 93.3% | density-03, range-01 (rounding); density-08, volume-04 (naming) |
| tools | 73.3% | 73.3% | none |

The fixes help the baseline, not the tool variants, which makes the comparison harder for the tools, not easier.

## What this says to change in the agent

1. **Remove the instruction conflict.** Decide the target unit before choosing a tool, and say it explicitly: baking staples and butter by weight go to volume (cups or tbsp), never oz. "Copy the tool's unit" is only correct when the tool was the right one.
2. **Give the tool-only variant a way to reach volume.** Without density data the honest path is: estimate millilitres from typical grams per cup, then call the volume tool so the rounding is still deterministic.
3. **Make the density path discoverable.** Expose tools under the names the instructions use, and describe in each tool description what it must not be used for.
4. **Butter is tablespoons**, even when the volume tool would say 1/2 cup.
5. **Rounding**: tell the model to pick the nearest grid point (the tools already do this for the tool variants).

The baseline prompt stays exactly as it is, so it remains a fixed reference point.
