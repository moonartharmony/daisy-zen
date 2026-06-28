// Immutable world model for the Daisy Zen emotion-field simulation.
// Snapshots are produced by the engine each tick and consumed by the
// stateless render layer. No methods, no per-frame allocation surprises.

export type GlobalEmotion = {
  /** Emotional polarity, -1 (negative) .. +1 (positive). */
  valence: number;
  /** Activation level, 0 (calm) .. 1 (agitated). */
  arousal: number;
  /** How coherent the field is, 0 (chaotic) .. 1 (harmonized). */
  stability: number;
};

export type PetalState = {
  id: number;
  /** Anchor angle around the daisy (degrees, 0=top). */
  baseAngle: number;
  /** Currently rendered arrow direction (degrees, 0=north). */
  currentRotation: number;
  /** 0..1 — how open the petal is (also drives subtle scale). */
  openness: number;
  /** Engine target the petal is springing toward. */
  targetOpenness: number;
  /** Degrees per second, used by the spring integrator. */
  angularVelocity: number;
};

export type WorldSnapshot = {
  /** Seconds since engine start. */
  time: number;
  globalEmotion: GlobalEmotion;
  /** 0..1 — net energy in the field. */
  fieldIntensity: number;
  /** -1..1 — current breath wave value. */
  breathWave: number;
  /** Fixed-length array (8 slots) — readers index by petal id. */
  petals: ReadonlyArray<PetalState>;
};

export type ImpulseKind = "tap" | "align" | "misalign" | "win" | "reset";

export type Impulse = {
  kind: ImpulseKind;
  petalIndex?: number;
};
