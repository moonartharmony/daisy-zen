import {
  useRef, useEffect, useState,
  type RefObject, type CSSProperties,
} from 'react';
import { DIR_DEG, spinDir } from './types';
import type { Puzzle, Chapter } from './types';
import type { LastTap } from './useGame';
import { Arrow, CenterOverlay } from './shapes';
import {
  PETAL_NUMS, numsToPath, lerpNums, easeInOut3,
  type PetalShapeKey,
} from './pathMorph';

/* ── Orbit radius by petal count ── */
const ORBIT: Record<number, number> = { 4: 76, 6: 80, 8: 83, 10: 85, 12: 86 };
const orbitFor = (n: number) => ORBIT[n] ?? 83;

/* Swipe threshold in px — below this distance the gesture reads as a tap */
const SWIPE_THRESHOLD = 16;

/* ── Emotional state ──────────────────────────────────────────────────────── */
export type EmotionalState = 'calm' | 'anxious' | 'melancholic';

function emotionTipColor(state: EmotionalState, petalColor: string): string {
  if (state === 'anxious')     return '#E8C4B0'; // warm amber-rose
  if (state === 'melancholic') return '#B8C8DA'; // cool slate-blue
  return petalColor;
}

/* ── Phase 1: Chapter petal-shape morphing ───────────────────────────────────
   Interpolates between the previous shape's 24-number array and the new one
   over 800ms using ease-in-out cubic. A single rAF loop runs the morph;
   only one React state update fires per frame.                               */
function useMorphPath(shape: PetalShapeKey): string {
  const target     = PETAL_NUMS[shape] ?? PETAL_NUMS.oval;
  const currentRef = useRef<readonly number[]>(target);
  const prevShape  = useRef<PetalShapeKey>(shape);
  const rafRef     = useRef<number>(0);
  const [path, setPath] = useState<string>(() => numsToPath(target));

  useEffect(() => {
    if (shape === prevShape.current) return;
    prevShape.current = shape;

    const from = currentRef.current;
    const to   = PETAL_NUMS[shape] ?? PETAL_NUMS.oval;
    const dur  = 800;
    const t0   = performance.now();

    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const raw          = Math.min((now - t0) / dur, 1);
      const t            = easeInOut3(raw);
      const interpolated = lerpNums(from, to, t);
      currentRef.current = interpolated;
      setPath(numsToPath(interpolated));
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shape]);

  return path;
}

/* ── Phase 2: Emotional gradient updater ────────────────────────────────────
   Directly mutates the SVG <linearGradient> stop colours when emotional
   state changes — no React re-render needed for all petals.                  */
function useEmotionalGradient(
  state:      EmotionalState,
  petalColor: string,
  gradId:     string,
) {
  useEffect(() => {
    const tipColor = emotionTipColor(state, petalColor);
    const el = document.getElementById(gradId);
    if (!el) return;
    const stops = el.querySelectorAll('stop');
    if (stops.length >= 2) {
      (stops[0] as SVGStopElement).setAttribute('stop-color', petalColor);
      (stops[1] as SVGStopElement).setAttribute('stop-color', tipColor);
    }
  }, [state, petalColor, gradId]);
}

/* ── Single Petal ────────────────────────────────────────────────────────────
   Two-layer <g> architecture:

   OUTER <g>  — orbital positioning via SVG `transform` attribute only.
                Never touched imperatively. Stable across all re-renders.

   INNER <g>  — all interactive feedback via CSS `transform` property:
                • spring press (.petal-pressed)
                • win burst (translate + scale outward then back)
                • shake / align-flash / hint-bounce animations

   Why two layers? CSS `translate` and `scale` individual properties do NOT
   apply to SVG elements (computed value stays 0px / 1 — confirmed via
   getComputedStyle). The CSS `transform` shorthand DOES work on SVG but
   overrides the SVG `transform` attribute. Separating the two layers
   eliminates all conflicts.

   Burst direction: outer <g> rotates the local coord system so -Y always
   points radially outward — burst offset is always translate(0, -N px).     */

