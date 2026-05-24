/**
 * ZenStateController — Arrow: Zen Continuum
 *
 * Pure, deterministic computation module. Zero side effects, zero React,
 * zero DOM access. All adaptive behaviour is derived from this single
 * function so the controller is trivially testable and hot-reload safe.
 *
 * ── Hint Score formula (spec) ────────────────────────────────────────────
 *   hintScore = time_elapsed + failed_interactions
 *             + hesitation_duration + rotational_entropy
 *
 * Score components (max 100 total → hint button appears):
 *   time       0–40   saturates at 45 s                (main trigger)
 *   failures   0–25   +5 per broke-tap, caps at 5 events (frustration)
 *   hesitation 0–20   saturates at 20 s idle            (cognitive stall)
 *   entropy    0–15   unique dirs / unaligned count     (disorder)
 *
 * ── Adaptive pacing scale (--zen-pace) ───────────────────────────────────
 *   1.0 (calm, full flow) → 1.4 (stressed, animations breathe slower)
 *   Applied to .center-breathe and .anim-hint-bounce via CSS calc().
 */

/* ── Public types ─────────────────────────────────────────────────────── */

export interface ZenState {
  /** 0 = perfectly calm, 1 = maximum frustration */
  playerStress:      number;
  /** 0 = stuck, 1 = every petal locked in */
  completionFlow:    number;
  interactionRhythm: 'steady' | 'erratic' | 'paused';
  cognitiveLoad:     'low' | 'moderate' | 'high';
  /** When ≥ 100 the hint button should appear */
  hintScore:         number;
  /** CSS --zen-pace value: 1.0–1.4 */
  paceMul:           number;
}

export interface ZenInput {
  /** Seconds elapsed since the current level began */
  elapsedSec:        number;
  /** Cumulative 'broke' events (aligned petal knocked out of place) */
  failedTaps:        number;
  /** Fraction of arrow-petals that are currently aligned (0–1) */
  alignedFraction:   number;
  /** Seconds since the player last tapped anything */
  hesitationSec:     number;
  /**
   * Directional entropy of unaligned petals:
   *   uniqueDirections / unalignedPetalCount
   * 0 = all point same way, 1 = every petal points a different direction
   */
  rotationalEntropy: number;
}

/* ── Core computation ─────────────────────────────────────────────────── */

export function computeZenState(input: ZenInput): ZenState {
  const { elapsedSec, failedTaps, alignedFraction, hesitationSec, rotationalEntropy } = input;

  // Hint score — each component capped so no single factor dominates
  const timeScore    = Math.min(elapsedSec    / 45, 1) * 40;
  const failScore    = Math.min(failedTaps    * 5,  25);
  const hesitScore   = Math.min(hesitationSec / 20, 1) * 20;
  const entropyScore = rotationalEntropy * 15;
  const hintScore    = timeScore + failScore + hesitScore + entropyScore;

  // Stress — weighted blend of incompletion, failure rate, time pressure
  const playerStress = Math.min(
    (1 - alignedFraction)         * 0.40 +
    Math.min(failedTaps / 10, 1)  * 0.35 +
    Math.min(elapsedSec / 120, 1) * 0.25,
    1,
  );

  const completionFlow = alignedFraction;

  const interactionRhythm: ZenState['interactionRhythm'] =
    hesitationSec > 20 ? 'paused'  :
    failedTaps    > 3  ? 'erratic' :
    'steady';

  const cognitiveLoad: ZenState['cognitiveLoad'] =
    hintScore > 70 ? 'high'     :
    hintScore > 35 ? 'moderate' :
    'low';

  // Pacing multiplier: higher stress → slower animations (more calming)
  // Range 1.0–1.4; rounded to 3dp to avoid CSS variable churn
  const paceMul = Math.round((1 + playerStress * 0.4) * 1000) / 1000;

  return { playerStress, completionFlow, interactionRhythm, cognitiveLoad, hintScore, paceMul };
}

/* ── Input derivation ─────────────────────────────────────────────────── */

/**
 * Extracts a ZenInput snapshot from live game data.
 * Call this inside a setS updater or a timer tick — never in render.
 */
export function deriveZenInput(
  petals:     Array<{ hasArrow: boolean; aligned: boolean; dir: string }>,
  startTime:  number,
  failedTaps: number,
  lastTapAt:  number,
): ZenInput {
  const now           = Date.now();
  const elapsedSec    = (now - startTime)  / 1000;
  const hesitationSec = (now - lastTapAt)  / 1000;

  const arrowPetals     = petals.filter(p => p.hasArrow);
  const totalArrow      = arrowPetals.length;
  const alignedCount    = arrowPetals.filter(p => p.aligned).length;
  const alignedFraction = totalArrow > 0 ? alignedCount / totalArrow : 0;

  // Entropy: unique directions among unaligned petals
  const unaligned          = arrowPetals.filter(p => !p.aligned);
  const uniqueDirs         = new Set(unaligned.map(p => p.dir)).size;
  const rotationalEntropy  = unaligned.length > 0 ? uniqueDirs / unaligned.length : 0;

  return { elapsedSec, failedTaps, alignedFraction, hesitationSec, rotationalEntropy };
}
