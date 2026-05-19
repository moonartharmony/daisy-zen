import { useRef, useEffect, type RefObject } from 'react';
import { DIR_DEG, spinDir } from './types';
import type { Puzzle, Chapter } from './types';
import { PETAL_PATHS, Arrow, SpinIndicator, CenterOverlay } from './shapes';

/* ── Orbit radius by petal count ── */
const ORBIT: Record<number, number> = { 4: 76, 6: 80, 8: 83, 10: 85, 12: 86 };
const orbitFor = (n: number) => ORBIT[n] ?? 83;

/* ── Single Petal (SVG <g>) ── */
interface PetalProps {
  idx:      number;
  angle:    number;   /* placement angle in degrees (0–360) */
  orbit:    number;
  hasArrow: boolean;
  dirDeg:   number;
  aligned:  boolean;
  isHint:   boolean;
  isWon:    boolean;
  chapter:  Chapter;
  onTap:    (idx: number, angle: number) => void;
  onSwipe:  (idx: number, dx: number, dy: number) => void;
}

const SWIPE_THRESHOLD = 16; // px — below this counts as a tap

const Petal = ({
  idx, angle, orbit, hasArrow, dirDeg, aligned,
  isHint, isWon, chapter, onTap, onSwipe,
}: PetalProps) => {
  const gRef    = useRef<SVGGElement>(null);
  const prevAl  = useRef(aligned);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  /* Align flash */
  useEffect(() => {
    if (!gRef.current) return;
    if (aligned && !prevAl.current) {
      gRef.current.classList.add('anim-align');
      setTimeout(() => gRef.current?.classList.remove('anim-align'), 400);
    }
    prevAl.current = aligned;
  }, [aligned]);

  /* Win burst — petals jump outward one by one */
  useEffect(() => {
    if (!gRef.current || !isWon) return;
    const el    = gRef.current;
    const burst = orbit + 55;
    const delay = idx * 35;
    setTimeout(() => {
      el.style.transition = `transform 500ms cubic-bezier(0.34,1.56,0.64,1)`;
      el.setAttribute('transform', `rotate(${angle}) translate(0,-${burst}) scale(1.14)`);
      setTimeout(() => {
        el.style.transition = `transform 400ms ease-out`;
        el.setAttribute('transform', `rotate(${angle}) translate(0,-${orbit})`);
      }, 500 + delay);
    }, delay);
  }, [isWon]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (gRef.current) {
      gRef.current.classList.add('anim-bounce');
      setTimeout(() => gRef.current?.classList.remove('anim-bounce'), 170);
    }

    if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) {
      onTap(idx, angle);
    } else {
      onSwipe(idx, dx, dy);
    }
  };

  const handlePointerCancel = () => {
    startRef.current = null;
  };


  /* Arrow counter-rotates so it always reads in absolute screen space */
  const arrowRot = dirDeg - angle;
  const isCCW    = spinDir(angle) === 'ccw';
  const path     = PETAL_PATHS[chapter.petalShape]?.(1);

  return (
    <g
      ref={gRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      transform={`rotate(${angle}) translate(0,-${orbit})`}
      style={{
        cursor:           hasArrow ? 'pointer' : 'default',
        transformOrigin:  '0 0',
        touchAction:      'none',
      }}
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

      {/* Petal body */}
      <path
        d={path}
        fill={chapter.petalColor}
        stroke="#4D4732"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Arrow (counter-rotated to point in absolute direction) */}
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

      {/* Spin direction indicator */}
      {hasArrow && (
        <foreignObject x="-5" y="-20" width="10" height="10">
          <SpinIndicator ccw={isCCW} />
        </foreignObject>
      )}
    </g>
  );
};

/* ── Canvas ── */
interface Props {
  puzzle:    Puzzle;
  chapter:   Chapter;
  onTap:     (idx: number, angle: number) => void;
  isWon:     boolean;
  hintIdx:   number | null;
  circleRef: RefObject<HTMLDivElement | null>;
}

export const DaisyCanvas = ({
  puzzle, chapter, onTap, isWon, hintIdx, circleRef,
}: Props) => {
  const n     = puzzle.petals.length;
  const orbit = orbitFor(n);
  const SZ    = 320;
  const C     = SZ / 2;

  const centerRadius = chapter.ctrShape === 'hexagon' || chapter.ctrShape === 'hexbump'
    ? '14px'
    : '9999px';

  return (
    <div
      style={{ position: 'relative', width: SZ, height: SZ, flexShrink: 0 }}
    >
      {/* SVG petals */}
      <svg
        width={SZ}
        height={SZ}
        viewBox={`0 0 ${SZ} ${SZ}`}
        overflow="visible"
        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      >
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
              chapter={chapter}
              onTap={onTap}
            />
          ))}
        </g>
      </svg>

      {/* Center circle — HTML div for animation class support */}
      <div
        ref={circleRef}
        className={isWon ? 'anim-cwin' : ''}
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