interface PetalProps {
  idx:      number;
  angle:    number;    // placement angle in degrees (0–360)
  orbit:    number;
  hasArrow: boolean;
  dirDeg:   number;
  aligned:  boolean;
  isHint:   boolean;
  isWon:    boolean;
  lastTap:  LastTap;
  path:     string;    // morphed path from useMorphPath
  gradId:   string;    // SVG gradient id
  onTap:    (idx: number, angle: number) => void;
  onSwipe:  (idx: number, dx: number, dy: number) => void;
}

const Petal = ({
  idx, angle, orbit, hasArrow, dirDeg, aligned,
  isHint, isWon, lastTap, path, gradId, onTap, onSwipe,
}: PetalProps) => {
  const innerRef = useRef<SVGGElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  /* ── System 1: lastTap animations ───────────────────────────────── */
  useEffect(() => {
    if (!innerRef.current || !lastTap || lastTap.idx !== idx) return;
    const el = innerRef.current;

    if (lastTap.result === 'misaligned') {
      el.classList.add('anim-shake');
      const id = setTimeout(() => el.classList.remove('anim-shake'), 220);
      return () => clearTimeout(id);
    }
    if (lastTap.result === 'aligned') {
      el.classList.add('anim-align-flash');
      const id = setTimeout(() => el.classList.remove('anim-align-flash'), 340);
      return () => clearTimeout(id);
    }
  }, [lastTap]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Hint bounce ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!innerRef.current || !isHint) return;
    const el = innerRef.current;
    el.classList.add('anim-hint-bounce');
    const id = setTimeout(() => el.classList.remove('anim-hint-bounce'), 620);
    return () => clearTimeout(id);
  }, [isHint]);

  /* ── Win burst ───────────────────────────────────────────────────
     Uses `el.style.transform` (CSS transform property) on the inner
     <g>. The outer <g>'s SVG attribute rotation means -Y is always
     outward, so translate(0, -BURST px) needs no trigonometry.        */
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
          if (el.isConnected) {
            el.style.transition = '';
            el.style.transform  = '';
          }
        }, 420);
        return () => clearTimeout(t3);
      }, 500 + delay);
      return () => clearTimeout(t2);
    }, delay);

    return () => clearTimeout(t1);
  }, [isWon]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Pointer handlers — tap vs swipe discrimination ─────────────── */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!hasArrow || isWon) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!hasArrow || isWon) return;
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;

    const dx   = e.clientX - start.x;
    const dy   = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);

    // Spring press feedback on any intent
    const el = innerRef.current;
    if (el) {
      el.classList.add('petal-pressed');
      setTimeout(() => el.classList.remove('petal-pressed'), 80);
    }

    if (dist < SWIPE_THRESHOLD) {
      onTap(idx, angle);
    } else {
      onSwipe(idx, dx, dy);
    }
  };

  const handlePointerCancel = () => { startRef.current = null; };

  const arrowRot = dirDeg - angle;
  const isCCW    = spinDir(angle) === 'ccw';

  return (
    /* OUTER: orbital positioning — SVG attribute, never touched imperatively */
    <g transform={`rotate(${angle}) translate(0,-${orbit})`}>

      {/* INNER: CSS feedback layer — spring, burst, shake, flash */}
      <g
        ref={innerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="petal-group"
        style={{
          cursor:          hasArrow ? 'pointer' : 'default',
          transformOrigin: '0 0',
          touchAction:     'none',
        } as CSSProperties}
      >
        {/* Hint glow ring */}
        {isHint && (
          <ellipse
            cx="0" cy="-46" rx="28" ry="46"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3.5"
            opacity="0.7"
            className="anim-hglow"
          />
        )}

        {/* Petal body — gradient fill driven by emotional state */}
        <path
          d={path}
          className="petal-body"
          fill={`url(#${gradId})`}
          stroke="#4D4732"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Directional arrow */}
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

        {/* Spin direction indicator ↻ / ↺ — nested <svg>, not foreignObject */}
        {hasArrow && (
          <svg
            x="-5" y="-25"
            width="10" height="10"
            viewBox="0 0 24 24"
            fill="none"
            opacity="0.4"
            overflow="visible"
          >
            {isCCW ? (
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66M20 3v5h-5"
                stroke="#1B1C1C" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 12a8 8 0 1 0 2.34-5.66M4 3v5h5"
                stroke="#1B1C1C" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </svg>
        )}
      </g>
    </g>
  );
};

/* ── Canvas ── */
interface Props {
  puzzle:         Puzzle;
  chapter:        Chapter;
  onTap:          (idx: number, angle: number) => void;
  onSwipe:        (idx: number, dx: number, dy: number) => void;
  isWon:          boolean;
  hintIdx:        number | null;
  lastTap:        LastTap;
  emotionalState: EmotionalState;
  circleRef:      RefObject<HTMLDivElement | null>;
}

export const DaisyCanvas = ({
  puzzle, chapter, onTap, onSwipe, isWon, hintIdx,
  lastTap, emotionalState, circleRef,
}: Props) => {
  const n      = puzzle.petals.length;
  const orbit  = orbitFor(n);
  const SZ     = 320;
  const C      = SZ / 2;
  const gradId = 'petal-grad';

  // Phase 1: morphed path — smooth shape interpolation on chapter change
  const morphedPath = useMorphPath(chapter.petalShape as PetalShapeKey);

  // Phase 2: emotional gradient — DOM mutation, no full re-render
  useEmotionalGradient(emotionalState, chapter.petalColor, gradId);

  const centerRadius = chapter.ctrShape === 'hexagon' || chapter.ctrShape === 'hexbump'
    ? '14px'
    : '9999px';

  return (
    <div style={{ position: 'relative', width: SZ, height: SZ, flexShrink: 0 }}>
      {/*
        Phase 3: .daisy-svg gets `filter: brightness(var(--audio-pulse))`.
        --audio-pulse (0.97–1.03) is written every rAF by useAudio's FFT loop.
        Result: the entire daisy subtly breathes in sync with the ambient drone.
      */}
      <svg
        className="daisy-svg"
        width={SZ}
        height={SZ}
        viewBox={`0 0 ${SZ} ${SZ}`}
        overflow="visible"
        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      >
        {/* Phase 2: gradient tip colour shifts with emotional state */}
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0"
            gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor={chapter.petalColor} />
            <stop offset="100%" stopColor={emotionTipColor(emotionalState, chapter.petalColor)} />
          </linearGradient>
        </defs>

        <g transform={`translate(${C},${C})`}>
          {puzzle.petals.map(p => (
            <Petal
              key={p.idx}
              idx={p.idx}
              angle={(360 / n) * p.idx}
              orbit={orbit}
              hasArrow={p.hasArrow}
              dirDeg={DIR_DEG[p.dir]}
              aligned={p.aligned}
              isHint={p.idx === hintIdx}
              isWon={isWon}
              lastTap={lastTap}
              path={morphedPath}
              gradId={gradId}
              onTap={onTap}
              onSwipe={onSwipe}
            />
          ))}
        </g>
      </svg>

      {/* Center circle — HTML div, class-driven animations */}
      <div
        ref={circleRef}
        className={isWon ? 'anim-cwin' : 'center-breathe'}
        style={{
          position:       'absolute',
          width:          96,
          height:         96,
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%,-50%)',
          background:     '#FFD700',
          border:         '2px solid #4D4732',
          borderRadius:   centerRadius,
          boxShadow:      '4px 4px 0px 0px rgba(77,71,50,1)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         10,
        }}
      >
        <CenterOverlay shape={chapter.ctrShape} size={96} />
        <Arrow deg={DIR_DEG[puzzle.center]} light size={28} />
      </div>
    </div>
  );
};
