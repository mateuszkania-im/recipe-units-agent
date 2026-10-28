import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { QuantitySchema, USUnitSchema, type Quantity } from '../schema.ts';
import { convertMeasure, formatQuantity, lookupDensity, type USMeasure } from '../units/index.ts';

const ToolResultSchema = z.object({
  quantity: QuantitySchema,
  unit: USUnitSchema,
  display: z.string(),
  note: z.string().optional(),
});
type ToolResult = z.infer<typeof ToolResultSchema>;

function toRange(value: number, max: number | undefined): Quantity {
  return max === undefined ? value : { min: value, max };
}

function present(measure: USMeasure): ToolResult {
  const q = measure.quantity;
  const amount = typeof q === 'number' ? formatQuantity(q) : `${formatQuantity(q.min)}-${formatQuantity(q.max)}`;
  return { ...measure, display: `${amount} ${measure.unit}` };
}

const massInput = z.object({
  grams: z.number().positive(),
  gramsMax: z.number().positive().optional().describe('Upper end of a range'),
  packaged: z.boolean().optional(),
});
const executeMass = async ({ grams, gramsMax, packaged }: z.infer<typeof massInput>): Promise<ToolResult> =>
  Promise.resolve(present(convertMeasure({ kind: 'mass', grams: toRange(grams, gramsMax), packaged: packaged ?? false })));

const volumeInput = z.object({
  ml: z.number().positive(),
  mlMax: z.number().positive().optional().describe('Upper end of a range'),
  packaged: z.boolean().optional(),
});
const executeVolume = async ({ ml, mlMax, packaged }: z.infer<typeof volumeInput>): Promise<ToolResult> =>
  Promise.resolve(present(convertMeasure({ kind: 'volume', ml: toRange(ml, mlMax), packaged: packaged ?? false })));

const temperatureInput = z.object({
  celsius: z.number().optional(),
  gasMark: z.number().optional(),
  context: z.enum(['oven', 'other']),
});
const executeTemperature = async ({ celsius, gasMark, context }: z.infer<typeof temperatureInput>): Promise<ToolResult> => {
  if (gasMark !== undefined) return Promise.resolve(present(convertMeasure({ kind: 'gas-mark', mark: gasMark })));
  if (celsius === undefined) throw new Error('Provide celsius or gasMark');
  return Promise.resolve(present(convertMeasure({ kind: 'temperature', celsius, context })));
};

const lengthInput = z.object({ cm: z.number().positive(), context: z.enum(['tin', 'size']) });
const executeLength = async ({ cm, context }: z.infer<typeof lengthInput>): Promise<ToolResult> =>
  Promise.resolve(present(convertMeasure({ kind: 'length', cm, context })));

/*
 * First-generation tools, kept exactly as first measured so the `tools`
 * variant stays a fixed record of naive tool calling (see docs/error-analysis.md).
 * Mastra names a tool after its key, so the model sees "convertMassTool".
 */

export const convertMassTool = createTool({
  id: 'convert-mass',
  description:
    'Convert a weight in grams to oz or lb with kitchen rounding. Does not know ingredient densities. Set packaged for tins, cans and packs.',
  inputSchema: massInput,
  outputSchema: ToolResultSchema,
  execute: executeMass,
});

export const convertVolumeTool = createTool({
  id: 'convert-volume',
  description: 'Convert millilitres to tsp, tbsp or cups. Set packaged for cans and bottles to get fl oz.',
  inputSchema: volumeInput,
  outputSchema: ToolResultSchema,
  execute: executeVolume,
});

export const convertTemperatureTool = createTool({
  id: 'convert-temperature',
  description: 'Convert Celsius or a gas mark to Fahrenheit. Ovens round to 25 °F, other uses to 5 °F.',
  inputSchema: temperatureInput,
  outputSchema: ToolResultSchema,
  execute: executeTemperature,
});

