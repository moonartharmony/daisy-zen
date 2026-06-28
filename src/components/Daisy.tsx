import { DIR_DEG, type Direction, type Puzzle } from "@/lib/puzzles";

export type PetalAnim = "pressed" | "aligned" | "error" | "hint" | null;

type Props = {
  puzzle: Puzzle;
  petalDirs: (Direction | null)[];
  petalAnims: PetalAnim[];
  onTapPetal: (index: number) => void;
  bursting?: boolean;
  centerPulsing?: boolean;
  centerGlow?: boolean;
  petalColor?: string;
};

const SIZE = 320;
const CENTER = SIZE / 2;
const PETAL_RX = 30;
const PETAL_RY = 56;
const PETAL_DIST = 96;
const CENTER_R = 48;

function ArrowSvg({ size = 28, color = "#1b1c1c" }: { size?: number; color?: string }) {
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

export function Daisy({
  puzzle,
  petalDirs,
  petalAnims,
  onTapPetal,
  bursting,
  centerPulsing,
  centerGlow,
  petalColor = "#FFFFFF",
}: Props) {
  const { petalCount, centerDir } = puzzle;
  const step = 360 / petalCount;

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: SIZE, height: SIZE, maxWidth: "90vw", aspectRatio: "1 / 1" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full">
        {puzzle.petals.map((spec, i) => {
          const angle = i * step;
          const dir = petalDirs[i];
          const arrowRot = dir ? DIR_DEG[dir] : 0;
          const rad = (angle - 90) * (Math.PI / 180);
          const tx = Math.cos(rad) * PETAL_DIST;
          const ty = Math.sin(rad) * PETAL_DIST;
          const anim = petalAnims[i];

          const animClass =
            anim === "pressed"
              ? "petal-pressed"
              : anim === "aligned"
                ? "petal-aligned"
                : anim === "error"
                  ? "petal-error"
                  : anim === "hint"
                    ? "petal-hint"
                    : "";

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
                ["--tx" as string]: `${tx}px`,
                ["--ty" as string]: `${ty}px`,
              }}
              className={bursting ? "animate-petal-burst" : ""}
            >
              <ellipse cx={2} cy={2} rx={PETAL_RX} ry={PETAL_RY} fill="#4d4732" />
              <g className={`petal-inner ${animClass}`}>
                <ellipse
                  className="petal-body"
                  cx={0}
                  cy={0}
                  rx={PETAL_RX}
                  ry={PETAL_RY}
                  fill={petalColor}
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
            </g>
          );
        })}

        {/* Center circle */}
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle cx={4} cy={4} r={CENTER_R} fill="#4d4732" />
          <g
            className={
              centerGlow ? "center-glow" : centerPulsing ? "center-pulse" : ""
            }
          >
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
        </g>
      </svg>
    </div>
  );
}
