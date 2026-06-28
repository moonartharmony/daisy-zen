import type {
  GlobalEmotion,
  Impulse,
  ImpulseKind,
  PetalState,
  WorldSnapshot,
} from "../types";

/**
 * EmotionFieldEngine
 * ------------------
 * A small, deterministic simulation that owns the entire animated state of
 * the daisy. UI never mutates per-frame values directly — it injects
 * impulses and reads immutable snapshots.
 *
 * Tick at a fixed simulated 60Hz regardless of rAF jitter, so behaviour is
 * stable on slow devices. Allocations are limited to one snapshot per tick.
 */
const FIXED_DT = 1 / 60; // 60Hz simulated
const MAX_SUBSTEPS = 4;

const PETAL_COUNT = 8;

// Field formula tuning
const DIFFUSION_K = 0.12;
const DECAY_K_BASE = 0.03;

// Spring tuning for petal rotation (slightly underdamped → organic settle).
const ROT_STIFFNESS = 140;
const ROT_DAMPING = 18;

// Openness lerp factor per tick
const OPEN_LERP = 0.12;

function clamp(x: number, lo: number, hi: number) {
  return x < lo ? lo : x > hi ? hi : x;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Shortest signed delta in degrees (-180..180). */
function shortestAngleDelta(from: number, to: number) {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export class EmotionFieldEngine {
  private time = 0;
  private fieldIntensity = 0.25;
  private emotion: GlobalEmotion = {
    valence: 0.2,
    arousal: 0.2,
    stability: 0.6,
  };
  // Per-chapter difficulty knobs — see setDifficulty().
  private windStrength = 0.08;
  private decayMult = 1;


  // Mutable petal store — we mutate in place between ticks and only
  // freeze a snapshot view for React consumers.
  private petals: PetalState[];

  // Pending impulses queued from UI; drained each tick.
  private impulseQueue: Impulse[] = [];

  // Per-petal target rotation (degrees). UI sets these via setPetalTarget().
  private targetRotations: number[];

  // Cached snapshot reference, rebuilt each tick.
  private snapshot: WorldSnapshot;

  // Last rAF timestamp.
  private rafId: number | null = null;
  private lastRaf = 0;
  private accumulator = 0;

  // Subscribers (useSyncExternalStore-friendly).
  private listeners = new Set<() => void>();

  constructor() {
    this.petals = Array.from({ length: PETAL_COUNT }, (_, i) => ({
      id: i,
      baseAngle: (360 / PETAL_COUNT) * i,
      currentRotation: 0,
      openness: 0.85,
      targetOpenness: 1,
      angularVelocity: 0,
    }));
    this.targetRotations = new Array(PETAL_COUNT).fill(0);
    this.snapshot = this.buildSnapshot();
  }

  // ---------- Public API ----------

  getSnapshot = (): WorldSnapshot => this.snapshot;

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  start() {
    if (this.rafId !== null) return;
    this.lastRaf = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - this.lastRaf) / 1000);
      this.lastRaf = now;
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
        this.tick(FIXED_DT);
        this.accumulator -= FIXED_DT;
        steps += 1;
      }
      // If we fell badly behind, drop the surplus rather than spiraling.
      if (this.accumulator > FIXED_DT * MAX_SUBSTEPS) {
        this.accumulator = 0;
      }
      this.snapshot = this.buildSnapshot();
      // Notify React after the snapshot is fresh.
      this.listeners.forEach((l) => l());
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Queue an impulse to be processed on the next tick. */
  injectImpulse(kind: ImpulseKind, petalIndex?: number) {
    this.impulseQueue.push({ kind, petalIndex });
  }

  /**
   * Tune per-chapter field behaviour.
   *  - windStrength: amplitude of background field noise (0..0.25)
   *  - decayMult:   how aggressively the field bleeds back to zero
   */
  setDifficulty(opts: { windStrength?: number; decayMult?: number }) {
    if (opts.windStrength !== undefined) {
      this.windStrength = clamp(opts.windStrength, 0, 0.25);
    }
    if (opts.decayMult !== undefined) {
      this.decayMult = clamp(opts.decayMult, 0.25, 4);
    }
  }

  /** Set the target rotation (degrees, 0=north) for a petal. */
  setPetalTarget(petalIndex: number, rotationDeg: number, openness = 1) {

    if (petalIndex < 0 || petalIndex >= PETAL_COUNT) return;
    this.targetRotations[petalIndex] = rotationDeg;
    this.petals[petalIndex].targetOpenness = clamp(openness, 0, 1);
  }

  /** Initialize all petal directions instantly (used on level load). */
  resetPetals(
    targets: ReadonlyArray<{ rotationDeg: number; hasArrow: boolean }>,
  ) {
    for (let i = 0; i < PETAL_COUNT; i++) {
      const t = targets[i];
      const p = this.petals[i];
      if (t) {
        p.currentRotation = t.rotationDeg;
        this.targetRotations[i] = t.rotationDeg;
        p.targetOpenness = t.hasArrow ? 1 : 0.7;
      } else {
        p.targetOpenness = 0.7;
      }
      p.angularVelocity = 0;
      p.openness = p.targetOpenness;
    }
  }

  /**
   * Brief openness surge across all petals — used to celebrate a level win.
   * Targets snap to 1, then ease back to their natural target on the next tap.
   */
  surgeOpenness(amount = 0.25, ms = 900) {
    const restore: { p: PetalState; original: number }[] = [];
    for (const p of this.petals) {
      restore.push({ p, original: p.targetOpenness });
      p.targetOpenness = clamp(p.targetOpenness + amount, 0, 1.25);
    }
    setTimeout(() => {
      for (const { p, original } of restore) {
        p.targetOpenness = original;
      }
    }, ms);
  }

  // ---------- Internal simulation ----------

  private tick(dt: number) {
    this.time += dt;

    // 1) Drain impulses — they push the emotional field around.
    let impulseEnergy = 0;
    while (this.impulseQueue.length > 0) {
      const imp = this.impulseQueue.shift()!;
      const e = this.applyImpulse(imp);
      impulseEnergy += e;
    }

    // 2) Field formula:
    //    fieldNext = field + impulse + diffusion*0.12 - decay*0.03 + windNoise
    const diffusion = (this.emotion.arousal - this.fieldIntensity) * 0.6;
    const decay = this.fieldIntensity; // pulls toward 0 over time
    const wind = this.windNoise();
    this.fieldIntensity = clamp(
      this.fieldIntensity +
        impulseEnergy +
        diffusion * DIFFUSION_K -
        decay * DECAY_K_BASE * this.decayMult +
        wind,
      0,
      1,
    );


    // 3) Emotion drifts back toward a calm baseline; arousal couples to field.
    const calmPull = 0.015;
    this.emotion.arousal = clamp(
      lerp(this.emotion.arousal, this.fieldIntensity * 0.85, 0.06),
      0,
      1,
    );
    this.emotion.stability = clamp(
      this.emotion.stability + (0.7 - this.emotion.arousal) * calmPull,
      0,
      1,
    );
    this.emotion.valence = clamp(
      this.emotion.valence +
        (this.emotion.stability - 0.5) * 0.01 -
        (this.fieldIntensity > 0.7 ? 0.008 : 0),
      -1,
      1,
    );

    // 4) Integrate petals (spring toward target rotation + jitter from field).
    const jitterAmp = (1 - this.emotion.stability) * 6; // deg
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = this.petals[i];
      const target =
        this.targetRotations[i] +
        (jitterAmp > 0.05
          ? Math.sin(this.time * 9 + i * 1.7) * jitterAmp
          : 0);
      const delta = shortestAngleDelta(p.currentRotation, target);
      const accel = ROT_STIFFNESS * delta - ROT_DAMPING * p.angularVelocity;
      p.angularVelocity += accel * dt;
      // soft clamp to keep things sane on huge deltas
      if (p.angularVelocity > 1200) p.angularVelocity = 1200;
      if (p.angularVelocity < -1200) p.angularVelocity = -1200;
      p.currentRotation = (p.currentRotation + p.angularVelocity * dt) % 360;
      if (p.currentRotation < 0) p.currentRotation += 360;

      // Openness follows target via simple lerp; breath modulates slightly.
      p.openness = lerp(p.openness, p.targetOpenness, OPEN_LERP);
    }
  }

  private applyImpulse(imp: Impulse): number {
    switch (imp.kind) {
      case "tap": {
        this.emotion.arousal = clamp(this.emotion.arousal + 0.04, 0, 1);
        return 0.05;
      }
      case "align": {
        this.emotion.stability = clamp(this.emotion.stability + 0.08, 0, 1);
        this.emotion.valence = clamp(this.emotion.valence + 0.06, -1, 1);
        this.emotion.arousal = clamp(this.emotion.arousal - 0.05, 0, 1);
        return 0.03;
      }
      case "misalign": {
        this.emotion.stability = clamp(this.emotion.stability - 0.12, 0, 1);
        this.emotion.arousal = clamp(this.emotion.arousal + 0.18, 0, 1);
        this.emotion.valence = clamp(this.emotion.valence - 0.05, -1, 1);
        if (imp.petalIndex !== undefined) {
          // brief openness dip on the offending petal
          const p = this.petals[imp.petalIndex];
          if (p) p.targetOpenness = 0.55;
          setTimeout(() => {
            if (p) p.targetOpenness = 1;
          }, 240);
        }
        return 0.22;
      }
      case "win": {
        this.emotion.stability = 1;
        this.emotion.valence = 1;
        this.emotion.arousal = clamp(this.emotion.arousal + 0.3, 0, 1);
        return 0.35;
      }
      case "reset": {
        this.emotion.arousal = 0.2;
        this.emotion.stability = 0.7;
        this.emotion.valence = 0.2;
        this.fieldIntensity = 0.2;
        return 0;
      }
    }
  }

  private windNoise(): number {
    // Deterministic-ish low-frequency noise driven by time + arousal.
    // Amplitude scales with the per-chapter windStrength.
    const speed = 0.8 + this.emotion.arousal * 2.4;
    const a = Math.sin(this.time * speed) * 0.5;
    const b = Math.sin(this.time * speed * 1.73 + 1.3) * 0.5;
    return (a + b) * this.windStrength * 0.05 * (0.5 + this.emotion.arousal);
  }


  private buildSnapshot(): WorldSnapshot {
    // Breath: sine wave whose speed depends on arousal.
    // Faster + shallower when anxious; slower + deeper when calm.
    const breathSpeed = 0.8 + this.emotion.arousal * 2.2;
    const breathWave = Math.sin(this.time * breathSpeed);

    // Apply breath to a snapshot copy of petals (read-only contract).
    // We allocate one new array per tick; the inner objects are reused.
    const snapPetals: PetalState[] = new Array(PETAL_COUNT);
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = this.petals[i];
      snapPetals[i] = {
        id: p.id,
        baseAngle: p.baseAngle,
        currentRotation: p.currentRotation,
        openness: clamp(p.openness + breathWave * 0.015, 0, 1),
        targetOpenness: p.targetOpenness,
        angularVelocity: p.angularVelocity,
      };
    }

    return {
      time: this.time,
      globalEmotion: {
        valence: this.emotion.valence,
        arousal: this.emotion.arousal,
        stability: this.emotion.stability,
      },
      fieldIntensity: this.fieldIntensity,
      breathWave,
      petals: snapPetals,
    };
  }
}
