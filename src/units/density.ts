/**
 * Approximate grams per US cup (236.6 ml) for common baking ingredients.
 * Values are typical kitchen figures for spooned and levelled dry goods,
 * packed brown sugar, and liquids at room temperature.
 */
export interface DensityEntry {
  /** Canonical ingredient name used in outputs. */
  readonly name: string;
  readonly gramsPerCup: number;
  /** Words that identify the ingredient in a recipe line. */
  readonly aliases: readonly string[];
  /** Butter is measured in tablespoons and sticks rather than cups. */
  readonly measuredIn: 'cup' | 'tbsp';
}

export const DENSITY_TABLE: readonly DensityEntry[] = [
  { name: 'all-purpose flour', gramsPerCup: 125, aliases: ['plain flour', 'all-purpose flour', 'flour'], measuredIn: 'cup' },
  { name: 'self-rising flour', gramsPerCup: 125, aliases: ['self-raising flour', 'self-rising flour'], measuredIn: 'cup' },
  { name: 'bread flour', gramsPerCup: 130, aliases: ['strong white flour', 'bread flour', 'strong flour'], measuredIn: 'cup' },
  { name: 'whole wheat flour', gramsPerCup: 120, aliases: ['wholemeal flour', 'whole wheat flour'], measuredIn: 'cup' },
  { name: 'superfine sugar', gramsPerCup: 200, aliases: ['caster sugar', 'superfine sugar'], measuredIn: 'cup' },
  { name: 'granulated sugar', gramsPerCup: 200, aliases: ['granulated sugar', 'white sugar', 'sugar'], measuredIn: 'cup' },
  { name: 'brown sugar', gramsPerCup: 220, aliases: ['light brown soft sugar', 'dark brown soft sugar', 'light brown sugar', 'dark brown sugar', 'soft brown sugar', 'muscovado sugar', 'brown sugar'], measuredIn: 'cup' },
  { name: 'powdered sugar', gramsPerCup: 120, aliases: ['icing sugar', 'powdered sugar', "confectioners' sugar"], measuredIn: 'cup' },
  { name: 'unsweetened cocoa powder', gramsPerCup: 85, aliases: ['cocoa powder', 'cocoa'], measuredIn: 'cup' },
  { name: 'almond flour', gramsPerCup: 96, aliases: ['ground almonds', 'almond flour', 'almond meal'], measuredIn: 'cup' },
  { name: 'rolled oats', gramsPerCup: 90, aliases: ['porridge oats', 'rolled oats', 'oats'], measuredIn: 'cup' },
  { name: 'long-grain rice', gramsPerCup: 185, aliases: ['basmati rice', 'long-grain rice', 'jasmine rice', 'rice'], measuredIn: 'cup' },
  { name: 'butter', gramsPerCup: 227, aliases: ['unsalted butter', 'salted butter', 'butter'], measuredIn: 'tbsp' },
  { name: 'honey', gramsPerCup: 340, aliases: ['runny honey', 'clear honey', 'honey'], measuredIn: 'cup' },
  { name: 'maple syrup', gramsPerCup: 315, aliases: ['maple syrup'], measuredIn: 'cup' },
  { name: 'milk', gramsPerCup: 245, aliases: ['whole milk', 'semi-skimmed milk', 'milk'], measuredIn: 'cup' },
];

function containsWords(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${escaped}($|[^a-z])`).test(text);
}

/**
 * Finds the entry whose longest alias appears in the text as whole words
 * (case-insensitive), so "butternut squash" does not match "butter".
 */
export function lookupDensity(ingredient: string): DensityEntry | undefined {
  const text = ingredient.toLowerCase();
  let best: { entry: DensityEntry; length: number } | undefined;
  for (const entry of DENSITY_TABLE) {
    for (const alias of entry.aliases) {
      if (containsWords(text, alias) && (!best || alias.length > best.length)) {
        best = { entry, length: alias.length };
      }
    }
  }
  return best?.entry;
}
