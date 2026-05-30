/**
 * daisy-flower.jsx — Sprint 1: Organic & Emotional System
 *
 * Implements:
 *   A. Seed-based cubic Bezier petal geometry (replaces <rect>)
 *   B. 5-state emotional engine (anxious → harmonized)
 *   C. Hemispheric bidirectional rotation affordance glyphs
 *   D. Breathing animation wired to --breath-period CSS variable
 *   E. Ambient particle field tied to emotion.particleDensity
 *
 * Architecture — two-layer <g> SVG pattern:
 *   OUTER <g>  → SVG transform="rotate(angle) translate(0,-orbit)"
 *                orbital positioning, never touched by imperative code
 *   INNER <g>  → CSS transform property only (spring press, win burst,
 *                shake, align-flash) — never conflicts with outer layer
 *
 * Direction system: 8-step (N=0°, NE=45°, E=90°, SE=135°, S=180°,
 *                            SW=225°, W=270°, NW=315°)
 * Rotation per tap: 45° CW (right hemisphere) or CCW (left hemisphere)
 * Hemispheric rule: placementAngle > 180° → CCW   (matches spinDir in types.ts)
 *                   placementAngle ≤ 180° → CW
 */

import { useState, useEffect, useRef, useMemo } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 1 — EMOTION ENGINE
   Pure functions. Zero side-effects. Fully testable.
   ══════════════════════════════════════════════════════════════════════════ */

export const EMOTION_PROFILES = {
  anxious:    { breathingPeriod: 2.5, asymmetryFactor: 0.15, particleDensity: 20, bgPulseSpeed: '0.4s' },
  seeking:    { breathingPeriod: 4.0, asymmetryFactor: 0.08, particleDensity: 10, bgPulseSpeed: '0.8s' },
  calming:    { breathingPeriod: 5.0, asymmetryFactor: 0.04, particleDensity:  5, bgPulseSpeed: '1.2s' },
  meditative: { breathingPeriod: 7.0, asymmetryFactor: 0.01, particleDensity:  2, bgPulseSpeed: '2.0s' },
  harmonized: { breathingPeriod: 9.0, asymmetryFactor: 0.00, particleDensity:  0, bgPulseSpeed: '3.0s' },
};

/**
 * Derive the current EmotionState from three observable signals.
 * @param {number} alignedFrac     0–1, fraction of active petals aligned
 * @param {number} recentMisaligns count of failed taps in the last 8 s
 * @param {boolean} hintReady      true when the 45 s hint timer has fired
 * @returns {'anxious'|'seeking'|'calming'|'meditative'|'harmonized'}
 */
export function deriveEmotion(alignedFrac, recentMisaligns, hintReady) {
  if (alignedFrac >= 1)                                           return 'harmonized';
  if (alignedFrac >= 0.6 && recentMisaligns === 0 && !hintReady) return 'meditative';
  if (alignedFrac >= 0.3 && recentMisaligns <= 1 && !hintReady)  return 'calming';
  if (hintReady   || recentMisaligns >= 3)                        return 'anxious';
  return 'seeking';
}

/** Map emotional state → SVG gradient tip colour */
function emotionTipColor(state, petalColor) {
  switch (state) {
    case 'anxious':    return '#E8C4B0'; // warm amber-rose — stress signal
    case 'seeking':    return '#EDE0B0'; // warm sand — curious, unsettled
    case 'calming':    return petalColor; // neutral, progress feels right
    case 'meditative': return '#B8C8DA'; // cool mist — deep stillness
    case 'harmonized': return '#FFE082'; // pure gold — completion warmth
    default:           return petalColor;
  }
}

