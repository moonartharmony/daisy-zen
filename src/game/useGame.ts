import { useState, useCallback, useEffect, useRef } from 'react';
import { rotateCW, getChapter, DIRS } from './types';
import type { Phase } from './types';
import { getPuzzle } from './puzzles';

/* ── Haptic helpers ─────────────────────────────────── */
const vib = (pattern: number | number[]) =>
  typeof navigator !== 'undefined' && navigator.vibrate?.(pattern);

export const haptic = {
  tap:     () => vib(8),
  align:   () => vib(15),
  win:     () => vib([40, 60, 40, 60, 80]),
  chapter: () => vib([20, 40, 20]),
  hint:    () => vib(6),
};

/* ── Score formula ──────────────────────────────────── */
const calcScore = (moves: number, min: number, sec: number) =>
  100 +
  Math.max(0, (min * 2 - moves)) * 10 +
  (sec < 20 ? 60 : sec < 45 ? 30 : sec < 90 ? 10 : 0);

/* ── State factory ──────────────────────────────────── */
const fresh = (level: number) => {
  const puzzle  = getPuzzle(level);
  const chapter = getChapter(level);
  const prevCh  = level > 1 ? getChapter(level - 1) : null;
  return {
    level,
    score:          0,
    totalScore:     0,
    moves:          0,
    puzzle,
    phase:          'playing' as Phase,
    chapter,
    showTransition: prevCh?.id !== chapter.id || level === 1,
    hintReady:      false,
    startTime:      Date.now(),
  };
};

export const useGame = () => {
  const [s, setS] = useState(() => fresh(1));
  const hintRef   = useRef<ReturnType<typeof setTimeout>>();
  const circleRef = useRef<HTMLDivElement>(null);

  /* 45 s hint timer */
  useEffect(() => {
    if (s.phase !== 'playing') return;
    clearTimeout(hintRef.current);
    hintRef.current = setTimeout(() => {
      setS(p => ({ ...p, hintReady: true }));
      haptic.hint();
    }, 45_000);
    return () => clearTimeout(hintRef.current);
  }, [s.level, s.phase]);

  /* Chapter background on <body> */
  useEffect(() => {
    document.body.style.setProperty('--chapter-bg', s.chapter.bg);
  }, [s.chapter.bg]);

  /* Tap a petal */
  const tap = useCallback((idx: number) => {
    setS(prev => {
      if (prev.phase !== 'playing') return prev;

      const petals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        const dir     = rotateCW(p.dir);
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
        circleRef.current?.classList.add('center-pulse');
        setTimeout(() => circleRef.current?.classList.remove('center-pulse'), 260);
      } else {
        haptic.tap();
      }

      return { ...prev, puzzle: { ...prev.puzzle, petals }, moves };
    });
  }, []);

  const nextLevel = useCallback(() =>
    setS(prev => ({
      ...fresh(prev.level + 1),
      totalScore: prev.totalScore + prev.score,
    })),
  []);

  const reset = useCallback(() =>
    setS(prev => ({
      ...fresh(prev.level),
      totalScore: prev.totalScore,
    })),
  []);

  const togglePause = useCallback(() =>
    setS(prev => ({
      ...prev,
      phase: prev.phase === 'paused' ? 'playing' : 'paused',
    })),
  []);

  const dismissTransition = useCallback(() =>
    setS(prev => ({ ...prev, showTransition: false })),
  []);

  /* Hint: petal needing fewest CW rotations */
  const hintIdx: number | null = (() => {
    if (!s.hintReady || s.phase !== 'playing') return null;
    let best = { idx: -1, taps: 9 };
    s.puzzle.petals.forEach(p => {
      if (!p.hasArrow || p.aligned) return;
      const cur    = DIRS.indexOf(p.dir);
      const target = DIRS.indexOf(s.puzzle.center);
      const taps   = (target - cur + 8) % 8;
      if (taps < best.taps) best = { idx: p.idx, taps };
    });
    return best.idx >= 0 ? best.idx : null;
  })();

  return { s, tap, nextLevel, reset, togglePause, dismissTransition, hintIdx, circleRef };
};
