import { useRef } from "react";
import { DIR_DEG, type Direction, type Puzzle } from "@/lib/puzzles";

export type PetalAnim = "tapped" | "aligned" | "error" | "hint" | null;

type Props = {
  puzzle: Puzzle;
  petalDirs: (Direction | null)[];
  petalAnims: PetalAnim[];
  onTapPetal: (index: number) => void;
  onSwipePetal: (index: number, dir: Direction) => void;
  bursting?: boolean;
  centerPulsing?: boolean;
  centerGlow?: boolean;
  petalColor?: string;
};

const SWIPE_THRESHOLD = 18; // px — below this counts as a tap

function angleToCardinal(dx: number, dy: number): Direction {
  // Screen coords: +x right (east), +y down (south).
  const a = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
  if (a >= -45 && a < 45) return "east";
  if (a >= 45 && a < 135) return "south";
  if (a >= -135 && a < -45) return "north";
  return "west";
}

const SIZE = 360;
const CENTER = SIZE / 2;
const PETAL_RX = 28;
const PETAL_RY = 54;
const PETAL_DIST = 114;
const CENTER_R = 44;

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
  onSwipePetal,
  bursting,
  centerPulsing,
  centerGlow,
  petalColor = "#FFFFFF",
}: Props) {
  const { petalCount, centerDir } = puzzle;
  const step = 360 / petalCount;
  const startRef = useRef<Map<number, { x: number; y: number; idx: number }>>(
    new Map(),
  );

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
            anim === "tapped"
              ? "petal-tapped"
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
                if (bursting || !spec.hasArrow) return;
                e.preventDefault();
                (e.target as Element).setPointerCapture?.(e.pointerId);
                startRef.current.set(e.pointerId, {
                  x: e.clientX,
                  y: e.clientY,
                  idx: i,
                });
              }}
              onPointerUp={(e) => {
                if (bursting || !spec.hasArrow) return;
                const start = startRef.current.get(e.pointerId);
                startRef.current.delete(e.pointerId);
                if (!start || start.idx !== i) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) {
                  onTapPetal(i);
                } else {
                  onSwipePetal(i, angleToCardinal(dx, dy));
                }
              }}
              onPointerCancel={(e) => {
                startRef.current.delete(e.pointerId);
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
