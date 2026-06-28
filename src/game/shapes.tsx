import type { PetalShape, CenterShape, Chapter } from './types';

/* ── PETAL PATHS ─────────────────────────────────────────────
   Origin at (0,0) = petal base. Path goes upward (negative Y).
   Param `s` scales the shape uniformly (pass 1 for full size). */
export const PETAL_PATHS: Record<PetalShape, (s: number) => string> = {
  /* THE GARDEN — classic rounded oval */
  oval: s =>
    `M 0,0 C ${10*s},-${18*s} ${17*s},-${54*s} 0,-${92*s}` +
    ` C -${17*s},-${54*s} -${10*s},-${18*s} 0,0 Z`,

  /* THE FOREST — pointed asymmetric leaf */
  leaf: s =>
    `M 0,0 C ${13*s},-${22*s} ${17*s},-${58*s} ${8*s},-${92*s}` +
    ` C ${1*s},-${108*s} -${11*s},-${92*s} -${14*s},-${64*s}` +
    ` C -${18*s},-${38*s} -${9*s},-${18*s} 0,0 Z`,

  /* THE MOUNTAIN — angular diamond / kite */
  diamond: s =>
    `M 0,0 L ${13*s},-${36*s} L 0,-${92*s} L -${13*s},-${36*s} Z`,

  /* THE STORM — thin spike */
  spike: s =>
    `M 0,0 L ${6*s},-${30*s} L ${2.5*s},-${92*s}` +
    ` L -${2.5*s},-${92*s} L -${6*s},-${30*s} Z`,

  /* THE VOID — double-lobed clover */
  clover: s =>
    `M 0,0 C -${20*s},-${9*s} -${27*s},-${38*s} -${12*s},-${52*s}` +
    ` C ${3*s},-${66*s} ${3*s},-${68*s} 0,-${86*s}` +
    ` C -${3*s},-${68*s} -${3*s},-${66*s} ${12*s},-${52*s}` +
    ` C ${27*s},-${38*s} ${20*s},-${9*s} 0,0 Z`,
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
