import { describe, expect, it } from 'vitest';
import type { ConvertedLine } from '../src/schema.ts';
import { aggregate, ingredientMatches, scoreCase, withinTolerance } from './scorers.ts';

const line = (overrides: Partial<ConvertedLine>): ConvertedLine => ({
  original: 'x',
  quantity: 1,
  unit: 'cup',
  ingredient: 'all-purpose flour',
  confidence: 0.9,
  ...overrides,
});

describe('ingredientMatches', () => {
  it('maps UK names to US names', () => {
    expect(ingredientMatches('all-purpose flour', 'plain flour')).toBe(true);
    expect(ingredientMatches('heavy cream', 'double cream')).toBe(true);
    expect(ingredientMatches('zucchini', 'courgettes')).toBe(true);
    expect(ingredientMatches('almond flour', 'ground almonds')).toBe(true);
    expect(ingredientMatches('almond flour', 'almond meal')).toBe(true);
    expect(ingredientMatches('chicken stock', 'chicken broth')).toBe(true);
  });

  it('accepts a shorter or longer phrase of the same item', () => {
    expect(ingredientMatches('rolled oats', 'oats')).toBe(true);
    expect(ingredientMatches('mushrooms', 'chestnut mushrooms')).toBe(true);
  });

  it('rejects different ingredients', () => {
    expect(ingredientMatches('butter', 'butternut squash')).toBe(false);
    expect(ingredientMatches('chickpeas', 'chopped tomatoes')).toBe(false);
  });
});

describe('withinTolerance', () => {
  it('allows 10 percent on mass and volume', () => {
    expect(withinTolerance(1.75, 1.66, 'cup')).toBe(true);
    expect(withinTolerance(1.75, 1.5, 'cup')).toBe(false);
  });

  it('allows 10 °F on temperatures', () => {
    expect(withinTolerance(350, 356, '°F')).toBe(true);
    expect(withinTolerance(350, 375, '°F')).toBe(false);
  });

  it('requires exact counts', () => {
    expect(withinTolerance(2, 3, 'count')).toBe(false);
  });
});

describe('scoreCase', () => {
  const expected = { quantity: 2, unit: 'cup' as const, ingredient: 'all-purpose flour' };

  it('passes a correct answer', () => {
    expect(scoreCase(expected, line({ quantity: 2, ingredient: 'plain flour' })).pass).toBe(true);
  });

  it('fails on a unit mismatch even if the number is close', () => {
    const score = scoreCase(expected, line({ quantity: 2, unit: 'oz' }));
    expect(score).toMatchObject({ unit: false, quantity: false, pass: false });
  });

  it('requires a range when a range is expected', () => {
    const range = { quantity: { min: 1.6667, max: 2 }, unit: 'cup' as const, ingredient: 'flour' };
    expect(scoreCase(range, line({ quantity: 2 })).pass).toBe(false);
    expect(scoreCase(range, line({ quantity: { min: 1.75, max: 2 } })).pass).toBe(true);
  });

  it('accepts an answer close to the unrounded value when the reference rounds away from it', () => {
    const flour = { quantity: { min: 1.6667, max: 2 }, exact: { min: 1.6, max: 2 }, unit: 'cup' as const, ingredient: 'flour' };
    expect(scoreCase(flour, line({ quantity: { min: 1.5, max: 2 } })).pass).toBe(true);
    const cream = { quantity: 0.5, exact: 0.4227, unit: 'cup' as const, ingredient: 'heavy cream' };
    expect(scoreCase(cream, line({ quantity: 0.4, ingredient: 'heavy cream' })).pass).toBe(true);
    expect(scoreCase(cream, line({ quantity: 1 / 3, ingredient: 'heavy cream' })).pass).toBe(false);
  });

  it('fails a missing line', () => {
    expect(scoreCase(expected, undefined).pass).toBe(false);
  });
});

describe('aggregate', () => {
  it('reports overall and per-tag accuracy', () => {
    const ok = { quantity: true, unit: true, ingredient: true, pass: true };
    const bad = { quantity: false, unit: true, ingredient: true, pass: false };
    const result = aggregate([
      { tags: ['mass'], score: ok },
      { tags: ['mass', 'range'], score: bad },
    ]);
    expect(result.overall.pass).toBe(0.5);
    expect(result.byTag.mass?.pass).toBe(0.5);
    expect(result.byTag.range?.pass).toBe(0);
    expect(result.byTag.range?.unit).toBe(1);
  });
});
