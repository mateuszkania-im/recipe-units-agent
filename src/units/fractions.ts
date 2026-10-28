/** Kitchen-friendly rounding and formatting of quantities. */

const EPSILON = 1e-9;

/** Rounds to the nearest multiple of `step` (for example 0.25 for quarters). */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) throw new RangeError('step must be positive');
  return Math.round(value / step + EPSILON) * step;
}

/** Fractions a US cook expects on a measuring cup: quarters and thirds. */
const CUP_FRACTIONS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1] as const;

/** Rounds to a whole number plus the nearest quarter or third. */
export function roundToCupFraction(value: number): number {
  const whole = Math.floor(value);
  const rest = value - whole;
  let best = 0;
  for (const fraction of CUP_FRACTIONS) {
    if (Math.abs(rest - fraction) < Math.abs(rest - best) - EPSILON) best = fraction;
  }
  return whole + best;
}

const GLYPHS: readonly (readonly [number, string])[] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
];

/** Formats 1.75 as "1 3/4" and 0.333 as "1/3". Falls back to one decimal place. */
export function formatQuantity(value: number): string {
  const whole = Math.floor(value + EPSILON);
  const rest = value - whole;
  if (rest < 0.01) return String(whole);
  const glyph = GLYPHS.find(([fraction]) => Math.abs(rest - fraction) < 0.01);
  if (!glyph) return value.toFixed(1);
  return whole === 0 ? glyph[1] : `${whole} ${glyph[1]}`;
}
