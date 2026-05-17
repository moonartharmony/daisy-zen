import type { Puzzle, Dir } from './types';

/**
 * Helper: build a Puzzle quickly.
 * arrows = indices of petals that have arrows
 * dirs   = starting direction for each arrow petal (same order as arrows)
 */
const mk = (
  level:    number,
  center:   Dir,
  count:    number,
  arrows:   number[],
  dirs:     Dir[],
  minMoves: number,
): Puzzle => ({
  level,
  center,
  minMoves,
  petals: Array.from({ length: count }, (_, i) => {
    const ai = arrows.indexOf(i);
    return {
      idx:      i,
      hasArrow: ai >= 0,
      dir:      ai >= 0 ? dirs[ai] : 'n',
      aligned:  false,
    };
  }),
});

export const PUZZLES: Puzzle[] = [
  /* ── THE GARDEN (4-6 petals, N/S/E/W only) ── */
  mk(1,  'n',  4, [0,2],       ['s','s'],        4),
  mk(2,  'e',  6, [0,2,3],     ['n','s','w'],     5),
  mk(3,  's',  6, [0,1,3],     ['n','e','w'],     6),
  mk(4,  'w',  4, [0,2],       ['e','n'],         4),
  mk(5,  'n',  6, [0,1,3,5],   ['e','s','w','s'], 8),
  mk(6,  'e',  6, [0,2,3],     ['n','w','s'],     6),
  mk(7,  's',  6, [0,1,3,5],   ['n','n','e','w'], 9),
  mk(8,  'w',  6, [0,2,3],     ['e','n','s'],     6),
  mk(9,  'n',  6, [0,1,2,4],   ['s','e','w','s'], 9),
  mk(10, 'e',  6, [0,1,2,3],   ['w','n','s','w'], 10),

  /* ── THE FOREST (6-8 petals, diagonals added) ── */
  mk(11, 'ne', 8, [0,2,4,7],   ['s','w','sw','n'],       9),
  mk(12, 'nw', 8, [0,1,3,5],   ['e','s','ne','sw'],      10),
  mk(13, 's',  8, [0,1,2,3],   ['nw','ne','n','e'],      10),
  mk(14, 'sw', 8, [0,2,4,6],   ['ne','e','n','se'],      12),
  mk(15, 'ne', 8, [1,3,5,7],   ['s','sw','w','se'],      10),
  mk(16, 'e',  8, [0,1,3,5],   ['nw','s','w','sw'],      9),
  mk(17, 'nw', 8, [0,2,4,6],   ['se','e','ne','s'],      12),
  mk(18, 'n',  8, [0,1,2,5],   ['s','se','sw','e'],      9),
  mk(19, 'sw', 8, [1,2,4,6],   ['ne','n','e','nw'],      11),
  mk(20, 'se', 8, [0,3,5,7],   ['nw','n','w','ne'],      11),

  /* ── THE MOUNTAIN (8-10 petals, all 8 dirs) ── */
  mk(21, 'n',  10, [0,2,4,6,8], ['s','se','e','sw','w'],  14),
  mk(22, 'e',  10, [1,3,5,7,9], ['w','nw','sw','n','s'],  13),
  mk(23, 's',  10, [0,1,3,5,7], ['n','ne','nw','e','w'],  12),
  mk(24, 'w',  10, [0,2,4,6,8], ['e','se','ne','s','n'],  14),
  mk(25, 'ne', 10, [0,1,2,4,6], ['sw','s','se','w','nw'], 13),
];

export const getPuzzle = (level: number): Puzzle => {
  const p = PUZZLES.find(x => x.level === level);
  if (p) return JSON.parse(JSON.stringify(p)); // deep clone

  /* For levels beyond seed: cycle with same structure */
  const base = PUZZLES[(level - 1) % PUZZLES.length];
  const clone: Puzzle = JSON.parse(JSON.stringify(base));
  clone.level = level;
  return clone;
};
