export type ChapterId = "garden" | "forest" | "mountain" | "storm" | "void";

export type Chapter = {
  id: ChapterId;
  name: string;
  epigraph: string;
  levelStart: number;
  levelEnd: number;
  /** Page background canvas — peach for all in Daisy Zen v2. */
  bgColor: string;
  /** Daisy petal base colour. */
  petalColor: string;
  /** Accent for chapter card on the Journey Map. */
  tileColor: string;
  accentColor: string;
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
    tileColor: "#FFFFFF",
    accentColor: "#A8D5A2",
    difficulty: { windStrength: 0.02, decayMult: 1.4 },
  },
  {
    id: "forest",
    name: "The Forest",
    epigraph: "Deeper paths, older silence.",
    levelStart: 6,
    levelEnd: 15,
    bgColor: "#FFDCC0",
    petalColor: "#FFFFFF",
    tileColor: "#FFD700",
    accentColor: "#3E5C38",
    difficulty: { windStrength: 0.08, decayMult: 1 },
  },
  {
    id: "mountain",
    name: "The Mountain",
    epigraph: "Stillness is not emptiness.",
    levelStart: 16,
    levelEnd: 30,
    bgColor: "#FFDCC0",
    petalColor: "#FFFFFF",
    tileColor: "#E6D9C4",
    accentColor: "#708090",
    difficulty: { windStrength: 0.18, decayMult: 0.6 },
  },
  {
    id: "storm",
    name: "The Storm",
    epigraph: "Find the eye.",
    levelStart: 31,
    levelEnd: 50,
    bgColor: "#FFDCC0",
    petalColor: "#FFFFFF",
    tileColor: "#E6D9C4",
    accentColor: "#8B6F5E",
    difficulty: { windStrength: 0.22, decayMult: 0.5 },
  },
  {
    id: "void",
    name: "The Void",
    epigraph: "You have always known the way.",
    levelStart: 51,
    levelEnd: 9999,
    bgColor: "#FFDCC0",
    petalColor: "#FFFFFF",
    tileColor: "#E6D9C4",
    accentColor: "#2C2C3E",
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
