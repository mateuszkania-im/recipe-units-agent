import { lookupDensity } from '../src/units/index.ts';
import type { ConvertedLine, Quantity, USUnit } from '../src/schema.ts';
import type { Expected } from './dataset.ts';

/** UK to US ingredient names, applied to both sides before comparison. */
const SYNONYMS: readonly (readonly [RegExp, string])[] = [
  [/\bbeef mince\b|\bminced beef\b/, 'ground beef'],
  [/\bcourgettes?\b/, 'zucchini'],
  [/\baubergines?\b/, 'eggplant'],
  [/\bdouble cream\b/, 'heavy cream'],
  [/\bsingle cream\b/, 'light cream'],
  [/\bcoriander\b/, 'cilantro'],
  [/\bspring onions?\b/, 'scallions'],
  [/\bpan\b/, 'tin'],
  [/\bbeer\b/, 'lager'],
];

const STOPWORDS = new Set(['of', 'a', 'an', 'the', 'and', 'fresh', 'in']);

/** Lowercase, apply synonyms and density-table names, drop stopwords and plurals. */
export function normaliseIngredient(raw: string): Set<string> {
  let text = raw.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  for (const [pattern, replacement] of SYNONYMS) text = text.replace(pattern, replacement);
  const canonical = lookupDensity(text)?.name;
  if (canonical) text = canonical;
  const tokens = text
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((token) => token !== '' && !STOPWORDS.has(token))
    .map((token) => (token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token));
  return new Set(tokens);
}

/** Matches when one token set contains the other ("oats" vs "rolled oats"). */
export function ingredientMatches(expected: string, predicted: string): boolean {
  const a = normaliseIngredient(expected);
  const b = normaliseIngredient(predicted);
  if (a.size === 0 || b.size === 0) return false;
  return [...a].every((t) => b.has(t)) || [...b].every((t) => a.has(t));
}

/**
 * Tolerance per unit. Kitchen rounding legitimately differs (1 2/3 vs 1 3/4
 * cups), so mass and volume allow 10 percent; temperatures allow 10 °F and
 * lengths half an inch.
 */
export function withinTolerance(expected: number, predicted: number, unit: USUnit): boolean {
  const diff = Math.abs(expected - predicted);
  if (unit === '°F') return diff <= 10;
  if (unit === 'inch') return diff <= 0.5;
  if (unit === 'count' || unit === 'pinch') return diff === 0;
  return diff <= Math.max(expected * 0.1, 0.13);
}

function quantityMatches(expected: Quantity, predicted: Quantity, unit: USUnit): boolean {
  if (typeof expected === 'number') {
    return typeof predicted === 'number' && withinTolerance(expected, predicted, unit);
  }
  return (
    typeof predicted !== 'number' &&
    withinTolerance(expected.min, predicted.min, unit) &&
    withinTolerance(expected.max, predicted.max, unit)
  );
}

export interface CaseScore {
  quantity: boolean;
  unit: boolean;
  ingredient: boolean;
  /** All three correct. This is the headline accuracy. */
  pass: boolean;
}

export function scoreCase(expected: Expected, predicted: ConvertedLine | undefined): CaseScore {
  if (!predicted) return { quantity: false, unit: false, ingredient: false, pass: false };
  const unit = expected.unit === predicted.unit;
  // A quantity only counts as correct in the expected unit, so pass implies unit.
  const quantity = unit && quantityMatches(expected.quantity, predicted.quantity, expected.unit);
  const ingredient = ingredientMatches(expected.ingredient, predicted.ingredient);
  return { quantity, unit, ingredient, pass: quantity && ingredient };
}

export interface ScoredCase {
  tags: readonly string[];
  score: CaseScore;
}

export interface Accuracy {
  n: number;
  pass: number;
  quantity: number;
  unit: number;
  ingredient: number;
}

function accuracyOf(cases: readonly ScoredCase[]): Accuracy {
  const rate = (pick: (s: CaseScore) => boolean): number =>
    cases.length === 0 ? 0 : cases.filter((c) => pick(c.score)).length / cases.length;
  return {
    n: cases.length,
    pass: rate((s) => s.pass),
    quantity: rate((s) => s.quantity),
    unit: rate((s) => s.unit),
    ingredient: rate((s) => s.ingredient),
  };
}

/** Overall accuracy plus a breakdown per tag. */
export function aggregate(cases: readonly ScoredCase[]): { overall: Accuracy; byTag: Record<string, Accuracy> } {
  const tags = [...new Set(cases.flatMap((c) => c.tags))].sort();
  const byTag = Object.fromEntries(tags.map((tag) => [tag, accuracyOf(cases.filter((c) => c.tags.includes(tag)))]));
  return { overall: accuracyOf(cases), byTag };
}
