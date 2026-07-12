import type { Puzzle } from "@/lib/puzzles";
import type { WorldSnapshot } from "@/engine/types";
import type { PetalShape } from "@/lib/chapters";

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
  /** Biome-driven geometry for the petals. */
  shape?: PetalShape;
  /** Center core fill (biome accent). */
  centerColor?: string;
  /** Center arrow fill. Defaults to dark ink for contrast on light cores. */
  centerArrowColor?: string;
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
 * Petal geometry library. Each function returns an SVG path centered on
 * (0,0), where -y points OUTWARD (away from the daisy center) and +y points
 * INWARD. `rx`/`ry` already include any per-frame openness deformation so
 * the live spring values from the engine flow straight into the path.
 */
function petalPathFor(
  shape: PetalShape,
  rx: number,
  ry: number,
  index: number,
): string {
  switch (shape) {
    case "leaf": {
      // Forest: rounded teardrop with bulb OUTWARD (-y) and softly tapered
      // toward the center (+y), giving the dense layered daisy silhouette.
      const w = rx * 1.15;
      return `M 0 ${-ry} C ${w} ${-ry * 0.55} ${w * 0.85} ${ry * 0.2} 0 ${ry} C ${-w * 0.85} ${ry * 0.2} ${-w} ${-ry * 0.55} 0 ${-ry} Z`;
    }
    case "halfcircle": {
      // Mountain: clean 180° semi-dome. Flat chord faces INWARD (+y toward
      // the yellow core); smooth arc sweeps OUTWARD (-y). All 8 petals share
      // the same orientation so the radial rotation produces the precise
      // propeller / wind-turbine silhouette in 03 - The Mountain_2.png.
      void index;
      const r = Math.min(rx * 1.35, ry * 0.95);
      const chordY = ry * 0.18; // pull the flat chord slightly inward for premium balance
      return `M ${-r} ${chordY} A ${r} ${r} 0 0 1 ${r} ${chordY} Z`;
    }
    case "teardrop": {
      // Sakura: tapered tear-drop, sharp point facing OUTWARD (-y), rounded
      // bulb facing the center (+y).
      const w = rx * 1.1;
      const bulb = ry * 0.55;
      return `M 0 ${-ry} C ${w} ${-ry * 0.15} ${w} ${ry * 0.55} 0 ${ry} C ${-w} ${ry * 0.55} ${-w} ${-ry * 0.15} 0 ${-ry} Z`
        // intentionally asymmetric vertical to keep the outer vertex sharp.
        .replace(/(\.15)/, () => (0.15 + Math.min(0.05, bulb * 0)).toString());
    }
    case "pill":
    default: {
      // Daisy: rounded stadium / pill (default).
      const r = rx;
      const top = -ry + r;
      const bot = ry - r;
      return `M ${-r} ${top} A ${r} ${r} 0 0 1 ${r} ${top} L ${r} ${bot} A ${r} ${r} 0 0 1 ${-r} ${bot} Z`;
    }
  }
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
  shape = "pill",
  centerColor = "#FFD700",
  centerArrowColor = "#1F1F1F",
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
      data-shape={shape}
      className="relative mx-auto select-none daisy-root"
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
          // Common-region breathing: the gap between core and petals pulses
          // by a sub-pixel amount, tying the gestalt together (≈ ±1.2px).
          const livePetalDist = PETAL_DIST + breath * 1.2;
          const rad = (angle - 90) * (Math.PI / 180);
          const tx = Math.cos(rad) * livePetalDist;
          const ty = Math.sin(rad) * livePetalDist;
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
          const rx = PETAL_RX;
          const dShadow = petalPathFor(shape, rx, ry, i);

          return (
            <g
              key={i}
              transform={`translate(${CENTER} ${CENTER}) rotate(${angle}) translate(0 ${-livePetalDist})`}
              onPointerDown={(e) => {
                e.preventDefault();
                if (!bursting && spec.hasArrow) onTapPetal(i);
              }}
              style={{
                cursor: spec.hasArrow ? "pointer" : "default",
                willChange: "transform",
                ["--tx" as string]: `${tx}px`,
                ["--ty" as string]: `${ty}px`,
              }}
              className={bursting ? "animate-petal-burst" : ""}
            >
              {/* Drop-shadow petal (offset 2,2) for the Neubrutalist edge. */}
              <path d={dShadow} transform="translate(2 2)" fill="#4d4732" />
              <g className={`petal-inner ${animClass}`}>
                <path
                  className="petal-body"
                  d={dShadow}
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
              fill={centerColor}
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
