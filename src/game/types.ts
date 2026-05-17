export type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const DIRS: Dir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export const DIR_DEG: Record<Dir, number> = {
  n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315,
};

/** One step clockwise */
export const rotateCW  = (d: Dir): Dir => DIRS[(DIRS.indexOf(d) + 1) % 8];

/** One step counter-clockwise */
export const rotateCCW = (d: Dir): Dir => DIRS[(DIRS.indexOf(d) + 7) % 8];

/**
 * Petals on the RIGHT half (placement angle 0°–180°) spin CW.
 * Petals on the LEFT half (angle 180°–360°) spin CCW.
 * Mirrors how you'd physically spin a real flower with two hands.
 */
export const spinDir = (angleDeg: number): 'cw' | 'ccw' =>
  angleDeg > 180 ? 'ccw' : 'cw';

export interface Petal {
  idx:      number;
  hasArrow: boolean;
  dir:      Dir;
  aligned:  boolean;
}

export interface Puzzle {
  level:    number;
  center:   Dir;
  petals:   Petal[];
  minMoves: number;
}

export type Phase = 'playing' | 'won' | 'paused';

export type PetalShape  = 'oval' | 'leaf' | 'diamond' | 'spike' | 'clover';
export type CenterShape = 'circle' | 'hexbump' | 'hexagon' | 'rough' | 'double';

export interface Chapter {
  id:         string;
  name:       string;
  epigraph:   string;
  levels:     [number, number];
  bg:         string;
  petalColor: string;
  petalShape: PetalShape;
  ctrShape:   CenterShape;
  petalRange: [number, number];
  dirs:       Dir[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'garden', name: 'The Garden',
    epigraph: 'Where arrows first spoke.',
    levels: [1, 10], bg: '#B2AC88',
    petalColor: '#FFFFFF', petalShape: 'oval', ctrShape: 'circle',
    petalRange: [4, 6], dirs: ['n', 's', 'e', 'w'],
  },
  {
    id: 'forest', name: 'The Forest',
    epigraph: 'Deeper paths, older silence.',
    levels: [11, 25], bg: '#4A6741',
    petalColor: '#F0EDE4', petalShape: 'leaf', ctrShape: 'hexbump',
    petalRange: [6, 8], dirs: ['n', 's', 'e', 'w', 'ne', 'sw'],
  },
  {
    id: 'mountain', name: 'The Mountain',
    epigraph: 'Stillness is not emptiness.',
    levels: [26, 40], bg: '#708090',
    petalColor: '#FFFFFF', petalShape: 'diamond', ctrShape: 'hexagon',
    petalRange: [8, 10], dirs: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
  },
  {
    id: 'storm', name: 'The Storm',
    epigraph: 'Find the eye.',
    levels: [41, 55], bg: '#8B6F5E',
    petalColor: '#EDE8E0', petalShape: 'spike', ctrShape: 'rough',
    petalRange: [10, 12], dirs: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
  },
  {
    id: 'void', name: 'The Void',
    epigraph: 'You have always known the way.',
    levels: [56, 99], bg: '#2C2C3E',
    petalColor: '#F5F3EE', petalShape: 'clover', ctrShape: 'double',
    petalRange: [12, 12], dirs: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
  },
];

export const getChapter = (lvl: number): Chapter =>
  CHAPTERS.find(c => lvl >= c.levels[0] && lvl <= c.levels[1])
  ?? CHAPTERS[CHAPTERS.length - 1];
