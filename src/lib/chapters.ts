export type ChapterId =
  | "daisy"
  | "lavender"
  | "mountain"
  | "sakura"
  | "lotus";

export type PetalShape = "pill" | "leaf" | "halfcircle" | "teardrop";

export type Chapter = {
  id: ChapterId;
  /** Display name ("The Daisy Forest", ...). */
  name: string;
  /** Chapter index label ("BÖLÜM 1"). */
  bolum: string;
  /** Short poetic tagline used on cards / chapter overlay. */
  epigraph: string;
  /** Longer poetic vignette shown once when the biome first opens. */
  intro: string;
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
  difficulty: { windStrength: number; decayMult: number; tolerance: number };
  /**
   * Zen scrolls — collectible philosophical quotes granted every 5 levels
   * (at chapter.levelStart+4, +9, +14, +19, +24). Exactly five per biome.
   */
  scrolls: { title: string; body: string }[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "daisy",
    name: "The Daisy Forest",
    bolum: "BÖLÜM 1",
    epigraph: "Where arrows first speak.",
    intro:
      "The forest wakes softly. Every arrow is a whisper — turn them gently, and the meadow will hum in return.",
    levelStart: 1,
    levelEnd: 25,
    bgColor: "#FDE69E",
    inkColor: "#1F1F1F",
    petalColor: "#FFFFFF",
    petalShape: "pill",
    tileColor: "#FFFFFF",
    accentColor: "#3E5C38",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.02, decayMult: 1.4, tolerance: 5 },
    scrolls: [
      { title: "First Bloom", body: "A single aligned petal is enough. Begin there." },
      { title: "The Gestalt Whole", body: "The parts arrange themselves once you see the whole." },
      { title: "Soft Focus", body: "Precision comes from ease, not from grip." },
      { title: "Rhythm of Return", body: "Every mistake is only a longer path home." },
      { title: "The Meadow Remembers", body: "Progress is a garden — it grows while you sleep." },
    ],
  },
  {
    id: "lavender",
    name: "The Lavender Valley",
    bolum: "BÖLÜM 2",
    epigraph: "Rhythms overlap. Listen for the beat.",
    intro:
      "The valley breathes in fields of purple. Follow one wave, then two, then the pulse that holds them both.",
    levelStart: 26,
    levelEnd: 50,
    bgColor: "#D6C6EB",
    inkColor: "#2A1F3D",
    petalColor: "#FFFFFF",
    petalAlt: "#C9AEE8",
    petalShape: "leaf",
    tileColor: "#EDE2F7",
    accentColor: "#7B5EA7",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.06, decayMult: 1.1, tolerance: 4 },
    scrolls: [
      { title: "Two Rivers", body: "Attention can hold more than one stream. Trust the widening." },
      { title: "Cadence", body: "Flow, said Csíkszentmihályi, is the pulse of skill meeting challenge." },
      { title: "The Overlap", body: "Where rhythms cross, meaning appears." },
      { title: "Purple Hour", body: "Between focus and rest lives the valley of ease." },
      { title: "Field of Fields", body: "Each petal is a smaller version of the whole." },
    ],
  },
  {
    id: "mountain",
    name: "The Mountain Peak",
    bolum: "BÖLÜM 3",
    epigraph: "Climb the wind.",
    intro:
      "The mountain asks you to lean into the wind — not to fight it, but to find your center within it.",
    levelStart: 51,
    levelEnd: 75,
    bgColor: "#748392",
    inkColor: "#FFFFFF",
    petalColor: "#FFFFFF",
    petalShape: "halfcircle",
    tileColor: "#E8DFCB",
    accentColor: "#4A5A7A",
    alertColor: "#FF6B6B",
    difficulty: { windStrength: 0.18, decayMult: 0.7, tolerance: 3 },
    scrolls: [
      { title: "The Center Holds", body: "Wind moves the branches. The root does not move." },
      { title: "Sharp Symmetry", body: "Balance is a knife's edge. Stand light." },
      { title: "Altitude", body: "Higher air is thinner — so are the tolerances." },
      { title: "The Climber's Breath", body: "Four in, seven hold, eight out. Repeat until the peak arrives." },
      { title: "Summit Silence", body: "At the top the wind stops, because you have become it." },
    ],
  },
  {
    id: "sakura",
    name: "The Sakura Garden",
    bolum: "BÖLÜM 4",
    epigraph: "Petals fall, the path remains.",
    intro:
      "The garden is fluent in impermanence. Each petal that lands is a small forgiveness — and a smaller invitation.",
    levelStart: 76,
    levelEnd: 100,
    bgColor: "#FBC9A8",
    inkColor: "#1F1F1F",
    petalColor: "#FFFFFF",
    petalAlt: "#FBD5E0",
    petalShape: "teardrop",
    tileColor: "#FBD5E0",
    accentColor: "#F15BB5",
    alertColor: "#F15BB5",
    difficulty: { windStrength: 0.22, decayMult: 0.5, tolerance: 2.5 },
    scrolls: [
      { title: "Impermanence", body: "Everything falling is also arriving. Choose which to see." },
      { title: "The Elegant Curve", body: "Efficiency is beauty made practical." },
      { title: "Tight Tolerance", body: "Discipline is only love for the detail." },
      { title: "Petal Rain", body: "A garden lets go on time. So can you." },
      { title: "Path Beyond Petals", body: "The way remains after all its flowers have fallen." },
    ],
  },
  {
    id: "lotus",
    name: "The Lotus Lake",
    bolum: "BÖLÜM 5",
    epigraph: "The still water knows every direction.",
    intro:
      "The lake is a mirror wide as your attention. Here, flow is not effort — it is the shape water takes when nothing resists.",
    levelStart: 101,
    levelEnd: 125,
    bgColor: "#B9DED4",
    inkColor: "#1F3B36",
    petalColor: "#FFFFFF",
    petalAlt: "#F9E9C2",
    petalShape: "teardrop",
    tileColor: "#DCEFE8",
    accentColor: "#2E6B6E",
    alertColor: "#F15BB5",
    difficulty: { windStrength: 0.14, decayMult: 0.55, tolerance: 2 },
    scrolls: [
      { title: "Still Water", body: "The mirror is not empty. It is entirely full." },
      { title: "Flow State", body: "When self dissolves into task, time becomes generous." },
      { title: "The Deep Root", body: "Beauty rises from mud. So does the practitioner." },
      { title: "Circles on Water", body: "Every action ripples. Choose gentle ones." },
      { title: "Return", body: "The end of the path is the beginning, seen clearly." },
    ],
  },
];

export function getChapter(level: number): Chapter {
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

export const TOTAL_LEVELS =
  CHAPTERS[CHAPTERS.length - 1].levelEnd; // 125