export const convertLengthTool = createTool({
  id: 'convert-length',
  description: 'Convert centimetres to inches. Tins and pans round to whole inches.',
  inputSchema: lengthInput,
  outputSchema: ToolResultSchema,
  execute: executeLength,
});

export const densityLookupTool = createTool({
  id: 'convert-by-density',
  description:
    'Convert grams of a baking ingredient (flour, sugar, butter, oats, rice, honey...) to cups, tbsp or tsp using a density table. Returns found=false for ingredients not in the table; then use convert-mass.',
  inputSchema: z.object({
    ingredient: z.string(),
    grams: z.number().positive(),
    gramsMax: z.number().positive().optional(),
  }),
  outputSchema: ToolResultSchema.partial().extend({ found: z.boolean(), matched: z.string().optional() }),
  execute: async ({ ingredient, grams, gramsMax }) => {
    const entry = lookupDensity(ingredient);
    if (!entry) return Promise.resolve({ found: false });
    const result = present(convertMeasure({ kind: 'mass', grams: toRange(grams, gramsMax) }, entry.aliases[0] ?? entry.name));
    return Promise.resolve({ found: true, matched: entry.name, ...result });
  },
});

/** Naive tool set: original descriptions, keyed by variable name. */
export const naiveUnitTools = {
  convertMassTool,
  convertVolumeTool,
  convertTemperatureTool,
  convertLengthTool,
};

/*
 * Second-generation tools: the same code, but each description says what the
 * tool is for and what it must not be used for, and each is keyed by its id
 * so the names in the instructions match the names the model sees.
 */

const policyMassTool = createTool({
  id: 'convert-mass',
  description:
    'Grams to oz or lb, for ingredients a US cook weighs: meat, fish, vegetables, fruit, cheese, chocolate, nuts. Set packaged=true for tins, cans and packs (always oz). Do NOT use for baking staples (flour, sugar, cocoa, ground almonds, oats, rice, honey, syrup, milk) or butter: those are measured by volume in the US.',
  inputSchema: massInput,
  outputSchema: ToolResultSchema,
  execute: executeMass,
});

const policyVolumeTool = createTool({
  id: 'convert-volume',
  description:
    'Millilitres to tsp, tbsp or cups with kitchen rounding. Use for liquids given in ml or litres. Set packaged=true for cans, bottles and cartons to get fl oz.',
  inputSchema: volumeInput,
  outputSchema: ToolResultSchema,
  execute: executeVolume,
});

const policyTemperatureTool = createTool({
  id: 'convert-temperature',
  description:
    'Celsius or gas mark to Fahrenheit. context "oven" rounds to 25 °F (use the conventional, not the fan, figure); "other" (oil, sugar) rounds to 5 °F.',
  inputSchema: temperatureInput,
  outputSchema: ToolResultSchema,
  execute: executeTemperature,
});

const policyLengthTool = createTool({
  id: 'convert-length',
  description: 'Centimetres to inches. context "tin" for cake tins and baking pans (whole inches), "size" for anything else.',
  inputSchema: lengthInput,
  outputSchema: ToolResultSchema,
  execute: executeLength,
});

const policyDensityTool = createTool({
  id: 'convert-by-density',
  description:
    'Grams of a baking staple or butter to US volume: cups, tbsp or tsp (butter always tbsp, with a stick note). Use this, not convert-mass, for flour, sugar, cocoa, ground almonds, oats, rice, honey, maple syrup, milk and butter given by weight. Returns found=false when the ingredient is not in the table; only then use convert-mass.',
  inputSchema: densityLookupTool.inputSchema,
  outputSchema: densityLookupTool.outputSchema,
  execute: densityLookupTool.execute,
});

/** Policy-aware unit tools, keyed by the names the instructions use. */
export const unitTools = {
  'convert-mass': policyMassTool,
  'convert-volume': policyVolumeTool,
  'convert-temperature': policyTemperatureTool,
  'convert-length': policyLengthTool,
};

export const densityTools = { 'convert-by-density': policyDensityTool };
