/**
 * SVG Petal Path Morphing — Phase 1
 *
 * All 5 chapter petal shapes are stored as flat arrays of 24 numbers
 * (4 cubic-bezier segments × 3 points × 2 coordinates).
 * Sharing the same command structure means they can be linearly interpolated
 * for smooth watercolor-style chapter transitions with no external libraries.
 *
 * Format per 6-tuple: [cp1x, cp1y,  cp2x, cp2y,  anchorX, anchorY]
 * All paths start at M 0,0 (petal base) and end with Z.
 * Tip at approx y = -88 to -92 (upward in SVG = negative Y).
 */

export type PathNums    = readonly number[];
export type PetalShapeKey = 'oval' | 'leaf' | 'diamond' | 'spike' | 'clover';

/* ── Normalized shapes (24 numbers each) ──────────────────────────────── */
export const PETAL_NUMS: Record<PetalShapeKey, PathNums> = {
  // THE GARDEN — wide pill oval, soft and welcoming (matches mockup)
  oval: [
     22, -10,  30, -38,  28, -56,   // right side curves wide — pill shape
     26, -74,  14, -90,   0, -94,   // approaching the rounded tip
    -14, -90, -26, -74, -28, -56,   // descending left (mirror)
    -30, -38, -22, -10,   0,   0,   // return to base
  ],

  // THE FOREST — asymmetric pointed leaf, organic asymmetry
  leaf: [
     20, -14,  28, -48,  18, -70,   // right side curves wide — wider apex
      4, -90,  -4, -98,   0, -92,   // tip slightly off-axis
     -8, -84, -16, -60, -14, -44,   // left descent, more angular
    -14, -28,  -8, -10,   0,   0,   // steep return to base
  ],

  // THE MOUNTAIN — angular diamond; tight control pts = sharp corners
  diamond: [
      2,  -2,  13, -34,  13, -36,   // barely curves → near-straight right edge
     13, -40,   2, -88,   0, -92,   // converge sharply to tip
     -2, -88, -13, -40, -13, -36,   // mirror descent
    -13, -34,  -2,  -2,   0,   0,   // sharp base corners
  ],

  // THE STORM — thin aggressive spike, minimal width
  spike: [
      5,  -6,   8, -28,   8, -44,   // narrow right edge
      6, -62,   2, -80,   0, -92,   // converge to sharp tip
     -2, -80,  -6, -62,  -8, -44,   // mirror thin left edge
     -8, -28,  -5,  -6,   0,   0,   // return base
  ],

  // THE VOID — double-lobed clover; two bulges flank a narrow waist
  clover: [
     18,  -8,  26, -38,  14, -56,   // right lobe: bulges far right
      2, -70,   0, -74,   0, -88,   // waist narrows to tip
      0, -74,  -2, -70, -14, -56,   // left lobe mirrors from tip
    -26, -38, -18,  -8,   0,   0,   // left lobe returns to base
  ],
};

/* ── Path utilities ────────────────────────────────────────────────────── */

/** Convert flat 24-number array → SVG path string (M 0,0 C … Z) */
export function numsToPath(n: readonly number[]): string {
  let d = 'M 0,0';
  for (let i = 0; i < n.length; i += 6) {
    d += ` C ${n[i]},${n[i + 1]} ${n[i + 2]},${n[i + 3]} ${n[i + 4]},${n[i + 5]}`;
  }
  return d + ' Z';
}

/** Scale a path array by multiplying every coordinate by s */
export function scaleNums(n: readonly number[], s: number): number[] {
  return n.map(v => v * s);
}

/** Linear interpolation of two same-length arrays */
export function lerpNums(
  a: readonly number[],
  b: readonly number[],
  t: number,
): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}

/** Ease-in-out cubic — organic morph, no abrupt start/stop */
export function easeInOut3(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Apply seed-based organic perturbation to a path-number array.
 *
 * Each coordinate is nudged by ±(factor × |coord|), where the sign and
 * magnitude are drawn from a deterministic LCG keyed by `seed`. Factor 0
 * returns an exact copy (no allocation overhead on harmonized state).
 *
 * Usage: organicNums(PETAL_NUMS.oval, 0.08, petalIdx * 1000 + level * 17)
 *
 * The LCG constants (Knuth / Numerical Recipes) give well-distributed
 * sequences with no visible periodicity at 24 samples per petal.
 */
export function organicNums(
  base:   readonly number[],
  factor: number,
  seed:   number,
): number[] {
  if (factor === 0) return [...base];
  let s = seed >>> 0; // unsigned 32-bit
  const rand = (): number => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return (s >>> 0) / 0xffffffff; // [0, 1)
  };
  return base.map(v => {
    const noise = (rand() - 0.5) * 2;           // [-1, 1]
    const mag   = Math.abs(v) || 8;              // avoid zero-coord deadzone
    return v + noise * factor * mag;
  });
}
