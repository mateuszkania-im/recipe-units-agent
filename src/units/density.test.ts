import { describe, expect, it } from 'vitest';
import { lookupDensity } from './density.ts';

describe('lookupDensity', () => {
  it('prefers the most specific alias', () => {
    expect(lookupDensity('self-raising flour')?.name).toBe('self-rising flour');
    expect(lookupDensity('plain flour')?.name).toBe('all-purpose flour');
    expect(lookupDensity('light brown sugar')?.name).toBe('brown sugar');
    expect(lookupDensity('caster sugar')?.name).toBe('superfine sugar');
  });

  it('flags butter as measured in tablespoons', () => {
    expect(lookupDensity('unsalted butter, softened')?.measuredIn).toBe('tbsp');
  });

  it('returns undefined for unknown ingredients', () => {
    expect(lookupDensity('potatoes')).toBeUndefined();
  });

  it('matches whole words only', () => {
    expect(lookupDensity('butternut squash')).toBeUndefined();
    expect(lookupDensity('cornflour')).toBeUndefined();
  });
});
