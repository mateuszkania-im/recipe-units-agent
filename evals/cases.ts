import type { MetricMeasure } from '../src/units/index.ts';

export const TAGS = ['mass', 'volume', 'temperature', 'density', 'fraction', 'range', 'ambiguous', 'no-conversion', 'length'] as const;
export type Tag = (typeof TAGS)[number];

/**
 * Hand-written source cases. Each line is original wording written for this
 * project. `measure` is the human reading of the line; the expected US answer
 * is computed from it by the deterministic library (see build-dataset.ts).
 */
export interface SourceCase {
  id: string;
  input: string;
  measure: MetricMeasure;
  /** Expected ingredient, using the US name where it differs. */
  ingredient: string;
  tags: Tag[];
}

const oven = (celsius: number): MetricMeasure => ({ kind: 'temperature', celsius, context: 'oven' });

export const SOURCE_CASES: SourceCase[] = [
  // Mass, no density: oz and lb
  { id: 'mass-01', input: '800g new potatoes, halved', measure: { kind: 'mass', grams: 800 }, ingredient: 'new potatoes', tags: ['mass', 'fraction'] },
  { id: 'mass-02', input: '1kg beef brisket', measure: { kind: 'mass', grams: 1000 }, ingredient: 'beef brisket', tags: ['mass', 'fraction'] },
  { id: 'mass-03', input: '200g cherry tomatoes, halved', measure: { kind: 'mass', grams: 200 }, ingredient: 'cherry tomatoes', tags: ['mass'] },
  { id: 'mass-04', input: '100g feta, crumbled', measure: { kind: 'mass', grams: 100 }, ingredient: 'feta', tags: ['mass', 'fraction'] },
  { id: 'mass-05', input: '500g lean beef mince', measure: { kind: 'mass', grams: 500 }, ingredient: 'ground beef', tags: ['mass'] },
  { id: 'mass-06', input: '250g chestnut mushrooms, sliced', measure: { kind: 'mass', grams: 250 }, ingredient: 'mushrooms', tags: ['mass'] },
  { id: 'mass-07', input: '2kg leg of lamb, bone in', measure: { kind: 'mass', grams: 2000 }, ingredient: 'leg of lamb', tags: ['mass', 'fraction'] },
  { id: 'mass-08', input: '150g smoked salmon trimmings', measure: { kind: 'mass', grams: 150 }, ingredient: 'smoked salmon', tags: ['mass', 'fraction'] },
  { id: 'mass-09', input: '30g parmesan, finely grated', measure: { kind: 'mass', grams: 30 }, ingredient: 'parmesan', tags: ['mass'] },
  { id: 'mass-10', input: '1.2kg whole chicken', measure: { kind: 'mass', grams: 1200 }, ingredient: 'whole chicken', tags: ['mass', 'fraction'] },
  { id: 'mass-11', input: '75g dark chocolate, roughly chopped', measure: { kind: 'mass', grams: 75 }, ingredient: 'dark chocolate', tags: ['mass', 'fraction'] },
  { id: 'mass-12', input: '10g fresh ginger, grated', measure: { kind: 'mass', grams: 10 }, ingredient: 'fresh ginger', tags: ['mass', 'fraction', 'ambiguous'] },
  { id: 'mass-13', input: '600g butternut squash, peeled and cubed', measure: { kind: 'mass', grams: 600 }, ingredient: 'butternut squash', tags: ['mass', 'fraction'] },
  { id: 'mass-14', input: '400g courgettes, sliced', measure: { kind: 'mass', grams: 400 }, ingredient: 'zucchini', tags: ['mass'] },

  // Mass with density: cups and spoons
  { id: 'density-01', input: '250g plain flour', measure: { kind: 'mass', grams: 250 }, ingredient: 'all-purpose flour', tags: ['density', 'mass'] },
  { id: 'density-02', input: '200g caster sugar', measure: { kind: 'mass', grams: 200 }, ingredient: 'superfine sugar', tags: ['density', 'mass'] },
  { id: 'density-03', input: '175g self-raising flour', measure: { kind: 'mass', grams: 175 }, ingredient: 'self-rising flour', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-04', input: '100g light brown soft sugar', measure: { kind: 'mass', grams: 100 }, ingredient: 'brown sugar', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-05', input: '50g cocoa powder, sifted', measure: { kind: 'mass', grams: 50 }, ingredient: 'cocoa powder', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-06', input: '100g porridge oats', measure: { kind: 'mass', grams: 100 }, ingredient: 'rolled oats', tags: ['density', 'mass'] },
  { id: 'density-07', input: '300g basmati rice, rinsed', measure: { kind: 'mass', grams: 300 }, ingredient: 'basmati rice', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-08', input: '100g ground almonds', measure: { kind: 'mass', grams: 100 }, ingredient: 'almond flour', tags: ['density', 'mass'] },
  { id: 'density-09', input: '125g icing sugar, plus extra for dusting', measure: { kind: 'mass', grams: 125 }, ingredient: 'powdered sugar', tags: ['density', 'mass'] },
  { id: 'density-10', input: '500g strong white bread flour', measure: { kind: 'mass', grams: 500 }, ingredient: 'bread flour', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-11', input: '15g caster sugar', measure: { kind: 'mass', grams: 15 }, ingredient: 'superfine sugar', tags: ['density', 'mass'] },
  { id: 'density-12', input: '60g honey', measure: { kind: 'mass', grams: 60 }, ingredient: 'honey', tags: ['density', 'mass'] },
  { id: 'density-13', input: '350g granulated sugar', measure: { kind: 'mass', grams: 350 }, ingredient: 'granulated sugar', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-14', input: '250g unsalted butter, softened', measure: { kind: 'mass', grams: 250 }, ingredient: 'unsalted butter', tags: ['density', 'mass', 'fraction'] },
  { id: 'density-15', input: '115g butter, at room temperature', measure: { kind: 'mass', grams: 115 }, ingredient: 'butter', tags: ['density', 'mass'] },
  { id: 'density-16', input: 'a 25g knob of butter', measure: { kind: 'mass', grams: 25 }, ingredient: 'butter', tags: ['density', 'mass', 'ambiguous'] },
  { id: 'density-17', input: '50g salted butter, cubed', measure: { kind: 'mass', grams: 50 }, ingredient: 'salted butter', tags: ['density', 'mass', 'fraction'] },

  // Volume
  { id: 'volume-01', input: '250ml whole milk', measure: { kind: 'volume', ml: 250 }, ingredient: 'whole milk', tags: ['volume'] },
  { id: 'volume-02', input: '100ml double cream', measure: { kind: 'volume', ml: 100 }, ingredient: 'heavy cream', tags: ['volume', 'fraction'] },
  { id: 'volume-03', input: '150ml hot vegetable stock', measure: { kind: 'volume', ml: 150 }, ingredient: 'vegetable stock', tags: ['volume', 'fraction'] },
  { id: 'volume-04', input: '1 litre chicken stock', measure: { kind: 'volume', ml: 1000 }, ingredient: 'chicken stock', tags: ['volume', 'fraction'] },
  { id: 'volume-05', input: '30ml runny honey', measure: { kind: 'volume', ml: 30 }, ingredient: 'honey', tags: ['volume', 'ambiguous'] },
  { id: 'volume-06', input: '5ml vanilla extract', measure: { kind: 'volume', ml: 5 }, ingredient: 'vanilla extract', tags: ['volume'] },
  { id: 'volume-07', input: '75ml maple syrup', measure: { kind: 'volume', ml: 75 }, ingredient: 'maple syrup', tags: ['volume', 'fraction'] },
  { id: 'volume-08', input: '1 x 400ml can coconut milk', measure: { kind: 'volume', ml: 400, packaged: true }, ingredient: 'coconut milk', tags: ['volume', 'fraction', 'ambiguous'] },
  { id: 'volume-09', input: '330ml bottle of lager', measure: { kind: 'volume', ml: 330, packaged: true }, ingredient: 'lager', tags: ['volume', 'ambiguous'] },
  { id: 'volume-10', input: '50ml fresh lemon juice', measure: { kind: 'volume', ml: 50 }, ingredient: 'lemon juice', tags: ['volume', 'fraction'] },

  // Packaged weights
  { id: 'pack-01', input: '1 x 400g tin chopped tomatoes', measure: { kind: 'mass', grams: 400, packaged: true }, ingredient: 'chopped tomatoes', tags: ['mass', 'ambiguous'] },
  { id: 'pack-02', input: '400g can chickpeas, drained and rinsed', measure: { kind: 'mass', grams: 400, packaged: true }, ingredient: 'chickpeas', tags: ['mass', 'ambiguous'] },
  { id: 'pack-03', input: '1 x 227g tin pineapple chunks in juice', measure: { kind: 'mass', grams: 227, packaged: true }, ingredient: 'pineapple chunks', tags: ['mass', 'ambiguous'] },

  // Ranges
  { id: 'range-01', input: '200-250g plain flour', measure: { kind: 'mass', grams: { min: 200, max: 250 } }, ingredient: 'all-purpose flour', tags: ['range', 'density', 'mass', 'fraction'] },
  { id: 'range-02', input: '600-700g sweet potatoes', measure: { kind: 'mass', grams: { min: 600, max: 700 } }, ingredient: 'sweet potatoes', tags: ['range', 'mass', 'fraction'] },
  { id: 'range-03', input: '100-150ml milk', measure: { kind: 'volume', ml: { min: 100, max: 150 } }, ingredient: 'milk', tags: ['range', 'volume', 'fraction'] },
  { id: 'range-04', input: '2-3 tbsp soy sauce', measure: { kind: 'volume', ml: { min: 30, max: 45 } }, ingredient: 'soy sauce', tags: ['range', 'no-conversion'] },

  // Temperature
  { id: 'temp-01', input: 'Heat oven to 180C/160C fan/gas 4', measure: oven(180), ingredient: 'oven', tags: ['temperature'] },
  { id: 'temp-02', input: 'Preheat the oven to 200C/180C fan/gas 6', measure: oven(200), ingredient: 'oven', tags: ['temperature'] },
  { id: 'temp-03', input: 'Bake at 220C (200C fan) for 25 mins', measure: oven(220), ingredient: 'oven', tags: ['temperature'] },
  { id: 'temp-04', input: 'Set the oven to gas mark 5', measure: { kind: 'gas-mark', mark: 5 }, ingredient: 'oven', tags: ['temperature', 'ambiguous'] },
  { id: 'temp-05', input: 'Heat the oil in a deep pan to 180C', measure: { kind: 'temperature', celsius: 180, context: 'other' }, ingredient: 'oil', tags: ['temperature', 'ambiguous'] },
  { id: 'temp-06', input: 'Heat oven to 140C/120C fan/gas 1', measure: oven(140), ingredient: 'oven', tags: ['temperature'] },

  // Length
  { id: 'length-01', input: 'Grease and line a 23cm round cake tin', measure: { kind: 'length', cm: 23, context: 'tin' }, ingredient: 'round cake tin', tags: ['length'] },
  { id: 'length-02', input: 'a 20cm square baking tin', measure: { kind: 'length', cm: 20, context: 'tin' }, ingredient: 'square baking tin', tags: ['length'] },

  // No conversion
  { id: 'none-01', input: '2 large eggs', measure: { kind: 'count', count: 2 }, ingredient: 'large eggs', tags: ['no-conversion'] },
  { id: 'none-02', input: 'a pinch of sea salt', measure: { kind: 'pinch', count: 1 }, ingredient: 'sea salt', tags: ['no-conversion', 'ambiguous'] },
  { id: 'none-03', input: '1 red onion, finely chopped', measure: { kind: 'count', count: 1 }, ingredient: 'red onion', tags: ['no-conversion'] },
  { id: 'none-04', input: '3 tbsp crème fraîche', measure: { kind: 'volume', ml: 45 }, ingredient: 'crème fraîche', tags: ['no-conversion'] },
];
