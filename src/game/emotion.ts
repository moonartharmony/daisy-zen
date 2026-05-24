/**
 * Sprint 1 — Emotional State Engine
 *
 * Five states form a calming arc from stress → harmony. Each state carries a
 * profile that drives:
 *   • breathingPeriod  → CSS --breath-period (center-breathe animation)
 *   • asymmetryFactor  → organic bezier perturbation magnitude (via pathMorph)
 *   • particleDensity  → ambient SVG particle count in DaisyCanvas
 *   • bgPulseSpeed     → CSS --bg-pulse-speed (chapter bg transition)
 *
 * The state machine is purely reactive: it re-derives on every tap event and
 * on the hint-ready timer firing. No timers or intervals inside this module.
 */

import { useState, useEffect, useRef } from 'react';
import type { GameState }               from './useGame';
import type { Phase }                   from './types';

/* ── Type definitions (Sprint 1 spec) ──────────────────────────────────── */

export type EmotionState =
  | 'anxious'
  | 'seeking'
  | 'calming'
  | 'meditative'
  | 'harmonized';

export interface EmotionProfile {
  breathingPeriod: number; // seconds for CSS scale looping
  asymmetryFactor: number; // mutation depth for Bezier anchors
  particleDensity: number;
  bgPulseSpeed:    string; // CSS transition timing
}

export const EMOTION_PROFILES: Record<EmotionState, EmotionProfile> = {
  anxious:    { breathingPeriod: 2.5, asymmetryFactor: 0.15, particleDensity: 20, bgPulseSpeed: '0.4s' },
  seeking:    { breathingPeriod: 4.0, asymmetryFactor: 0.08, particleDensity: 10, bgPulseSpeed: '0.8s' },
  calming:    { breathingPeriod: 5.0, asymmetryFactor: 0.04, particleDensity:  5, bgPulseSpeed: '1.2s' },
  meditative: { breathingPeriod: 7.0, asymmetryFactor: 0.01, particleDensity:  2, bgPulseSpeed: '2.0s' },
  harmonized: { breathingPeriod: 9.0, asymmetryFactor: 0.00, particleDensity:  0, bgPulseSpeed: '3.0s' },
};

/* ── Pure derivation — zero side-effects, fully testable ───────────────── */

export function deriveEmotionState(
  alignedFrac:     number,  // 0–1 fraction of arrow-petals aligned
  recentMisaligns: number,  // count within an 8-second sliding window
  hintReady:       boolean, // 45-second hint timer has fired
  phase:           Phase,
): EmotionState {
  if (phase === 'won' || alignedFrac >= 1)                          return 'harmonized';
  if (alignedFrac >= 0.6 && recentMisaligns === 0 && !hintReady)   return 'meditative';
  if (alignedFrac >= 0.3 && recentMisaligns <= 1 && !hintReady)    return 'calming';
  if (hintReady || recentMisaligns >= 3)                            return 'anxious';
  return 'seeking';
}

/* ── Hook — reactive state machine + CSS side-effects ──────────────────── */

/**
 * Tracks misalign timestamps in an 8-second sliding window (via ref, no
 * re-render) and re-derives EmotionState on every tap / hint-ready change.
 *
 * CSS side-effects (--breath-period, --bg-pulse-speed) fire inside useEffect
 * to stay within React's rendering contract. localStorage write allows the
 * /dashboard avatar ring to reflect the last known emotional colour.
 */
export function useEmotionState(s: GameState): EmotionState {
  const [emotion, setEmotion] = useState<EmotionState>('seeking');
  const stampsRef             = useRef<number[]>([]);

  /* Re-derive on every tap event (lastTap is a new object reference) */
  useEffect(() => {
    const tap = s.lastTap;
    if (tap?.result === 'misaligned') {
      const now = Date.now();
      stampsRef.current = [
        ...stampsRef.current.filter(t => now - t < 8_000),
        now,
      ];
    }

    const petals      = s.puzzle.petals.filter(p => p.hasArrow);
    const alignedFrac = petals.length > 0
      ? petals.filter(p => p.aligned).length / petals.length
      : 0;
    const recentMisaligns = stampsRef.current.filter(
      t => Date.now() - t < 8_000,
    ).length;

    setEmotion(
      deriveEmotionState(alignedFrac, recentMisaligns, s.hintReady, s.phase),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.lastTap, s.hintReady, s.phase]);

  /* Reset misalign history on level change */
  useEffect(() => {
    stampsRef.current = [];
    setEmotion('seeking');
  }, [s.level]);

  /* CSS variable side-effects — keep animations in sync */
  useEffect(() => {
    const p = EMOTION_PROFILES[emotion];
    const r = document.documentElement;
    r.style.setProperty('--breath-period', `${p.breathingPeriod}s`);
    r.style.setProperty('--bg-pulse-speed', p.bgPulseSpeed);
    /* Persist for /dashboard avatar ring colour */
    localStorage.setItem('daisy-emotional-state', emotion);
  }, [emotion]);

  return emotion;
}
