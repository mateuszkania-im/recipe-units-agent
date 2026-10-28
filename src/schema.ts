import { z } from 'zod';

/** A single number, or an inclusive range such as "200-250 g". */
export const QuantitySchema = z.union([
  z.number().nonnegative(),
  z.object({ min: z.number().nonnegative(), max: z.number().nonnegative() }),
]);
export type Quantity = z.infer<typeof QuantitySchema>;

/**
 * US units the agent may answer with. `count` and `pinch` mark lines that
 * need no conversion ("2 large eggs", "a pinch of salt").
 */
export const US_UNITS = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'fl oz', '°F', 'inch', 'count', 'pinch'] as const;
export const USUnitSchema = z.enum(US_UNITS);
export type USUnit = z.infer<typeof USUnitSchema>;

/** Input: one recipe line, or a small recipe. */
export const RecipeInputSchema = z.union([
  z.string().min(1),
  z.object({
    ingredients: z.array(z.string().min(1)).default([]),
    ovenTemperature: z.string().optional(),
    tinSize: z.string().optional(),
  }),
]);
export type RecipeInput = z.input<typeof RecipeInputSchema>;

export const ConvertedLineSchema = z.object({
  original: z.string().describe('The input line, verbatim'),
  quantity: QuantitySchema.describe('Converted amount as a decimal, or {min,max} for a range'),
  unit: USUnitSchema,
  ingredient: z.string().describe('Ingredient or item, without quantity or unit'),
  note: z.string().optional().describe('Short helpful note, for example "about 1 stick"'),
  confidence: z.number().min(0).max(1),
});
export type ConvertedLine = z.infer<typeof ConvertedLineSchema>;

export const ConversionOutputSchema = z.object({
  lines: z.array(ConvertedLineSchema),
});
export type ConversionOutput = z.infer<typeof ConversionOutputSchema>;

/** Flattens either input shape into the lines the agent should convert. */
export function toLines(input: RecipeInput): string[] {
  const parsed = RecipeInputSchema.parse(input);
  if (typeof parsed === 'string') return [parsed];
  const extras = [parsed.ovenTemperature, parsed.tinSize].filter((line): line is string => line !== undefined);
  return [...parsed.ingredients, ...extras];
}