/* SECTION 2 — BEZIER PATH ENGINE — DISABLED
   All PETAL_NUMS, numsToPath, lerpNums, easeInOut3, organicNums removed.
   The petal <path d=...> is now a hardcoded string literal. These functions
   cannot produce any DOM output and are kept only as historical reference.

const PETAL_NUMS = { oval:[11,-16,16,-44,16,-58,14,-74,6,-86,0,-92,-6,-86,-14,-74,-16,-58,-16,-44,-11,-16,0,0], ... };
function numsToPath(n) { ... }
function lerpNums(a, b, t) { ... }
function easeInOut3(t) { ... }
function organicNums(base, factor, seed) { ... }
*/

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 3 — HOOKS
   ══════════════════════════════════════════════════════════════════════════ */

/* DISABLED — useOrganicPath wrote dynamic PETAL_NUMS lerp strings to petal d attributes.
   Severed to prevent any runtime override of the locked secureOrganicPath geometry.
   Do not re-enable without also removing the hardcoded d= on the <path> element.

function useOrganicPath(shapeKey, asymmetryFactor, seed) {
  const baseTarget = useMemo(
    () => organicNums(PETAL_NUMS[shapeKey] ?? PETAL_NUMS.oval, asymmetryFactor, seed),
    [shapeKey, asymmetryFactor, seed],
  );
  const currentRef    = useRef(baseTarget);
  const rafRef        = useRef(0);
  const prevShapeRef  = useRef(shapeKey);
  const prevFactorRef = useRef(asymmetryFactor);
  const prevSeedRef   = useRef(seed);
  const [path, setPath] = useState(() => numsToPath(baseTarget));
  useEffect(() => {
    const shapeChanged  = shapeKey        !== prevShapeRef.current;
    const factorChanged = asymmetryFactor !== prevFactorRef.current;
    const seedChanged   = seed            !== prevSeedRef.current;
    if (!shapeChanged && !factorChanged && !seedChanged) return;
    prevShapeRef.current  = shapeKey;
    prevFactorRef.current = asymmetryFactor;
    prevSeedRef.current   = seed;
    const from = currentRef.current;
    const to   = baseTarget;
    const dur  = shapeChanged ? 800 : 600;
    const t0   = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const raw          = Math.min((now - t0) / dur, 1);
      const t            = easeInOut3(raw);
      const interpolated = lerpNums(from, to, t);
      currentRef.current = interpolated;
      setPath(numsToPath(interpolated));
      if (raw < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { currentRef.current = to; }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shapeKey, asymmetryFactor, seed, baseTarget]);
  return path;
}
*/

/**
 * Mutate SVG gradient <stop> elements directly — avoids re-rendering
 * all petals simultaneously when the emotional state changes.
 */
