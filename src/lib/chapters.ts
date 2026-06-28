export type Chapter = {
  id: "garden" | "forest" | "mountain" | "storm" | "void";
  name: string;
  epigraph: string;
  levelStart: number;
  levelEnd: number;
  bgColor: string;
  petalColor: string;
  accentColor: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "garden",
    name: "The Garden",
    epigraph: "Where arrows first spoke.",
    levelStart: 1,
    levelEnd: 10,
    bgColor: "#B2AC88",
    petalColor: "#FFFFFF",
    accentColor: "#FFD700",
  },
  {
    id: "forest",
    name: "The Forest",
    epigraph: "Deeper paths, older silence.",
    levelStart: 11,
    levelEnd: 25,
    bgColor: "#4A6741",
    petalColor: "#F0EDE4",
    accentColor: "#FFD700",
  },
  {
    id: "mountain",
    name: "The Mountain",
    epigraph: "Stillness is not emptiness.",
    levelStart: 26,
    levelEnd: 40,
    bgColor: "#708090",
    petalColor: "#FFFFFF",
    accentColor: "#FFD700",
  },
  {
    id: "storm",
    name: "The Storm",
    epigraph: "Find the eye.",
    levelStart: 41,
    levelEnd: 55,
    bgColor: "#8B6F5E",
    petalColor: "#EDE8E0",
    accentColor: "#FFD700",
  },
  {
    id: "void",
    name: "The Void",
    epigraph: "You have always known the way.",
    levelStart: 56,
    levelEnd: 9999,
    bgColor: "#2C2C3E",
    petalColor: "#F5F3EE",
    accentColor: "#FFD700",
  },
];

export function getChapter(level: number): Chapter {
  return (
    CHAPTERS.find((c) => level >= c.levelStart && level <= c.levelEnd) ??
    CHAPTERS[CHAPTERS.length - 1]
  );
}
