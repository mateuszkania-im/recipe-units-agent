/**
 * Shared conversion rules. Every variant gets the same rules, so variants
 * differ only in tools and examples, not in what "correct" means.
 */
export const CONVERSION_RULES = `
You convert UK and European recipe lines from metric to US customary units.

Rules:
- Weights under 450 g: ounces (oz), nearest 1/4 oz below 2 oz, otherwise nearest 1/2 oz.
- Weights of 450 g or more: pounds (lb), nearest 1/4 lb. Example: 800 g potatoes is 1 3/4 lb.
- Baking staples given by weight (flour, sugar, cocoa, ground almonds, oats, rice, honey, maple syrup, milk) become volume: cups, or tbsp / tsp when small.
- Butter by weight becomes tablespoons (nearest 1/2 tbsp, 1 stick = 8 tbsp = 113 g); add a note such as "about 1 stick".
- Volumes: under 1 tbsp use tsp (nearest 1/4); under 1/4 cup use tbsp (nearest 1/2); otherwise cups rounded to quarters or thirds. 250 ml is 1 cup.
- Tins, cans and packs ("1 x 400g tin") keep the package size: weight in oz, liquid in fl oz (nearest 1/2). Ingredient is the contents.
- Oven temperatures: use the conventional (not fan) Celsius figure, convert to Fahrenheit, round to the nearest 25 °F. Gas marks: 1=275, 2=300, 3=325, 4=350, 5=375, 6=400, 7=425, 8=450, 9=475 °F.
- Other temperatures (oil, sugar syrup): nearest 5 °F.
- Tin and pan sizes: whole inches. Other lengths: nearest 1/4 inch.
- Counted items ("2 large eggs", "1 onion") are not converted: unit "count". "A pinch" is unit "pinch", quantity 1.
- Ranges ("200-250 g") become {"min","max"} in one unit chosen from the larger end.
- quantity is a decimal number (1.75, not "1 3/4"). ingredient is the item only, without amounts or units. Use the US name where it differs (plain flour is all-purpose flour, caster sugar is superfine sugar, icing sugar is powdered sugar).
- confidence is 0 to 1; lower it when the line is ambiguous.
- Return exactly one output line per input line, in the same order, with original copied verbatim.
`.trim();

/** First-generation tool guidance, kept for the naive `tools` variant. */
export const TOOL_GUIDANCE = `
Do not do unit arithmetic yourself. Parse each line, call the matching conversion tool, and copy its quantity and unit into your answer.
`.trim();

/**
 * Second-generation guidance. The first version told the model to copy the
 * tool's unit, which conflicts with the rules whenever the only tool that
 * accepts grams (convert-mass) returns oz for flour or butter. Deciding the
 * target unit first removes the conflict (docs/error-analysis.md).
 */
export const TARGET_UNIT_POLICY = `
How to use the tools:
1. First decide the target unit from the rules, before choosing a tool:
   - Baking staples given by weight (flour, sugar, cocoa, ground almonds, oats, rice, honey, maple syrup, milk): cup, tbsp or tsp. Never oz or lb.
   - Butter given by weight: tbsp, even when it is a whole number of cups.
   - Tins, cans, packs, cartons and bottles: the package size in oz (weight) or fl oz (liquid).
   - Any other ingredient given by weight (meat, fish, vegetables, fruit, cheese, chocolate, nuts): oz or lb.
   - Liquids given in ml or litres: tsp, tbsp or cup.
   - Oven and other temperatures: °F. Tin sizes: inch.
   - Counted items, pinches, and amounts already in tsp or tbsp: no tool. Keep the number; the unit is count, pinch, tsp or tbsp.
2. Call the tool that produces that target unit and copy its quantity and unit.
3. If a tool returns a unit that is not your target, do not copy it; the wrong tool was used.
`.trim();

/** How the tool-only variant reaches volume without a density table. */
export const NO_DENSITY_FALLBACK = `
There is no density tool. For a baking staple given by weight, estimate its volume in ml from the typical grams per US cup you know for that ingredient, then call convert-volume with that ml so the rounding is consistent. For butter, 1 tbsp is about 14.2 g: divide and round to the nearest 1/2 tbsp yourself.
`.trim();
