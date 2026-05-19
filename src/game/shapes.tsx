import type { PetalShape, CenterShape, Chapter } from './types';

/* ── PETAL PATHS ─────────────────────────────────────────────
   Origin at (0,0) = petal base. Path goes upward (negative Y).
   Param `s` scales the shape uniformly (pass 1 for full size). */
export const PETAL_PATHS: Record<PetalShape, (s: number) => string> = {
  /* THE GARDEN — wide, generously rounded oval */
  oval: s =>
    `M 0,0 C ${22*s},-${14*s} ${30*s},-${58*s} ${4*s},-${94*s}` +
    ` C -${30*s},-${58*s} -${22*s},-${14*s} 0,0 Z`,

  /* THE FOREST — softer, rounder leaf */
  leaf: s =>
    `M 0,0 C ${22*s},-${22*s} ${26*s},-${60*s} ${10*s},-${94*s}` +
    ` C ${2*s},-${110*s} -${14*s},-${94*s} -${20*s},-${66*s}` +
    ` C -${26*s},-${40*s} -${16*s},-${18*s} 0,0 Z`,

  /* THE MOUNTAIN — rounded diamond / kite (soft corners) */
  diamond: s =>
    `M 0,0 C ${22*s},-${18*s} ${24*s},-${50*s} ${14*s},-${72*s}` +
    ` C ${8*s},-${88*s} ${4*s},-${94*s} 0,-${94*s}` +
    ` C -${4*s},-${94*s} -${8*s},-${88*s} -${14*s},-${72*s}` +
    ` C -${24*s},-${50*s} -${22*s},-${18*s} 0,0 Z`,

  /* THE STORM — rounded spike (fuller body) */
  spike: s =>
    `M 0,0 C ${16*s},-${14*s} ${20*s},-${50*s} ${10*s},-${82*s}` +
    ` C ${6*s},-${94*s} -${6*s},-${94*s} -${10*s},-${82*s}` +
    ` C -${20*s},-${50*s} -${16*s},-${14*s} 0,0 Z`,

  /* THE VOID — fuller double-lobed clover */
  clover: s =>
    `M 0,0 C -${24*s},-${10*s} -${30*s},-${40*s} -${16*s},-${54*s}` +
    ` C -${2*s},-${66*s} -${2*s},-${72*s} 0,-${90*s}` +
    ` C ${2*s},-${72*s} ${2*s},-${66*s} ${16*s},-${54*s}` +
    ` C ${30*s},-${40*s} ${24*s},-${10*s} 0,0 Z`,
};

/* ── ARROW ───────────────────────────────────────────────── */
export const Arrow = ({
  deg,
  light = false,
  size  = 22,
}: {
  deg:    number;
  light?: boolean;
  size?:  number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform:  `rotate(${deg}deg)`,
      transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
      display:    'block',
      flexShrink: 0,
    }}
  >
    <path
      d="M12 4v16M12 4L7 9M12 4l5 5"
      stroke={light ? '#FFFFFF' : '#1B1C1C'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── SPIN DIRECTION INDICATOR (tiny ↻ / ↺ on each petal) ── */
export const SpinIndicator = ({ ccw }: { ccw: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'block', opacity: 0.38 }}
  >
    {ccw ? (
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 3v5h-5"
        stroke="#1B1C1C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M4 12a8 8 0 1 0 2.34-5.66M4 3v5h5"
        stroke="#1B1C1C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

/* ── CENTER OVERLAY (decorative shape inside yellow circle) ─ */
export const CenterOverlay = ({
  shape,
  size = 96,
}: {
  shape: CenterShape;
  size?: number;
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2;

  if (shape === 'circle') return null;

  if (shape === 'hexbump') {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a  = (Math.PI * 2 / 6) * i - Math.PI / 2;
      const rb = r * 0.84 + r * 0.16 * Math.abs(Math.cos(3 * a));
      return `${cx + rb * Math.cos(a)},${cy + rb * Math.sin(a)}`;
    }).join(' ');
    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <polygon points={pts} fill="#FFD700" stroke="#4D4732" strokeWidth="2" />
      </svg>
    );
  }

  if (shape === 'hexagon') {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI * 2 / 6) * i - Math.PI / 6;
      return `${cx + r * 0.86 * Math.cos(a)},${cy + r * 0.86 * Math.sin(a)}`;
    }).join(' ');
    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <polygon points={pts} fill="#FFD700" stroke="#4D4732" strokeWidth="2" />
      </svg>
    );
  }

  if (shape === 'rough') {
    const pts = Array.from({ length: 14 }, (_, i) => {
      const a  = (Math.PI * 2 / 14) * i;
      const rb = r * (i % 2 === 0 ? 0.84 : 0.70);
      return `${cx + rb * Math.cos(a)},${cy + rb * Math.sin(a)}`;
    }).join(' ');
    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <polygon points={pts} fill="#FFD700" stroke="#4D4732" strokeWidth="2" />
      </svg>
    );
  }

  if (shape === 'double') {
    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <circle cx={cx} cy={cy} r={r * 0.86} fill="#FFD700" stroke="#4D4732" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r * 0.54} fill="none"    stroke="#4D4732" strokeWidth="1.5" />
      </svg>
    );
  }

  return null;
};

/* ── CHAPTER SILHOUETTE (spinning background on win screen) ─ */
export const ChapterSilhouette = ({
  chapter,
  n = 8,
}: {
  chapter: Chapter;
  n?:      number;
}) => {
  const sz    = 260;
  const cx    = sz / 2;
  const cy    = sz / 2;
  const orbit = 76;
  const path  = PETAL_PATHS[chapter.petalShape]?.(0.9);

  return (
    <svg
      width={sz}
      height={sz}
      viewBox={`0 0 ${sz} ${sz}`}
      className="anim-spin"
      style={{ opacity: 0.1 }}
    >
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          d={path}
          fill={chapter.petalColor}
          transform={`translate(${cx},${cy + orbit}) rotate(${(360 / n) * i},0,-${orbit})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={32} fill="#FFD700" />
    </svg>
  );
};
