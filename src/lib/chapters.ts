export type ChapterId = "daisy" | "forest" | "mountain" | "sakura";

export type PetalShape = "pill" | "leaf" | "halfcircle" | "teardrop";

export type Chapter = {
  id: ChapterId;
  /** Display name ("The Daisy", "The Forest", ...). */
  name: string;
  /** Chapter index label ("BÖLÜM 1"). */
  bolum: string;
  epigraph: string;
  levelStart: number;
  levelEnd: number;
  /** Canvas background — biome-specific. */
  bgColor: string;
  /** Foreground ink colour used over `bgColor` (dark biomes flip to white). */
  inkColor: string;
  /** Daisy petal base colour. */
  petalColor: string;
  /** Alternating petal accent (every other petal). */
  petalAlt?: string;
  /** Petal SVG geometry family for this biome. */
  petalShape: PetalShape;
  /** Accent for chapter card on the Journey Map. */
  tileColor: string;
  accentColor: string;
  /** Color used when stability collapses (alert state). */
  alertColor: string;
  /** Engine difficulty profile (see EmotionFieldEngine.setDifficulty). */
  difficulty: { windStrength: number; decayMult: number };
};

export const CHAPTERS: Chapter[] = [
  {
    id: "daisy",
    name: "The Daisy",
    bolum: "BÖLÜM 1",
    epigraph: "Where arrows first spoke.",
    levelStart: 1,
    levelEnd: 5,
    bgColor: "#FDE69E",
    inkColor: "#1F1F1F",
    petalColor: "#FFFFFF",
    petalShape: "pill",
    tileColor: "#FFFFFF",
    accentColor: "#3E5C38",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.02, decayMult: 1.4 },
  },
  {
    id: "forest",
    name: "The Forest",
    bolum: "BÖLÜM 2",
    epigraph: "Deeper paths, older silence.",
    levelStart: 6,
    levelEnd: 15,
    bgColor: "#414F36",
    inkColor: "#FFFFFF",
    petalColor: "#FFFFFF",
    petalShape: "leaf",
    tileColor: "#FFD700",
    accentColor: "#A8D5A2",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.08, decayMult: 1 },
  },
  {
    id: "mountain",
    name: "The Mountain",
    bolum: "BÖLÜM 3",
    epigraph: "Climb the wind.",
    levelStart: 16,
    levelEnd: 30,
    bgColor: "#748392",
    inkColor: "#FFFFFF",
    petalColor: "#FFFFFF",
    petalShape: "halfcircle",
    tileColor: "#E8DFCB",
    accentColor: "#4A5A7A",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.18, decayMult: 0.6 },
  },
  {
    id: "sakura",
    name: "The Sakura",
    bolum: "BÖLÜM 4",
    epigraph: "Petals fall, the path remains.",
    levelStart: 31,
    levelEnd: 50,
    bgColor: "#FBC9A8",
    inkColor: "#1F1F1F",
    petalColor: "#FFFFFF",
    petalShape: "teardrop",
    tileColor: "#FBD5E0",
    accentColor: "#F15BB5",
    alertColor: "#F15BB5",
    difficulty: { windStrength: 0.22, decayMult: 0.5 },
  },
];

export function getChapter(level: number): Chapter {
  // Find first matching chapter; if user is between chapters (e.g. level 25-29)
  // fall back to the previous chapter so the world keeps rendering coherently.
  const exact = CHAPTERS.find(
    (c) => level >= c.levelStart && level <= c.levelEnd,
  );
  if (exact) return exact;
  const previous = [...CHAPTERS]
    .reverse()
    .find((c) => level >= c.levelStart);
  return previous ?? CHAPTERS[0];
}

export function getChapterById(id: ChapterId): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}
