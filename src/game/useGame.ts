import { useState, useCallback, useEffect, useRef } from 'react';
import { rotateCW, rotateCCW, spinDir, getChapter, DIRS, DIR_DEG } from './types';
import type { Phase, Dir } from './types';
import { getPuzzle } from './puzzles';

/* ── Haptics ─────────────────────────────────────────── */
const vib = (p: number | number[]) =>
  typeof navigator !== 'undefined' && navigator.vibrate?.(p);

export const haptic = {
  tap:   () => vib(8),
  align: () => vib(15),
  win:   () => vib([40, 60, 40, 60, 80]),
  ch:    () => vib([20, 40, 20]),
  hint:  () => vib(6),
};

/* ── Score ───────────────────────────────────────────── */
const calcScore = (moves: number, min: number, sec: number) =>
  100 +
  Math.max(0, (min * 2 - moves)) * 10 +
  (sec < 20 ? 60 : sec < 45 ? 30 : sec < 90 ? 10 : 0);

/* ── State factory ───────────────────────────────────── */
const init = (level: number, prevTotal = 0) => {
  const puzzle  = getPuzzle(level);
  const chapter = getChapter(level);
  const prevCh  = level > 1 ? getChapter(level - 1) : null;
  return {
    level,
    score:          0,
    totalScore:     prevTotal,
    moves:          0,
    puzzle,
    phase:          'playing' as Phase,
    chapter,
    showTransition: level === 1 || prevCh?.id !== chapter.id,
    hintReady:      false,
    startTime:      Date.now(),
  };
};

export type GameState = ReturnType<typeof init>;

export const useGame = () => {
  const [s, setS]  = useState<GameState>(() => init(1));
  const hintRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const circleRef  = useRef<HTMLDivElement>(null);

  /* Chapter background on body */
  useEffect(() => {
    document.body.style.setProperty('--chapter-bg', s.chapter.bg);
  }, [s.chapter.bg]);

  /* 45-second hint timer */
  useEffect(() => {
    if (s.phase !== 'playing') return;
    clearTimeout(hintRef.current);
    hintRef.current = setTimeout(() => {
      setS(p => ({ ...p, hintReady: true }));
      haptic.hint();
    }, 45_000);
    return () => clearTimeout(hintRef.current);
  }, [s.level, s.phase]);

  /* ── Tap / spin a petal ──────────────────────────── */
  const tap = useCallback((idx: number, angleDeg: number) => {
    setS(prev => {
      if (prev.phase !== 'playing') return prev;

      /* Spin direction is determined by petal position, not user choice */
      const rotate = spinDir(angleDeg) === 'ccw' ? rotateCCW : rotateCW;

      const petals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        const dir     = rotate(p.dir);
        const aligned = dir === prev.puzzle.center;
        return { ...p, dir, aligned };
      });

      const won   = petals.filter(p => p.hasArrow).every(p => p.aligned);
      const moves = prev.moves + 1;

      if (won) {
        const sec    = Math.round((Date.now() - prev.startTime) / 1000);
        const gained = calcScore(moves, prev.puzzle.minMoves, sec);
        haptic.win();
        return {
          ...prev,
          puzzle:     { ...prev.puzzle, petals },
          moves,
          score:      gained,
          totalScore: prev.totalScore + gained,
          phase:      'won' as Phase,
        };
      }

      const newlyAligned = petals.find(p => p.idx === idx)?.aligned;
      if (newlyAligned) {
        haptic.align();
        circleRef.current?.classList.add('anim-cpulse');
        setTimeout(() => circleRef.current?.classList.remove('anim-cpulse'), 270);
      } else {
        haptic.tap();
      }

      return { ...prev, puzzle: { ...prev.puzzle, petals }, moves };
    });
  }, []);

  const nextLevel = useCallback(() =>
    setS(p => init(p.level + 1, p.totalScore + p.score)), []);

  const reset = useCallback(() =>
    setS(p => init(p.level, p.totalScore)), []);

  const togglePause = useCallback(() =>
    setS(p => ({
      ...p,
      phase: p.phase === 'paused' ? 'playing' : 'paused',
    })), []);

  const dismissTr = useCallback(() =>
    setS(p => ({ ...p, showTransition: false })), []);

  /* Hint: petal closest to aligning (fewest taps away) */
  const hintIdx: number | null = (() => {
    if (!s.hintReady || s.phase !== 'playing') return null;
    let best = { idx: -1, taps: 9 };
    s.puzzle.petals.forEach(p => {
      if (!p.hasArrow || p.aligned) return;
      const cur    = DIRS.indexOf(p.dir);
      const target = DIRS.indexOf(s.puzzle.center);
      const taps   = Math.min((target - cur + 8) % 8, (cur - target + 8) % 8);
      if (taps < best.taps) best = { idx: p.idx, taps };
    });
    return best.idx >= 0 ? best.idx : null;
  })();

  return { s, tap, nextLevel, reset, togglePause, dismissTr, hintIdx, circleRef };
};
