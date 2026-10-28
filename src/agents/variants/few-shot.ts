import { toolsDensity } from './tools-density.ts';
import type { VariantConfig } from '../types.ts';

/**
 * Worked examples, written in the same UK style as the eval set but with
 * ingredients and amounts that do not appear in it. A unit test enforces
 * that none of these lines is in evals/dataset.jsonl and that every output
 * agrees with the deterministic library.
 */
export const FEW_SHOT_EXAMPLES = [
  {
    input: '350g floury potatoes, peeled',
    tool: 'convert-mass {"grams":350}',
    output: { quantity: 12.5, unit: 'oz', ingredient: 'floury potatoes', note: 'peeled' },
  },
  {
    input: '75g unsalted butter, melted',
    tool: 'convert-by-density {"ingredient":"unsalted butter","grams":75}',
    output: { quantity: 5.5, unit: 'tbsp', ingredient: 'unsalted butter', note: 'melted, about 3/4 stick' },
  },
  {
    input: '150g wholemeal flour',
    tool: 'convert-by-density {"ingredient":"wholemeal flour","grams":150}',
    output: { quantity: 1.25, unit: 'cup', ingredient: 'whole wheat flour' },
  },
  {
    input: '300-350g green beans, trimmed',
    tool: 'convert-mass {"grams":300,"gramsMax":350}',
    output: { quantity: { min: 10.5, max: 12.5 }, unit: 'oz', ingredient: 'green beans', note: 'trimmed' },
  },
  {
    input: '1 x 200ml carton coconut cream',
    tool: 'convert-volume {"ml":200,"packaged":true}',
    output: { quantity: 7, unit: 'fl oz', ingredient: 'coconut cream', note: '1 carton' },
  },
  {
    input: 'Heat oven to 160C/140C fan/gas 3',
    tool: 'convert-temperature {"celsius":160,"context":"oven"}',
    output: { quantity: 325, unit: '°F', ingredient: 'oven' },
  },
  {
    input: '3 garlic cloves, crushed',
    tool: 'none',
    output: { quantity: 3, unit: 'count', ingredient: 'garlic cloves', note: 'crushed' },
  },
] as const;

const examplesText = FEW_SHOT_EXAMPLES.map(
  (example) => `Input: ${example.input}\nTool: ${example.tool}\nOutput: ${JSON.stringify(example.output)}`,
).join('\n\n');

/** Tools and density lookup, plus worked examples of the tricky cases. */
export const fewShot: VariantConfig = {
  id: 'few-shot',
  description: 'Tools and density lookup plus worked examples',
  instructions: `${toolsDensity.instructions}\n\nExamples (original and confidence omitted):\n\n${examplesText}`,
  tools: toolsDensity.tools,
};
