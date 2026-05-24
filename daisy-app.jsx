/**
 * daisy-app.jsx — Sprint 1: Game Shell & State Orchestration
 *
 * Wires DaisyFlower to:
 *   • 8-direction puzzle state (N, NE, E, SE, S, SW, W, NW)
 *   • 5-chapter progression with petal shape morphing
 *   • Hemispheric rotation (tap → spinDir → CW or CCW)
 *   • 5-state emotion engine (misalign tracking, 8 s sliding window)
 *   • Hint timer (45 s)
 *   • Neubrutalist HUD: progress bar, Restore + Continue buttons
 *   • Win → auto-advance after 700 ms
 *
 * This file is intentionally framework-agnostic (no router, no auth).
 * Mount: ReactDOM.createRoot(document.getElementById('root')).render(<DaisyApp />)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DaisyFlower, EMOTION_PROFILES, deriveEmotion } from './daisy-flower.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 1 — DIRECTION SYSTEM (8-step)
   ══════════════════════════════════════════════════════════════════════════ */

const DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const DIR_DEG = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };

/** One step clockwise */
const rotateCW  = (d) => DIRS[(DIRS.indexOf(d) + 1) % 8];

/** One step counter-clockwise */
const rotateCCW = (d) => DIRS[(DIRS.indexOf(d) + 7) % 8];

/**
 * Hemispheric rotation rule — mirrors spinDir() in types.ts.
 * Petals on the RIGHT (placementAngle ≤ 180°) spin CW.
 * Petals on the LEFT  (placementAngle >  180°) spin CCW.
 */
const spinDir = (angleDeg) => angleDeg > 180 ? 'ccw' : 'cw';

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 2 — CHAPTER DEFINITIONS
   ══════════════════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  {
    id: 'garden',  name: 'The Garden',         epigraph: 'Where arrows first spoke.',
    levels: [1, 10],  bg: '#B2AC88', accent: '#FFD700', accentDark: '#D4B000',
    petalColor: '#FFFFFF', shapeKey: 'oval',    dirs: DIRS,
  },
  {
    id: 'forest',  name: 'The Forest',          epigraph: 'Deeper paths await.',
    levels: [11, 25], bg: '#8FA67A', accent: '#516C45', accentDark: '#3C5233',
    petalColor: '#F4F9F0', shapeKey: 'leaf',    dirs: ['n','ne','e','se','s','sw','w','nw'],
  },
  {
    id: 'mountain',name: 'The Mountain',        epigraph: 'Stillness above all.',
    levels: [26, 40], bg: '#A5ADB8', accent: '#708090', accentDark: '#506070',
    petalColor: '#F0F2F5', shapeKey: 'diamond', dirs: ['n','e','s','w'],
  },
  {
    id: 'storm',   name: 'The Storm',           epigraph: 'Find the eye.',
    levels: [41, 55], bg: '#6B5B4E', accent: '#C06030', accentDark: '#904020',
    petalColor: '#FAF0EC', shapeKey: 'spike',   dirs: DIRS,
  },
  {
    id: 'void',    name: 'The Void',            epigraph: 'You already know the way.',
    levels: [56, 99], bg: '#1A1A2E', accent: '#9B5DE5', accentDark: '#7B3DC5',
    petalColor: '#E8D5FF', shapeKey: 'clover',  dirs: DIRS,
  },
];

const getChapter = (level) =>
  CHAPTERS.find(c => level >= c.levels[0] && level <= c.levels[1]) ?? CHAPTERS[0];

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 3 — PUZZLE GENERATION
   Deterministic LCG seeded by level number.
   ══════════════════════════════════════════════════════════════════════════ */

function makeLCG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generatePuzzle(level, chapter) {
  const rng = makeLCG(level * 137 + 42);

  // Petal count cycles: 4, 6, 8, 6 (repeating, grows with chapter)
  const base = [4, 6, 8, 6];
  const petalCount = base[(level - 1) % 4] + (Math.floor((level - 1) / 4) % 2) * 2;
  const n = Math.min(petalCount, 12);

  // Center direction chosen from the chapter's allowed dir set
  const dirs     = chapter.dirs ?? DIRS;
  const center   = dirs[Math.floor(rng() * dirs.length)];

  // Active petals (carry arrows): roughly 50–75% of total
  const activeCount  = Math.max(2, Math.floor(n * (0.5 + rng() * 0.25)));
  const activeSlots  = new Set();
  while (activeSlots.size < activeCount) {
    activeSlots.add(Math.floor(rng() * n));
  }

  const petals = Array.from({ length: n }, (_, i) => {
    if (!activeSlots.has(i)) {
      return { idx: i, hasArrow: false, dir: center, aligned: true };
    }
    // Random starting dir ≠ center (guarantee it's unsolved)
    let dir;
    do { dir = dirs[Math.floor(rng() * dirs.length)]; } while (dir === center);
    return { idx: i, hasArrow: true, dir, aligned: false };
  });

  return { level, center, petals };
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 4 — HAPTIC FEEDBACK (navigator.vibrate; no-op on unsupported)
   ══════════════════════════════════════════════════════════════════════════ */

const vib = (p) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(p); } catch { /* ignore */ }
  }
};

