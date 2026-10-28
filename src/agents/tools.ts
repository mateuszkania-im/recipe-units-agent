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

export const convertMassTool = createTool({
  id: 'convert-mass',
  description:
    'Convert a weight in grams to oz or lb with kitchen rounding. Does not know ingredient densities. Set packaged for tins, cans and packs.',
  inputSchema: z.object({
    grams: z.number().positive(),
    gramsMax: z.number().positive().optional().describe('Upper end of a range'),
    packaged: z.boolean().optional(),
  }),
  outputSchema: ToolResultSchema,
  execute: async ({ grams, gramsMax, packaged }) =>
    Promise.resolve(present(convertMeasure({ kind: 'mass', grams: toRange(grams, gramsMax), packaged: packaged ?? false }))),
});

export const convertVolumeTool = createTool({
  id: 'convert-volume',
  description: 'Convert millilitres to tsp, tbsp or cups. Set packaged for cans and bottles to get fl oz.',
  inputSchema: z.object({
    ml: z.number().positive(),
    mlMax: z.number().positive().optional().describe('Upper end of a range'),
    packaged: z.boolean().optional(),
  }),
  outputSchema: ToolResultSchema,
  execute: async ({ ml, mlMax, packaged }) =>
    Promise.resolve(present(convertMeasure({ kind: 'volume', ml: toRange(ml, mlMax), packaged: packaged ?? false }))),
});

export const convertTemperatureTool = createTool({
  id: 'convert-temperature',
  description: 'Convert Celsius or a gas mark to Fahrenheit. Ovens round to 25 °F, other uses to 5 °F.',
  inputSchema: z.object({
    celsius: z.number().optional(),
    gasMark: z.number().optional(),
    context: z.enum(['oven', 'other']),
  }),
  outputSchema: ToolResultSchema,
  execute: async ({ celsius, gasMark, context }) => {
    if (gasMark !== undefined) return Promise.resolve(present(convertMeasure({ kind: 'gas-mark', mark: gasMark })));
    if (celsius === undefined) throw new Error('Provide celsius or gasMark');
    return Promise.resolve(present(convertMeasure({ kind: 'temperature', celsius, context })));
  },
});

export const convertLengthTool = createTool({
  id: 'convert-length',
  description: 'Convert centimetres to inches. Tins and pans round to whole inches.',
  inputSchema: z.object({ cm: z.number().positive(), context: z.enum(['tin', 'size']) }),
  outputSchema: ToolResultSchema,
  execute: async ({ cm, context }) => Promise.resolve(present(convertMeasure({ kind: 'length', cm, context }))),
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

export const unitTools = {
  convertMassTool,
  convertVolumeTool,
  convertTemperatureTool,
  convertLengthTool,
};
