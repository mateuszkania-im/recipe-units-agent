import { toolsDensity } from './tools-density.ts';
import type { VariantConfig } from '../types.ts';

/**
 * Worked examples. None of these lines appear in evals/dataset.jsonl;
 * a unit test enforces that to keep the eval free of leakage.
 */
export const FEW_SHOT_EXAMPLES = [
  {
    input: '350g floury potatoes, peeled',
    output: { quantity: 12.5, unit: 'oz', ingredient: 'floury potatoes', note: 'peeled' },
  },
  {
    input: '75g unsalted butter, melted',
    output: { quantity: 5.5, unit: 'tbsp', ingredient: 'unsalted butter', note: 'melted, about 3/4 stick' },
  },
  {
    input: '1 x 200ml carton coconut cream',
    output: { quantity: 7, unit: 'fl oz', ingredient: 'coconut cream', note: '1 carton' },
  },
  {
    input: 'Heat oven to 160C/140C fan/gas 3',
    output: { quantity: 325, unit: '°F', ingredient: 'oven' },
  },
  {
    input: '3 garlic cloves, crushed',
    output: { quantity: 3, unit: 'count', ingredient: 'garlic cloves', note: 'crushed' },
  },
] as const;

const examplesText = FEW_SHOT_EXAMPLES.map(
  (example) => `Input: ${example.input}\nOutput: ${JSON.stringify(example.output)}`,
).join('\n\n');

/** Tools and density lookup, plus worked examples of the tricky cases. */
export const fewShot: VariantConfig = {
  id: 'few-shot',
  description: 'Tools and density lookup plus worked examples',
  instructions: `${toolsDensity.instructions}\n\nExamples (original and confidence omitted):\n\n${examplesText}`,
  tools: toolsDensity.tools,
};
