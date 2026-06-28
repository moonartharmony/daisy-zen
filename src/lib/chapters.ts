export type ChapterId = "garden" | "forest" | "mountain" | "storm" | "void";

export type Chapter = {
  id: ChapterId;
  name: string;
  epigraph: string;
  levelStart: number;
  levelEnd: number;
  /** Canvas background — biome-specific (peach / mint / cream-pink). */
  bgColor: string;
  /** Daisy petal base colour. */
  petalColor: string;
  /** Alternating petal accent (every other petal). */
  petalAlt?: string;
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
    id: "garden",
    name: "The Garden",
    epigraph: "Where arrows first spoke.",
    levelStart: 1,
    levelEnd: 5,
    bgColor: "#FFDCC0",
    petalColor: "#FFFFFF",
    petalAlt: "#FFD700",
    tileColor: "#FFFFFF",
    accentColor: "#A8D5A2",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.02, decayMult: 1.4 },
  },
  {
    id: "forest",
    name: "The Forest",
    epigraph: "Deeper paths, older silence.",
    levelStart: 6,
    levelEnd: 15,
    bgColor: "#E2F0D9",
    petalColor: "#FFFFFF",
    tileColor: "#FFD700",
    accentColor: "#3E5C38",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.08, decayMult: 1 },
  },
  {
    id: "mountain",
    name: "Sakura Garden",
    epigraph: "Petals fall, the path remains.",
    levelStart: 16,
    levelEnd: 25,
    bgColor: "#FFE8EE",
    petalColor: "#FFFFFF",
    petalAlt: "#F8C8DC",
    tileColor: "#FBD5E0",
    accentColor: "#F15BB5",
    alertColor: "#F15BB5",
    difficulty: { windStrength: 0.18, decayMult: 0.6 },
  },
  {
    id: "storm",
    name: "The Storm",
    epigraph: "Find the eye.",
    levelStart: 26,
    levelEnd: 50,
    bgColor: "#D9DDE6",
    petalColor: "#FFFFFF",
    tileColor: "#E6D9C4",
    accentColor: "#4A5A7A",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.22, decayMult: 0.5 },
  },
  {
    id: "void",
    name: "The Void",
    epigraph: "You have always known the way.",
    levelStart: 51,
    levelEnd: 9999,
    bgColor: "#1B1B22",
    petalColor: "#FFFFFF",
    tileColor: "#2C2C3E",
    accentColor: "#9B8CFF",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.25, decayMult: 0.4 },
  },
];

export function getChapter(level: number): Chapter {
  return (
    CHAPTERS.find((c) => level >= c.levelStart && level <= c.levelEnd) ??
    CHAPTERS[CHAPTERS.length - 1]
  );
}

export function getChapterById(id: ChapterId): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}

