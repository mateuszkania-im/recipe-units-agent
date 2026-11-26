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

/**
 * Words that describe the state, grade or packing of an ingredient without
 * changing what it is. Only these may come before a matched alias, so
 * "softened butter" is butter but "peanut butter" and "coconut milk" are not.
 */
const DESCRIPTORS = new Set([
  'chilled', 'cold', 'cubed', 'dark', 'diced', 'extra', 'fine', 'finely', 'firmly', 'fresh', 'full-fat', 'golden',
  'good', 'good-quality', 'hot', 'light', 'lightly', 'loosely', 'melted', 'old-fashioned', 'organic', 'packed', 'pure',
  'room-temperature', 'semi-skimmed', 'sifted', 'skimmed', 'softened', 'strong', 'unbleached', 'unrefined', 'unsweetened',
  'warm', 'white', 'whole',
]);

/**
 * The words that name the ingredient itself: lowercased, without notes after
 * a comma, a bracket or "for" ("butter, softened", "oats (rolled)", "flour
 * for dusting"), without a
 * leading measure such as "a knob of" and without amounts such as "250g".
 */
function ingredientWords(ingredient: string): string[] {
  const core = ingredient.toLowerCase().split(/[,(]|\bfor\b/, 1)[0] ?? '';
  const afterOf = core.split(/\bof\b/).pop() ?? '';
  return afterOf.split(/\s+/).filter((word) => word !== '' && !/\d/.test(word));
}

const ALIAS_WORDS = DENSITY_TABLE.flatMap((entry) => entry.aliases.map((alias) => ({ entry, words: alias.split(' ') })));

/**
 * Finds the entry for an ingredient. An alias must end the ingredient's name,
 * because in English the last word is the head noun ("milk chocolate" is
 * chocolate), and any words before it must be descriptors. The longest such
 * alias wins, so "self-raising flour" beats "flour". Words are compared
 * whole, so "butternut squash" does not match "butter".
 */
export function lookupDensity(ingredient: string): DensityEntry | undefined {
  const words = ingredientWords(ingredient);
  let best: { entry: DensityEntry; length: number } | undefined;
  for (const { entry, words: alias } of ALIAS_WORDS) {
    const start = words.length - alias.length;
    if (start < 0 || (best && alias.length <= best.length)) continue;
    const endsWithAlias = alias.every((word, i) => words[start + i] === word);
    if (endsWithAlias && words.slice(0, start).every((word) => DESCRIPTORS.has(word))) {
      best = { entry, length: alias.length };
    }
  }
  return best?.entry;
}
