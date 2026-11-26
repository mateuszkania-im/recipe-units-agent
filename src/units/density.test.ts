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

  it('matches on the head noun, not on a modifier word', () => {
    expect(lookupDensity('peanut butter')).toBeUndefined();
    expect(lookupDensity('milk chocolate')).toBeUndefined();
    expect(lookupDensity('coconut milk')).toBeUndefined();
    expect(lookupDensity('buttermilk')).toBeUndefined();
  });

  it('still allows descriptors and notes around a known ingredient', () => {
    expect(lookupDensity('softened butter')?.name).toBe('butter');
    expect(lookupDensity('cold unsalted butter, cubed')?.name).toBe('butter');
    expect(lookupDensity('a 25g knob of butter')?.name).toBe('butter');
    expect(lookupDensity('250g plain flour')?.name).toBe('all-purpose flour');
    expect(lookupDensity('flour for dusting')?.name).toBe('all-purpose flour');
    expect(lookupDensity('strong white bread flour')?.name).toBe('bread flour');
    expect(lookupDensity('unsweetened cocoa powder, sifted')?.name).toBe('unsweetened cocoa powder');
    expect(lookupDensity('porridge oats (rolled oats)')?.name).toBe('rolled oats');
    expect(lookupDensity('whole milk')?.name).toBe('milk');
  });
});
