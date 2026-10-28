/** Promptfoo javascript assertion delegating to the deterministic scorer. */
import { ConversionOutputSchema } from '../../src/schema.ts';
import { ExpectedSchema } from '../dataset.ts';
import { scoreCase } from '../scorers.ts';

interface AssertionContext {
  vars: Record<string, unknown>;
}

export default function assertConversion(output: unknown, context: AssertionContext) {
  const expected = ExpectedSchema.parse(context.vars.expected);
  const parsed = ConversionOutputSchema.safeParse(typeof output === 'string' ? JSON.parse(output) : output);
  if (!parsed.success) return { pass: false, score: 0, reason: 'Output does not match ConversionOutputSchema' };
  const score = scoreCase(expected, parsed.data.lines[0]);
  return {
    pass: score.pass,
    score: score.pass ? 1 : 0,
    reason: `quantity=${String(score.quantity)} unit=${String(score.unit)} ingredient=${String(score.ingredient)}`,
    namedScores: { quantity: Number(score.quantity), unit: Number(score.unit), ingredient: Number(score.ingredient) },
  };
}
