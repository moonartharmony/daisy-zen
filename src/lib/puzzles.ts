export type Direction =
  | "north" | "northeast" | "east" | "southeast"
  | "south" | "southwest" | "west" | "northwest";

export const DIRECTIONS: Direction[] = [
  "north", "northeast", "east", "southeast",
  "south", "southwest", "west", "northwest",
];

export const DIR_DEG: Record<Direction, number> = {
  north: 0, northeast: 45, east: 90, southeast: 135,
  south: 180, southwest: 225, west: 270, northwest: 315,
};

export type PetalSpec = {
  hasArrow: boolean;
  startDir: Direction | null;
};

export type Puzzle = {
  level: number;
  petalCount: number;
  centerDir: Direction;
  petals: PetalSpec[];
  minMoves: number;
};

function stepsCW(from: Direction, to: Direction): number {
  const f = DIRECTIONS.indexOf(from);
  const t = DIRECTIONS.indexOf(to);
  return Math.round(((t - f + 8) % 8) / 2);
}

function calcMinMoves(centerDir: Direction, petals: PetalSpec[]): number {
  return petals.reduce((sum, p) => {
    if (!p.hasArrow || !p.startDir) return sum;
    return sum + stepsCW(p.startDir, centerDir);
  }, 0);
}

const BASE_LEVELS: Omit<Puzzle, "level" | "minMoves">[] = [
  // L1: 4 petals, center=north, 2 arrows starting south
  {
    petalCount: 4,
    centerDir: "north",
    petals: [
      { hasArrow: true, startDir: "south" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "south" },
      { hasArrow: false, startDir: null },
    ],
  },
  // L2: 6 petals, center=east, 3 arrows west/south
  {
    petalCount: 6,
    centerDir: "east",
    petals: [
      { hasArrow: true, startDir: "west" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "south" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "west" },
      { hasArrow: false, startDir: null },
    ],
  },
  // L3: 6 petals, center=north, 3 arrows mixed
  {
    petalCount: 6,
    centerDir: "north",
    petals: [
      { hasArrow: true, startDir: "east" },
      { hasArrow: true, startDir: "south" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "west" },
      { hasArrow: false, startDir: null },
      { hasArrow: false, startDir: null },
    ],
  },
  // L4: 8 petals, center=south, 4 arrows
  {
    petalCount: 8,
    centerDir: "south",
    petals: [
      { hasArrow: true, startDir: "north" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "east" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "west" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "north" },
      { hasArrow: false, startDir: null },
    ],
  },
  // L5: 8 petals, center=west, 4 arrows (cardinals only)
  {
    petalCount: 8,
    centerDir: "west",
    petals: [
      { hasArrow: true, startDir: "north" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "south" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "east" },
      { hasArrow: false, startDir: null },
      { hasArrow: true, startDir: "north" },
      { hasArrow: false, startDir: null },
    ],
  },
];

function rotateDir(d: Direction, steps: number): Direction {
  const idx = DIRECTIONS.indexOf(d);
  return DIRECTIONS[(idx + steps + 8 * 10) % 8];
}

export function getPuzzle(level: number): Puzzle {
  const base = BASE_LEVELS[(level - 1) % BASE_LEVELS.length];
  if (level <= BASE_LEVELS.length) {
    const petals = structuredClone(base.petals);
    return { level, ...base, petals, minMoves: calcMinMoves(base.centerDir, petals) };
  }
  const shift = (((level % 3) + 1) * 2);
  const petals = base.petals.map((p) =>
    p.hasArrow && p.startDir
      ? { hasArrow: true, startDir: rotateDir(p.startDir, shift) }
      : { hasArrow: p.hasArrow, startDir: null },
  );
  return {
    level,
    petalCount: base.petalCount,
    centerDir: base.centerDir,
    petals,
    minMoves: calcMinMoves(base.centerDir, petals),
  };
}

export const TOTAL_LEVELS = 20;
