import { DIR_DEG, type Direction, type Puzzle } from "@/lib/puzzles";

type Props = {
  puzzle: Puzzle;
  petalDirs: (Direction | null)[];
  onTapPetal: (index: number) => void;
  bursting?: boolean;
};

const SIZE = 320;          // viewBox
const CENTER = SIZE / 2;
const PETAL_RX = 30;
const PETAL_RY = 56;
const PETAL_DIST = 96;     // distance from center to petal center
const CENTER_R = 48;

function ArrowSvg({ size = 28, color = "#1b1c1c" }: { size?: number; color?: string }) {
  // Arrow points UP (north) at rotation 0
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 L12 21 M12 3 L6 9 M12 3 L18 9"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Daisy({ puzzle, petalDirs, onTapPetal, bursting }: Props) {
  const { petalCount, centerDir } = puzzle;
  const step = 360 / petalCount;

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: SIZE, height: SIZE, maxWidth: "90vw", aspectRatio: "1 / 1" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full">
        {/* Petals */}
        {puzzle.petals.map((spec, i) => {
          const angle = i * step; // around center; 0 = up
          const dir = petalDirs[i];
          const arrowRot = dir ? DIR_DEG[dir] : 0;
          // Burst translate vector
          const rad = (angle - 90) * (Math.PI / 180);
          const tx = Math.cos(rad) * PETAL_DIST;
          const ty = Math.sin(rad) * PETAL_DIST;

          return (
            <g
              key={i}
              transform={`translate(${CENTER} ${CENTER}) rotate(${angle}) translate(0 ${-PETAL_DIST})`}
              onPointerDown={(e) => {
                e.preventDefault();
                if (!bursting && spec.hasArrow) onTapPetal(i);
              }}
              style={{
                cursor: spec.hasArrow ? "pointer" : "default",
                transformOrigin: "center",
                ["--tx" as string]: `${tx}px`,
                ["--ty" as string]: `${ty}px`,
              }}
              className={bursting ? "animate-petal-burst" : ""}
            >
              <ellipse
                cx={0}
                cy={0}
                rx={PETAL_RX}
                ry={PETAL_RY}
                fill="#FFFFFF"
                stroke="#4d4732"
                strokeWidth={2}
              />
              {spec.hasArrow && (
                <g transform={`rotate(${arrowRot - angle})`}>
                  <foreignObject x={-14} y={-14} width={28} height={28}>
                    <div style={{ width: 28, height: 28 }}>
                      <ArrowSvg size={28} />
                    </div>
                  </foreignObject>
                </g>
              )}
            </g>
          );
        })}

        {/* Center circle */}
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle
            r={CENTER_R}
            fill="#FFD700"
            stroke="#4d4732"
            strokeWidth={2}
          />
          <g transform={`rotate(${DIR_DEG[centerDir]})`}>
            <foreignObject x={-20} y={-20} width={40} height={40}>
              <div style={{ width: 40, height: 40 }}>
                <ArrowSvg size={40} color="#ffffff" />
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    </div>
  );
}
