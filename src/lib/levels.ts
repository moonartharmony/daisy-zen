// ── Daisy — Level System ──────────────────────────────────────────────────────
//
// Data model (from spec):
//   type Petal = { id: string; angle: number; targetAngle: number }
//   win:    every petal satisfies  petal.angle % 360 === petal.targetAngle % 360
//   levels: [{ petalCount: 4 }, { petalCount: 6 }, { petalCount: 8 }]
//
// Design decisions:
//   • Angles are multiples of 45° (8 compass positions), matching the SVG arrow system.
//   • All petals in a level share one targetAngle — same mechanic as centerDir.
//   • Level generation is fully deterministic (index → angles), no RNG at runtime.
//   • Rotation step is 45° per tap (CW or CCW).
// ─────────────────────────────────────────────────────────────────────────────

// ── Core types ────────────────────────────────────────────────────────────────

export type Petal = {
  id:          string;
  angle:       number; // current rotation in degrees — always a multiple of 45
  targetAngle: number; // goal rotation in degrees   — always a multiple of 45
};

export type LevelConfig = {
  petalCount: number;
};

export type LevelState = {
  index:  number;       // 0-based level index
  config: LevelConfig;
  petals: Petal[];
};

// ── Static level catalogue ────────────────────────────────────────────────────
// Extend this array to add more levels. The game cycles through it infinitely.

export const LEVELS: LevelConfig[] = [
  { petalCount: 4 },
  { petalCount: 6 },
  { petalCount: 8 },
];

// ── Win condition ─────────────────────────────────────────────────────────────
// Spec: all petals satisfy  petal.angle % 360 === petal.targetAngle % 360

export const isWon = (petals: Petal[]): boolean =>
  petals.every(p => ((p.angle % 360) + 360) % 360 === ((p.targetAngle % 360) + 360) % 360);

// ── Tap logic ─────────────────────────────────────────────────────────────────
// Returns a new petals array with the tapped petal rotated one step (45°).
// Pure function — no mutation.

const STEP = 45;

export const tapPetal = (
  petals:    Petal[],
  id:        string,
  direction: 'cw' | 'ccw' = 'cw',
): Petal[] =>
  petals.map(p => {
    if (p.id !== id) return p;
    const delta = direction === 'cw' ? STEP : -STEP;
    return { ...p, angle: ((p.angle + delta) % 360 + 360) % 360 };
  });

// ── Deterministic level builder ───────────────────────────────────────────────
// Same index always produces the same angles — safe to reset/replay.
//
// Algorithm:
//   targetAngle — cycles through 0°, 90°, 180°, 270° as levels advance.
//   startAngle[i] — shifted by (i+1)*45° from target, so no petal starts aligned
//                   and each petal in the level has a distinct starting angle.
//
// Example (index=0, petalCount=4, target=0°):
//   petal-0: angle=45°   target=0°   → 1 CW tap to align
//   petal-1: angle=90°   target=0°   → 2 CW taps
//   petal-2: angle=135°  target=0°   → 3 CW taps
//   petal-3: angle=180°  target=0°   → 4 CW taps
//   minMoves = 10

const TARGET_SEQUENCE = [0, 90, 180, 270] as const;

export function buildLevel(index: number): LevelState {
  const config      = LEVELS[index % LEVELS.length];
  const targetAngle = TARGET_SEQUENCE[index % TARGET_SEQUENCE.length];

  const petals: Petal[] = Array.from({ length: config.petalCount }, (_, i) => {
    // Each petal offset by (i+1) steps from target, wrapping around 360°.
    // Guarantees: startAngle ≠ targetAngle for all i.
    const angle = ((targetAngle + (i + 1) * STEP) % 360 + 360) % 360;
    return { id: `petal-${i}`, angle, targetAngle };
  });

  return { index, config, petals };
}

// ── Convenience: minimum moves to solve ───────────────────────────────────────
// Counts CW taps needed if every petal rotates only clockwise (upper bound).

export function minMoves(petals: Petal[]): number {
  return petals.reduce((sum, p) => {
    const cur = ((p.angle    % 360) + 360) % 360;
    const tgt = ((p.targetAngle % 360) + 360) % 360;
    const cwSteps = ((tgt - cur + 360) % 360) / STEP;
    return sum + cwSteps;
  }, 0);
}
