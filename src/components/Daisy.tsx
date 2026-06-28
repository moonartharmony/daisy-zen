import type { Puzzle } from "@/lib/puzzles";
import type { WorldSnapshot } from "@/engine/types";

export type PetalAnim = "pressed" | "aligned" | "error" | "hint" | null;

type Props = {
  puzzle: Puzzle;
  snapshot: WorldSnapshot;
  petalAnims: PetalAnim[];
  onTapPetal: (index: number) => void;
  bursting?: boolean;
  centerPulsing?: boolean;
  centerGlow?: boolean;
  petalColor?: string;
  petalColors?: string[];
  idleSpin?: boolean;
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

/**
 * Daisy is a pure projection of a WorldSnapshot — it owns no animated
 * state of its own. Rotation, openness, and breath all come from the
 * engine. Only short-lived feedback flashes (pressed / aligned / error
 * / hint) ride on CSS classes layered on top.
 */
export function Daisy({
  puzzle,
  snapshot,
  petalAnims,
  onTapPetal,
  bursting,
  centerPulsing,
  centerGlow,
  petalColor = "#FFFFFF",
  petalColors,
  idleSpin = false,
}: Props) {
  const { petalCount, centerDir } = puzzle;
  const step = 360 / petalCount;
  // Center arrow direction comes from puzzle (absolute compass).
  const centerDeg = ({
    north: 0, northeast: 45, east: 90, southeast: 135,
    south: 180, southwest: 225, west: 270, northwest: 315,
  } as const)[centerDir];

  const breath = snapshot.breathWave;
  const containerScale = 1 + breath * 0.01;
  // Slow hypnotic idle spin on the center arrow (18°/sec → ~20s rotation).
  const idleRot = idleSpin ? (snapshot.time * 18) % 360 : 0;

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: SIZE,
        height: SIZE,
        maxWidth: "90vw",
        aspectRatio: "1 / 1",
        transform: `scale(${containerScale})`,
        transition: "transform 80ms linear",
      }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full">
        {puzzle.petals.map((spec, i) => {
          const angle = i * step;
          const petal = snapshot.petals[i];
          const arrowRot = petal?.currentRotation ?? 0;
          const openness = petal?.openness ?? 1;
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

          // Openness modulates the petal's long radius — closed petals visibly shrink.
          const ry = PETAL_RY * (0.82 + openness * 0.18);

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
              <ellipse cx={2} cy={2} rx={PETAL_RX} ry={ry} fill="#4d4732" />
              <g className={`petal-inner ${animClass}`}>
                <ellipse
                  className="petal-body"
                  cx={0}
                  cy={0}
                  rx={PETAL_RX}
                  ry={ry}
                  fill={petalColors?.[i] ?? petalColor}
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
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: `scale(${1 + breath * 0.02})`,
            }}
          >
            <circle
              r={CENTER_R}
              fill="#FFD700"
              stroke="#4d4732"
              strokeWidth={2}
            />
            <g transform={`rotate(${centerDeg + idleRot})`}>
              <foreignObject x={-20} y={-20} width={40} height={40}>
                <div style={{ width: 40, height: 40 }}>
                  <ArrowSvg size={40} color="#1F1F1F" />
                </div>
              </foreignObject>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