function useEmotionalGradient(emotionState, petalColor, gradId) {
  useEffect(() => {
    const tipColor = emotionTipColor(emotionState, petalColor);
    const el       = document.getElementById(gradId);
    if (!el) return;
    const stops = el.querySelectorAll('stop');
    if (stops.length >= 2) {
      stops[0].setAttribute('stop-color', petalColor);
      stops[1].setAttribute('stop-color', tipColor);
    }
  }, [emotionState, petalColor, gradId]);
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 4 — PARTICLE FIELD
   SMIL-animated circles in a ring around center.
   Zero JS per-frame cost after mount. Count = emotion.particleDensity.
   ══════════════════════════════════════════════════════════════════════════ */

function ParticleField({ count, color }) {
  const pts = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle  = (i / Math.max(count, 1)) * 360 + (i % 3) * 22;
      const r      = 92 + (i % 5) * 16;
      const rad    = (angle * Math.PI) / 180;
      const round6 = (v) => Math.round(v * 1e6) / 1e6; // prevent SSR hydration mismatch
      return {
        cx:    round6(Math.cos(rad) * r),
        cy:    round6(Math.sin(rad) * r),
        size:  1.0 + (i % 3) * 0.5,
        dur:   2.4 + (i % 5) * 0.6,
        delay: (i * 0.22) % 2.8,
      };
    }),
  [count]);

  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.size} fill={color} opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.32;0"
            dur={`${p.dur}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 5 — SINGLE PETAL
   Two-layer <g> architecture — see module header for rationale.
   ══════════════════════════════════════════════════════════════════════════ */

const SWIPE_THRESHOLD = 16; // px below which a gesture counts as a tap

/**
 * @param {object} props
 * @param {number}  props.idx             0-based petal index
 * @param {number}  props.angle           orbital placement angle in degrees
 * @param {number}  props.orbit           orbital radius in SVG units
 * @param {boolean} props.hasArrow        whether this petal carries a direction arrow
 * @param {number}  props.dirDeg          current arrow direction in degrees (0–315)
 * @param {boolean} props.aligned         whether this petal is aligned with center
 * @param {boolean} props.isHint          whether to show hint ring
 * @param {boolean} props.isWon           whether the level is won
 * @param {object|null} props.lastTap     { idx, result:'aligned'|'misaligned', ts }
 * @param {string}  props.shapeKey        petal shape key ('oval'|'leaf'|…)
 * @param {number}  props.asymmetryFactor 0.0–0.15 organic perturbation depth
 * @param {number}  props.level           current level (seed component)
 * @param {function} props.onTap          (idx, angle) => void
 * @param {function} props.onSwipe        (idx, dx, dy) => void
 */
function Petal({
  idx, angle, orbit, hasArrow, dirDeg, aligned,
  isHint, isWon, lastTap,
  onTap, onSwipe,
}) {
  const innerRef = useRef(null);
  const startRef = useRef(null);

  /* ── Sprint 1: Hemispheric affordance glyph ──────────────────────────
     Mirrors spinDir() in types.ts: angle > 180° → CCW, else CW.
     The text element is counter-rotated by -angle so it stays upright
     in the player's viewport regardless of petal orbital position.       */
  const isCCW = angle > 180;

  /* secureOrganicPath intentionally NOT stored as a variable —
     the string is inlined directly on the <path d=...> element below
     so no runtime assignment, prop, or state update can ever reach it. */

  /* ── Arrow direction relative to orbital rotation ────────────────────
     The outer <g> rotates by `angle`, so the arrow's rotation must be
     expressed in the outer's local coordinate system.
     arrowRot = targetDir − placementAngle cancels the orbital rotation. */
  const arrowRot = dirDeg - angle;

  /* ── System 1: lastTap animations (misalign shake / align flash) ────── */
  useEffect(() => {
    if (!innerRef.current || !lastTap || lastTap.idx !== idx) return;
    const el = innerRef.current;

    if (lastTap.result === 'misaligned') {
      el.classList.add('petal-shake');
      const id = setTimeout(() => el.classList.remove('petal-shake'), 240);
      return () => clearTimeout(id);
    }
    if (lastTap.result === 'aligned') {
      el.classList.add('petal-align-flash');
      const id = setTimeout(() => el.classList.remove('petal-align-flash'), 380);
      return () => clearTimeout(id);
    }
  }, [lastTap]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Win burst ──────────────────────────────────────────────────────────
     CSS transform on the INNER <g> (not the outer SVG attribute).
     -Y in the outer's local frame always points radially outward so
     translate(0, -BURST) needs no trigonometry.                          */
  useEffect(() => {
    if (!innerRef.current || !isWon) return;
    const el    = innerRef.current;
    const delay = idx * 35;
    const BURST = 55;

    const t1 = setTimeout(() => {
      if (!el.isConnected) return;
      el.style.transition = 'transform 500ms cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform  = `translate(0px, -${BURST}px) scale(1.14)`;

      const t2 = setTimeout(() => {
        if (!el.isConnected) return;
        el.style.transition = 'transform 400ms ease-out';
        el.style.transform  = 'translate(0px, 0px) scale(1)';

        const t3 = setTimeout(() => {
          if (el.isConnected) { el.style.transition = ''; el.style.transform = ''; }
        }, 420);
        return () => clearTimeout(t3);
      }, 500 + delay);
      return () => clearTimeout(t2);
    }, delay);

    return () => clearTimeout(t1);
  }, [isWon]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Pointer handlers — tap vs swipe discrimination ─────────────────── */
  const handlePointerDown = (e) => {
    if (!hasArrow || isWon) return;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };

    // Spring compress on pointerdown
    const el = innerRef.current;
    if (el) {
      el.classList.add('petal-pressed');
      setTimeout(() => el.classList.remove('petal-pressed'), 80);
    }
  };

  const handlePointerUp = (e) => {
    if (!hasArrow || isWon) return;
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;

    const dx   = e.clientX - start.x;
    const dy   = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);

    if (dist < SWIPE_THRESHOLD) {
      onTap(idx, angle);
    } else {
      onSwipe?.(idx, dx, dy);
    }
  };

  return (
    /* OUTER: orbital positioning via SVG attribute — never touched by imperative code */
    <g transform={`rotate(${angle}) translate(0,-${orbit})`}>

      {/* INNER: CSS feedback layer — press, burst, shake, flash */}
      <g
        ref={innerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { startRef.current = null; }}
        className="petal-group"
        role={hasArrow ? 'button' : undefined}
        aria-label={hasArrow ? `Petal ${idx + 1}, rotate ${isCCW ? 'counter-clockwise' : 'clockwise'}` : undefined}
        tabIndex={hasArrow ? 0 : undefined}
        style={{
          cursor:          hasArrow ? 'pointer' : 'default',
          transformOrigin: '0 0',
          touchAction:     'none',
        }}
      >
        {/* Hint glow ring — only for the hinted petal */}
        {isHint && (
          <ellipse
            cx="0" cy="-46" rx="28" ry="46"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3.5"
            opacity="0.7"
          >
            <animate attributeName="opacity" values="0.3;0.9;0.3"
              dur="750ms" repeatCount="3" />
          </ellipse>
        )}

        {/* ── Petal Body — geometry hardcoded as string literal ──────────
             d is a compile-time constant. No variable, no prop, no hook,
             no animate tag, no rAF loop can mutate this value at runtime.
             No <animate attributeName="d"> exists anywhere in this file. */}
        <path
          d="M 0 0 C 35 -15, 45 -55, 0 -100 C -45 -55, -35 -15, 0 0 Z"
          className="petal-body"
          fill="url(#petal-grad)"
          stroke="#4D4732"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Directional arrow (active petals only) */}
        {hasArrow && (
          <g transform={`translate(0,-48) rotate(${arrowRot})`}>
            <path
              d="M0,-10 L0,10 M0,-10 L-4.5,-4 M0,-10 L4.5,-4"
              stroke="#1B1C1C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )}

        {/* ── Sprint 1: Hemispheric affordance glyph ────────────────────
             Counter-rotated by -angle so the glyph always reads upright
             in the player's frame regardless of orbital position.         */}
        {hasArrow && (
          <text
            x="0" y="-22"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="800"
            fill="var(--ink)"
            transform={`rotate(${-angle})`}
            className="petal-glyph"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {isCCW ? '↺' : '↻'}
          </text>
        )}
      </g>
    </g>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 6 — DAISY FLOWER (main export)
   ══════════════════════════════════════════════════════════════════════════ */

const ORBIT_BY_COUNT = { 4: 76, 6: 80, 8: 83, 10: 85, 12: 86 };

/**
 * DaisyFlower — renders the interactive SVG daisy with Sprint 1 features.
 *
 * @param {object}  props
 * @param {object}  props.puzzle
 *   { level: number, center: string (Dir), petals: Petal[] }
 *   Petal: { idx, hasArrow, dir, aligned } — dir is a Dir string key
 * @param {string}  props.shapeKey      petal shape ('oval'|'leaf'|'diamond'|'spike'|'clover')
 * @param {string}  props.petalColor    base petal fill colour
 * @param {string}  props.accentColor   core circle + particle colour
 * @param {string}  props.emotionState  one of the 5 EMOTION_PROFILES keys
 * @param {function} props.onTap        (idx, angle) => void
 * @param {function} [props.onSwipe]    (idx, dx, dy) => void
 * @param {boolean}  [props.isWon]
 * @param {number|null} [props.hintIdx]
 * @param {object|null} [props.lastTap]
 * @param {React.Ref}   [props.circleRef]
 */
export function DaisyFlower({
  puzzle,
  shapeKey     = 'oval',
  petalColor   = '#FFFFFF',
  accentColor  = '#FFD700',
  emotionState = 'seeking',
  onTap,
  onSwipe,
  isWon        = false,
  hintIdx      = null,
  lastTap      = null,
  circleRef,
}) {
  const n      = puzzle.petals.length;
  const orbit  = ORBIT_BY_COUNT[n] ?? 83;
  const SZ     = 320;
  const C      = SZ / 2;

  const profile = EMOTION_PROFILES[emotionState] ?? EMOTION_PROFILES.seeking;

  /* ── Wire --breath-period CSS var to emotion profile ─────────────────── */
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--breath-period', `${profile.breathingPeriod}s`,
    );
  }, [profile.breathingPeriod]);

  /* ── Mutate gradient stops on emotion change (zero re-renders) ──────── */
  useEmotionalGradient(emotionState, petalColor, 'petal-grad');

  /* Map Dir string → degrees */
  const DIR_DEG = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };
  const centerDeg = DIR_DEG[puzzle.center] ?? 0;

  return (
    <div style={{ position: 'relative', width: SZ, height: SZ, flexShrink: 0 }}>
      <svg
        width={SZ}
        height={SZ}
        viewBox={`0 0 ${SZ} ${SZ}`}
        overflow="visible"
        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      >
        {/* Gradient for petal fill — id locked to "petal-grad" (hardcoded) */}
        <defs>
          <linearGradient
            id="petal-grad"
            x1="0" y1="1" x2="0" y2="0"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%"   stopColor={petalColor} />
            <stop offset="100%" stopColor={petalColor} />
          </linearGradient>
        </defs>

        {/* ── Sprint 1: .daisy-breathing class drives the scale animation.
             --breath-period on :root is updated by the useEffect above.
             The <g> wraps ALL petals so breathing is one unified organism. */}
        <g transform={`translate(${C},${C})`} className="daisy-breathing">

          {/* ── Sprint 1: Ambient particle ring — zero JS cost after mount */}
          <ParticleField count={profile.particleDensity} color={accentColor} />

          {/* ── Petals ── */}
          {puzzle.petals.map(p => (
            <Petal
              key={p.idx}
              idx={p.idx}
              angle={(360 / n) * p.idx}
              orbit={orbit}
              hasArrow={p.hasArrow}
              dirDeg={DIR_DEG[p.dir] ?? 0}
              aligned={p.aligned}
              isHint={p.idx === hintIdx}
              isWon={isWon}
              lastTap={lastTap}
              onTap={onTap}
              onSwipe={onSwipe}
            />
          ))}
        </g>
      </svg>

      {/* ── Fixed center core — HTML div, class-driven animations.
           Sprint 1: center-breathe speed is driven by --breath-period
           which the useEffect above writes to :root on every emotion change. */}
      <div
        ref={circleRef}
        className={isWon ? 'core-win' : 'center-breathe'}
        style={{
          position:       'absolute',
          width:          96,
          height:         96,
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%,-50%)',
          background:     accentColor,
          border:         '2px solid var(--ink)',
          borderRadius:   '9999px',
          boxShadow:      '4px 4px 0px 0px rgba(31,31,31,1)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         10,
        }}
      >
        {/* Center direction arrow — rotated to match puzzle.center */}
        <svg
          width="28" height="28"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: `rotate(${centerDeg}deg)` }}
        >
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="#1B1C1C"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