const haptic = {
  tap:      () => vib(8),
  align:    () => vib(15),
  misalign: () => vib(12),
  win:      () => vib([40, 60, 40, 60, 80]),
};

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 5 — GAME STATE INITIALISER
   ══════════════════════════════════════════════════════════════════════════ */

function initState(level, prevTotalScore = 0) {
  const chapter = getChapter(level);
  const puzzle  = generatePuzzle(level, chapter);
  return {
    level,
    chapter,
    puzzle,
    phase:      'playing',   // 'playing' | 'won' | 'paused'
    moves:      0,
    totalScore: prevTotalScore,
    hintReady:  false,
    hintIdx:    null,
    startTime:  Date.now(),
    lastTap:    null,        // { idx, result:'aligned'|'misaligned', ts }
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 6 — DAISY APP
   ══════════════════════════════════════════════════════════════════════════ */

export function DaisyApp() {
  const [g, setG]          = useState(() => initState(1));
  const [emotion, setEm]   = useState('seeking');
  const misalignRef        = useRef([]);     // timestamps of recent misaligns (8 s window)
  const circleRef          = useRef(null);
  const hintTimerRef       = useRef(null);
  const winLockedRef       = useRef(false);  // block double-advances

  /* ── Apply chapter background to body ─────────────────────────────────── */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent',      g.chapter.accent);
    document.documentElement.style.setProperty('--accent-dark', g.chapter.accentDark);
    document.body.style.background = g.chapter.bg;
  }, [g.chapter]);

  /* ── 45-second hint timer ─────────────────────────────────────────────── */
  useEffect(() => {
    if (g.phase !== 'playing') return;
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setG(prev => ({ ...prev, hintReady: true }));
    }, 45_000);
    return () => clearTimeout(hintTimerRef.current);
  }, [g.level, g.phase]);

  /* ── Emotion derivation ─────────────────────────────────────────────────
     Re-derive on every lastTap change and on hintReady toggle.
     Use a ref-based 8-second sliding window for misalign timestamps so
     we never re-render just to track time.                                 */
  useEffect(() => {
    const tap = g.lastTap;
    if (tap?.result === 'misaligned') {
      const now = Date.now();
      misalignRef.current = [
        ...misalignRef.current.filter(t => now - t < 8_000),
        now,
      ];
    }

    const active    = g.puzzle.petals.filter(p => p.hasArrow);
    const aligned   = active.filter(p => p.aligned).length;
    const frac      = active.length > 0 ? aligned / active.length : 0;
    const recents   = misalignRef.current.filter(t => Date.now() - t < 8_000).length;

    setEm(deriveEmotion(frac, recents, g.hintReady));
  }, [g.lastTap, g.hintReady, g.phase]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* Reset misalign history on level change */
  useEffect(() => {
    misalignRef.current = [];
    setEm('seeking');
    winLockedRef.current = false;
  }, [g.level]);

  /* ── TAP HANDLER ────────────────────────────────────────────────────────
     Implements hemispheric bidirectional rotation.
     placementAngle = (360 / n) * idx
     spinDir(placementAngle) → 'cw' | 'ccw'
     Aligned when petal.dir === puzzle.center                               */
  const handleTap = useCallback((idx, angleDeg) => {
    if (g.phase !== 'playing') return;

    let tapResult = 'misaligned';

    setG(prev => {
      if (prev.phase !== 'playing') return prev;

      const rotate  = spinDir(angleDeg) === 'ccw' ? rotateCCW : rotateCW;
      const newPetals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        const newDir     = rotate(p.dir);
        const nowAligned = newDir === prev.puzzle.center;
        if (nowAligned) tapResult = 'aligned';
        return { ...p, dir: newDir, aligned: nowAligned };
      });

      const allAligned = newPetals
        .filter(p => p.hasArrow)
        .every(p => p.aligned);

      if (allAligned) tapResult = 'won';

      const next = {
        ...prev,
        moves:   prev.moves + 1,
        puzzle:  { ...prev.puzzle, petals: newPetals },
        lastTap: { idx, result: tapResult === 'won' ? 'aligned' : tapResult, ts: Date.now() },
      };

      if (allAligned && !winLockedRef.current) {
        winLockedRef.current = true;
        next.phase = 'won';
      }

      return next;
    });

    // Haptics (fire outside setState — no side-effects inside reducer)
    if (tapResult === 'aligned' || tapResult === 'won') haptic.align();
    else                                                 haptic.misalign();

  }, [g.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── SWIPE HANDLER — snap to nearest 45° direction ──────────────────── */
  const handleSwipe = useCallback((idx, dx, dy) => {
    if (g.phase !== 'playing') return;
    const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const snap     = Math.round(angleDeg / 45) * 45;

    // Map the swipe angle to the closest Dir
    const snapDir = DIRS[Math.round(snap / 45) % 8];

    setG(prev => {
      if (prev.phase !== 'playing') return prev;
      const newPetals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        const nowAligned = snapDir === prev.puzzle.center;
        return { ...p, dir: snapDir, aligned: nowAligned };
      });
      const allAligned = newPetals.filter(p => p.hasArrow).every(p => p.aligned);
      return {
        ...prev,
        moves:   prev.moves + 1,
        puzzle:  { ...prev.puzzle, petals: newPetals },
        phase:   allAligned && !winLockedRef.current ? 'won' : prev.phase,
        lastTap: { idx, result: 'aligned', ts: Date.now() },
      };
    });
  }, [g.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── WIN SEQUENCE — fire haptic, auto-advance after 700 ms ─────────── */
  useEffect(() => {
    if (g.phase !== 'won') return;
    haptic.win();

    const timer = setTimeout(() => {
      setG(prev => initState(prev.level + 1, prev.totalScore));
    }, 700);

    return () => clearTimeout(timer);
  }, [g.phase]);

  /* ── RESET (scramble) — keeps level, re-generates puzzle ─────────────── */
  const handleReset = () => {
    setG(prev => {
      const newPuzzle = generatePuzzle(prev.level, prev.chapter);
      return { ...prev, puzzle: newPuzzle, phase: 'playing', hintReady: false, hintIdx: null, lastTap: null };
    });
    misalignRef.current  = [];
    winLockedRef.current = false;
    setEm('seeking');
  };

  /* ── SKIP (dev / hint-reward shortcut) ───────────────────────────────── */
  const handleSkip = () => {
    if (winLockedRef.current) return;
    winLockedRef.current = true;
    setG(prev => initState(prev.level + 1, prev.totalScore));
  };

  /* ── DERIVED UI STATE ────────────────────────────────────────────────── */
  const { puzzle, chapter, phase, level, hintReady, hintIdx, lastTap } = g;
  const activePetals  = puzzle.petals.filter(p => p.hasArrow);
  const alignedCount  = activePetals.filter(p => p.aligned).length;
  const totalActive   = activePetals.length;
  const progressPct   = totalActive > 0 ? (alignedCount / totalActive) * 100 : 0;
  const isWon         = phase === 'won';
  const allAligned    = alignedCount === totalActive;

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  return (
    <div className="dz-app">

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
      <header className="dz-topbar">
        <button className="dz-btn" onClick={handleReset} aria-label="Restore puzzle">
          ↻
        </button>

        <div className="dz-title-area">
          <h1 className="dz-title">{chapter.name}</h1>
          <p className="dz-subtitle">Level {level}</p>
        </div>

        <button className="dz-btn" onClick={handleSkip} aria-label="Skip level">
          Skip ➔
        </button>
      </header>

      {/* ── Flower Canvas ─────────────────────────────────────────────── */}
      <main className="dz-flower-wrapper">
        <DaisyFlower
          puzzle={puzzle}
          shapeKey={chapter.shapeKey}
          petalColor={chapter.petalColor}
          accentColor={chapter.accent}
          emotionState={emotion}
          onTap={handleTap}
          onSwipe={handleSwipe}
          isWon={isWon}
          hintIdx={hintIdx}
          lastTap={lastTap}
          circleRef={circleRef}
        />
      </main>

      {/* ── Control Panel ─────────────────────────────────────────────── */}
      <section className="dz-panel" aria-label="Alignment progress">
        <div className="dz-panel-head">
          <span>PETAL ALIGNMENT</span>
          <span aria-live="polite">{alignedCount} / {totalActive}</span>
        </div>

        <div className="dz-progress-track" role="progressbar"
          aria-valuenow={alignedCount} aria-valuemin={0} aria-valuemax={totalActive}>
          <div
            className="dz-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="dz-action-zone">
          <button
            className="dz-action-btn"
            onClick={handleReset}
            aria-label="Restore — re-scramble petals"
          >
            Restore
          </button>

          <button
            className={`dz-action-btn accent${allAligned ? '' : ' locked'}`}
            onClick={allAligned ? handleSkip : undefined}
            aria-disabled={!allAligned}
            aria-label={allAligned ? 'Continue to next level' : 'Locked — align all petals first'}
          >
            {allAligned ? 'Continue →' : 'Locked Focus'}
          </button>
        </div>

        {/* Emotion state indicator (dev-visible, remove for production) */}
        <p style={{
          marginTop: '12px',
          fontSize: '0.68rem',
          fontWeight: 800,
          opacity: 0.35,
          textAlign: 'center',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {emotion} · {EMOTION_PROFILES[emotion].breathingPeriod}s breath
        </p>
      </section>
    </div>
  );
}
