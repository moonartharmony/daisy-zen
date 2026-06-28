import { useEffect, useRef, useSyncExternalStore } from "react";
import { EmotionFieldEngine } from "./core/EmotionFieldEngine";
import type { WorldSnapshot } from "./types";

/**
 * useEmotionEngine
 * ----------------
 * Owns a single EmotionFieldEngine instance for the lifetime of the
 * consuming component, drives its rAF loop, and exposes the current
 * WorldSnapshot through React's external-store hook so renders only
 * happen when a fresh snapshot is published.
 */
export function useEmotionEngine(): {
  engine: EmotionFieldEngine;
  snapshot: WorldSnapshot;
} {
  const engineRef = useRef<EmotionFieldEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new EmotionFieldEngine();
  }
  const engine = engineRef.current;

  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);

  const snapshot = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );

  return { engine, snapshot };
}

/**
 * Map (stability, valence) to a petal accent colour.
 * - Low stability  → alert red  (#FF6B6B)
 * - Mid            → chapter base
 * - High + valence → master gold (#FFD700) trending to mint
 */
export function petalAccentFromEmotion(
  stability: number,
  valence: number,
  base: string,
  alertColor: string = "#FF6B6B",
): string {
  if (stability < 0.5) {
    // blend toward alert color as stability collapses (pink in Sakura zone, red elsewhere)
    return mixHex(base, alertColor, (0.5 - stability) / 0.5);
  }
  if (stability > 0.7 && valence > 0.3) {
    const t = Math.min(1, (stability - 0.7) / 0.3) * 0.6;
    return mixHex(base, "#FFD700", t);
  }
  return base;
}

function mixHex(a: string, b: string, t: number): string {
  const tt = Math.max(0, Math.min(1, t));
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * tt);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * tt);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * tt);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
