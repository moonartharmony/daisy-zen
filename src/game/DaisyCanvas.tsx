import { useRef, useEffect, type RefObject } from 'react';
import { DIR_DEG } from './types';
import type { Puzzle } from './types';

/* ── Petal size table by petal count ── */
const SIZE_TABLE: Record<number, { w: number; h: number; orbit: number }> = {
  4:  { w: 64,  h: 112, orbit: 72 },
  6:  { w: 56,  h: 100, orbit: 76 },
  8:  { w: 50,  h: 90,  orbit: 78 },
  10: { w: 44,  h: 82,  orbit: 80 },
  12: { w: 38,  h: 74,  orbit: 80 },
};
const sizeFor = (n: number) => SIZE_TABLE[n] ?? SIZE_TABLE[8];

/* ── Arrow SVG — always points up (north), rotated by CSS ── */
const Arrow = ({ deg, white }: { deg: number; white?: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform:  `rotate(${deg}deg)`,
      transition: 'transform 180ms cubic-bezier(0.34,1.56,0.64,1)',
      flexShrink: 0,
    }}
  >
    <path
      d="M12 4v16M12 4L7 9M12 4l5 5"
      stroke={white ? '#fff' : '#1B1C1C'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Single Petal ── */
interface PetalProps {
  idx:      number;
  angle:    number;
  sz:       { w: number; h: number; orbit: number };
  hasArrow: boolean;
  dirDeg:   number;
  aligned:  boolean;
  isHint:   boolean;
  isWon:    boolean;
  onTap:    (i: number) => void;
}

const Petal = ({ idx, angle, sz, hasArrow, dirDeg, aligned, isHint, isWon, onTap }: PetalProps) => {
  const ref         = useRef<HTMLDivElement>(null);
  const prevAligned = useRef(aligned);

  /* Align flash */
  useEffect(() => {
    if (!ref.current) return;
    if (aligned && !prevAligned.current) {
      ref.current.classList.add('petal-align');
      setTimeout(() => ref.current?.classList.remove('petal-align'), 360);
    }
    prevAligned.current = aligned;
  }, [aligned]);

  /* Win burst */
  useEffect(() => {
    if (!ref.current || !isWon) return;
    ref.current.style.setProperty('--a',     `${angle}deg`);
    ref.current.style.setProperty('--orbit', `-${sz.orbit + sz.h / 2}px`);
    ref.current.classList.add('petal-burst');
    const t = setTimeout(
      () => ref.current?.classList.remove('petal-burst'),
      600 + idx * 40,
    );
    return () => clearTimeout(t);
  }, [isWon]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = () => {
    if (!hasArrow || isWon) return;
    ref.current?.classList.add('petal-bounce');
    setTimeout(() => ref.current?.classList.remove('petal-bounce'), 160);
    onTap(idx);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={isHint ? 'hint-glow' : ''}
      style={{
        position:        'absolute',
        width:           sz.w,
        height:          sz.h,
        left:            '50%',
        top:             '50%',
        marginLeft:      -sz.w / 2,
        marginTop:       -(sz.orbit + sz.h),
        transformOrigin: `${sz.w / 2}px ${sz.orbit + sz.h}px`,
        transform:       `rotate(${angle}deg)`,
        background:      'white',
        border:          '2px solid #4D4732',
        borderRadius:    9999,
        boxShadow:       '2px 2px 0px 0px rgba(77,71,50,1)',
        display:         'flex',
        alignItems:      'flex-start',
        justifyContent:  'center',
        paddingTop:      10,
        cursor:          hasArrow ? 'pointer' : 'default',
        zIndex:          1,
        transition:      'background 350ms ease-out, border-color 350ms ease-out',
      }}
    >
      {hasArrow && <Arrow deg={dirDeg - angle} />}
    </div>
  );
};

/* ── Canvas ── */
interface Props {
  puzzle:    Puzzle;
  onTap:     (i: number) => void;
  isWon:     boolean;
  hintIdx:   number | null;
  circleRef: RefObject<HTMLDivElement | null>;
}

export const DaisyCanvas = ({ puzzle, onTap, isWon, hintIdx, circleRef }: Props) => {
  const n  = puzzle.petals.length;
  const sz = sizeFor(n);

  return (
    <div style={{ position: 'relative', width: 320, height: 320, flexShrink: 0 }}>
      {puzzle.petals.map(p => (
        <Petal
          key={p.idx}
          idx={p.idx}
          angle={(360 / n) * p.idx}
          sz={sz}
          hasArrow={p.hasArrow}
          dirDeg={DIR_DEG[p.dir]}
          aligned={p.aligned}
          isHint={p.idx === hintIdx}
          isWon={isWon}
          onTap={onTap}
        />
      ))}

      {/* Center circle */}
      <div
        ref={circleRef}
        className={isWon ? 'center-win' : ''}
        style={{
          position:       'absolute',
          width:          96,
          height:         96,
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%, -50%)',
          background:     '#FFD700',
          border:         '2px solid #4D4732',
          borderRadius:   9999,
          boxShadow:      '4px 4px 0px 0px rgba(77,71,50,1)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         10,
        }}
      >
        <Arrow deg={DIR_DEG[puzzle.center]} white />
      </div>
    </div>
  );
};
