/**
 * daisy-app.jsx — Sprint 1 + Journey Map Edition
 *
 * Preserves:
 *   • Organic Bezier SVG petals (daisy-flower.jsx)
 *   • 5-state emotion engine + --breath-period breathing
 *   • Hemispheric rotation (tap → spinDir → CW / CCW)
 *   • 8-direction system, 5-chapter progression
 *
 * Adds (ported from HTML prototype):
 *   • Win card overlay with animated score counter + epigraph
 *   • Pause → Journey Map (full-screen chapter progress)
 *   • Chapter transition screen (watermark daisy + fade)
 *   • Sparkle confetti burst on win
 *   • calcScore() — moveBonus + timeBonus formula
 *   • Bottom navigation (Ana Sayfa · Journey · Profil)
 *   • Hint system with visual ring on the optimal petal
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DaisyFlower, EMOTION_PROFILES, deriveEmotion } from './daisy-flower.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 1 — DIRECTION SYSTEM (8-step)
   ══════════════════════════════════════════════════════════════════════════ */

const DIRS   = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const DIR_DEG = { n:0, ne:45, e:90, se:135, s:180, sw:225, w:270, nw:315 };

const rotateCW  = d => DIRS[(DIRS.indexOf(d) + 1) % 8];
const rotateCCW = d => DIRS[(DIRS.indexOf(d) + 7) % 8];

/** Hemispheric rule: angle > 180° → CCW (left half), ≤ 180° → CW (right half) */
const spinDir = angleDeg => angleDeg > 180 ? 'ccw' : 'cw';

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 2 — CHAPTER DEFINITIONS
   ══════════════════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  {
    id: 'garden',   name: 'The Garden',   epigraph: 'Where arrows first spoke.',
    levels: [1, 10],   bg: '#B2AC88', accent: '#FFD700', accentDark: '#D4B000',
    petalColor: '#FFFFFF', shapeKey: 'oval',    dirs: DIRS,
    icon: '🌸',
  },
  {
    id: 'forest',   name: 'The Forest',   epigraph: 'Deeper paths, older silence.',
    levels: [11, 25],  bg: '#8FA67A', accent: '#516C45', accentDark: '#3C5233',
    petalColor: '#F4F9F0', shapeKey: 'leaf',    dirs: ['n','ne','e','se','s','sw','w','nw'],
    icon: '🌲',
  },
  {
    id: 'mountain', name: 'The Mountain', epigraph: 'Stillness is not emptiness.',
    levels: [26, 40],  bg: '#A5ADB8', accent: '#708090', accentDark: '#506070',
    petalColor: '#F0F2F5', shapeKey: 'diamond', dirs: ['n','e','s','w'],
    icon: '⛰️',
  },
  {
    id: 'storm',    name: 'The Storm',    epigraph: 'Find the eye.',
    levels: [41, 55],  bg: '#6B5B4E', accent: '#C06030', accentDark: '#904020',
    petalColor: '#FAF0EC', shapeKey: 'spike',   dirs: DIRS,
    icon: '⚡',
  },
  {
    id: 'void',     name: 'The Void',     epigraph: 'You have always known the way.',
    levels: [56, 99],  bg: '#1A1A2E', accent: '#9B5DE5', accentDark: '#7B3DC5',
    petalColor: '#E8D5FF', shapeKey: 'clover',  dirs: DIRS,
    icon: '🌑',
  },
];

const getChapter = level =>
  CHAPTERS.find(c => level >= c.levels[0] && level <= c.levels[1]) ?? CHAPTERS[0];

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 3 — PUZZLE GENERATION (deterministic LCG seeded by level)
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

  const base       = [4, 6, 8, 6];
  const petalCount = base[(level - 1) % 4] + (Math.floor((level - 1) / 4) % 2) * 2;
  const n          = Math.min(petalCount, 12);
  const dirs       = chapter.dirs ?? DIRS;
  const center     = dirs[Math.floor(rng() * dirs.length)];

  const activeCount = Math.max(2, Math.floor(n * (0.5 + rng() * 0.25)));
  const activeSlots = new Set();
  while (activeSlots.size < activeCount) {
    activeSlots.add(Math.floor(rng() * n));
  }

  const petals = Array.from({ length: n }, (_, i) => {
    if (!activeSlots.has(i)) return { idx: i, hasArrow: false, dir: center, aligned: true };
    let dir;
    do { dir = dirs[Math.floor(rng() * dirs.length)]; } while (dir === center);
    return { idx: i, hasArrow: true, dir, aligned: false };
  });

  return { level, center, petals };
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 4 — SCORE CALCULATION
   Matches HTML prototype formula: 100 base + move bonus + time bonus
   ══════════════════════════════════════════════════════════════════════════ */

function calcScore(moves, arrowCount, elapsedSec) {
  const moveBonus = Math.max(0, (arrowCount * 3 - moves)) * 12;
  const timeBonus = elapsedSec < 20 ? 60 : elapsedSec < 45 ? 30 : elapsedSec < 90 ? 10 : 0;
  return 100 + moveBonus + timeBonus;
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 5 — HAPTIC FEEDBACK
   ══════════════════════════════════════════════════════════════════════════ */

const vib = p => {
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
   SECTION 6 — GAME STATE INITIALISER
   ══════════════════════════════════════════════════════════════════════════ */

function initState(level, prevTotalScore = 0) {
  const chapter = getChapter(level);
  const puzzle  = generatePuzzle(level, chapter);
  return {
    level, chapter, puzzle,
    phase:      'playing',
    moves:      0,
    totalScore: prevTotalScore,
    hintReady:  false,
    hintIdx:    null,
    startTime:  Date.now(),
    lastTap:    null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 7 — SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Chapter Transition ─────────────────────────────────────────────────── */
function ChapterTransition({ chapter }) {
  const petals = Array.from({ length: 8 }, (_, i) =>
    <ellipse key={i} cx="100" cy="44" rx="14" ry="30" fill="white"
      transform={`rotate(${i * 45} 100 100)`} />,
  );

  return (
    <div className="dz-chapter-transition" style={{ background: chapter.bg }}>
      <svg className="dz-chapter-watermark" viewBox="0 0 200 200">
        {petals}
        <circle cx="100" cy="100" r="26" fill="white" />
      </svg>
      <div className="dz-chapter-name">{chapter.name}</div>
      <div className="dz-chapter-epigraph">"{chapter.epigraph}"</div>
    </div>
  );
}

/* ── Win Card Overlay ────────────────────────────────────────────────────── */
function WinCard({ score, totalScore, epigraph, onNext }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let count = 0;
    const step = Math.max(1, Math.ceil(score / 30));
    const id = setInterval(() => {
      count = Math.min(count + step, score);
      setDisplayed(count);
      if (count >= score) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [score]);

  return (
    <div className="dz-win-overlay">
      <div className="dz-win-card dz-auth-card">
        <div className="dz-win-score">{String(displayed).padStart(4, '0')}</div>
        <div className="dz-win-epigraph">"{epigraph}"</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, opacity: 0.45, marginBottom: 20 }}>
          TOPLAM · {String(totalScore + score).padStart(4, '0')}
        </div>
        <button className="dz-btn dz-btn--accent dz-btn--full" onClick={onNext}>
          Next level →
        </button>
      </div>
    </div>
  );
}

/* ── Pause / Journey Modal ───────────────────────────────────────────────── */
function PauseModal({ chapterName, onContinue, onReset, onJourney }) {
  return (
    <div className="dz-pause-overlay">
      <div className="dz-pause-card dz-auth-card">
        <div className="dz-pause-chapter">{chapterName}</div>
        <button className="dz-btn dz-btn--accent dz-btn--full" onClick={onContinue}>
          Devam Et
        </button>
        <button className="dz-btn dz-btn--full" onClick={onJourney}>
          Journey Map
        </button>
        <button className="dz-btn dz-btn--full" onClick={onReset}>
          Baştan Başla
        </button>
      </div>
    </div>
  );
}

/* ── Journey Map ─────────────────────────────────────────────────────────── */
function JourneyMap({ currentLevel, totalScore, onClose, onReplay }) {
  return (
    <div className="dz-journey">
      {/* Header */}
      <div className="dz-jm-header">
        <button className="dz-btn" style={{ minWidth: 46 }} onClick={onClose} aria-label="Back">
          ←
        </button>
        <span className="dz-jm-title">Journey Map</span>
        <div style={{ width: 46 }} />
      </div>

      {/* Score strip */}
      <div style={{
        padding: '10px 16px 0',
        textAlign: 'center',
        fontSize: '0.72rem',
        fontWeight: 800,
        opacity: 0.5,
        letterSpacing: '0.06em',
      }}>
        TOTAL SCORE · {String(totalScore).padStart(4, '0')}
      </div>

      {/* Chapter list */}
      <div className="dz-jm-list">
        {CHAPTERS.map((ch, idx) => {
          const isDone   = currentLevel > ch.levels[1];
          const isActive = currentLevel >= ch.levels[0] && currentLevel <= ch.levels[1];
          const isLocked = currentLevel < ch.levels[0];
          const status   = isDone ? 'done' : isActive ? 'active' : 'locked';

          const total     = ch.levels[1] - ch.levels[0] + 1;
          const completed = isDone ? total : isActive ? currentLevel - ch.levels[0] : 0;
          const pct       = isDone ? 100 : isActive ? (completed / total) * 100 : 0;

          return (
            <div key={ch.id}
              className={`dz-ch-card dz-ch-card--${status}`}
            >
              <div className="dz-ch-card-top">
                <div className="dz-ch-icon">{ch.icon}</div>
                <div className="dz-ch-info">
                  <span className="dz-ch-num">BÖLÜM {idx + 1}</span>
                  <span className="dz-ch-name">{ch.name}</span>
                  {isActive && (
                    <span className="dz-ch-badge">⚡ AKTİF</span>
                  )}
                  {isDone && (
                    <span className="dz-ch-badge">✓ TAMAMLANDI</span>
                  )}
                </div>
                {isLocked && (
                  <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>🔒</span>
                )}
              </div>

              <div className="dz-ch-card-bottom">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="dz-ch-range">Seviye {ch.levels[0]}–{ch.levels[1]}</span>
                  {(isActive || isDone) && (
                    <div className="dz-ch-progress-track">
                      <div className="dz-ch-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                {isDone && (
                  <button className="dz-ch-btn dz-ch-btn--replay" onClick={() => onReplay(ch)}>
                    TEKRARLA
                  </button>
                )}
                {isActive && (
                  <button className="dz-ch-btn dz-ch-btn--continue" onClick={onClose}>
                    DEVAM ET
                  </button>
                )}
                {isLocked && (
                  <button className="dz-ch-btn dz-ch-btn--locked" disabled>
                    KİLİTLİ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <nav className="dz-bottom-nav">
        <button className="dz-nav-btn" onClick={onClose}>
          <div className="dz-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11L12 4l9 7v9h-6v-5H9v5H3z"/>
            </svg>
          </div>
          <span>Ana Sayfa</span>
        </button>
        <button className="dz-nav-btn dz-nav-btn--active">
          <div className="dz-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/>
              <path d="M9 4v14M15 6v14"/>
            </svg>
          </div>
          <span>Journey</span>
        </button>
        <button className="dz-nav-btn">
          <div className="dz-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>
            </svg>
          </div>
          <span>Profil</span>
        </button>
      </nav>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 8 — SPARKLE SYSTEM (DOM injection — zero rAF overhead)
   ══════════════════════════════════════════════════════════════════════════ */

function triggerSparkles(container) {
  if (!container) return;
  container.innerHTML = '';
  const cx = 160, cy = 160; // SVG 320×320 centre

  for (let k = 0; k < 18; k++) {
    const angle = (k / 18) * Math.PI * 2 + Math.random() * 0.3;
    const dist  = 70 + Math.random() * 70;
    const x     = cx + Math.cos(angle) * dist;
    const y     = cy + Math.sin(angle) * dist;
    const size  = 7 + Math.random() * 8;
    const s     = document.createElement('div');
    s.className = 'dz-spark';
    s.style.cssText = [
      `width:${size}px`, `height:${size}px`,
      `left:${x - size / 2}px`, `top:${y - size / 2}px`,
      `animation-delay:${(Math.random() * 0.2).toFixed(3)}s`,
      `animation-duration:${(0.85 + Math.random() * 0.45).toFixed(3)}s`,
    ].join(';');
    container.appendChild(s);
  }

  setTimeout(() => { if (container.isConnected) container.innerHTML = ''; }, 1600);
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 9 — DAISY APP
   ══════════════════════════════════════════════════════════════════════════ */

export function DaisyApp() {
  const [g, setG]             = useState(() => initState(1));
  const [emotion, setEm]      = useState('calm');
  const [levelScore, setLevelScore] = useState(0);
  const [navMode, setNavMode] = useState('game'); // 'game' | 'journey'
  const [transitionCh, setTransitionCh] = useState(null); // chapter for transition screen

  const misalignRef    = useRef([]);
  const circleRef      = useRef(null);
  const hintTimerRef   = useRef(null);
  const winLockedRef   = useRef(false);
  const sparkLayerRef  = useRef(null);

  /* ── Apply chapter colours to CSS vars ───────────────────────────────── */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent',      g.chapter.accent);
    document.documentElement.style.setProperty('--accent-dark', g.chapter.accentDark);
    document.body.style.background = g.chapter.bg;
  }, [g.chapter]);

  /* ── 45-second hint timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (g.phase !== 'playing') return;
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(
      () => setG(prev => ({ ...prev, hintReady: true })),
      45_000,
    );
    return () => clearTimeout(hintTimerRef.current);
  }, [g.level, g.phase]);

  /* ── Emotion derivation ──────────────────────────────────────────────── */
  useEffect(() => {
    if (g.lastTap?.result === 'misaligned') {
      const now = Date.now();
      misalignRef.current = [
        ...misalignRef.current.filter(t => now - t < 8_000), now,
      ];
    }
    const active  = g.puzzle.petals.filter(p => p.hasArrow);
    const aligned = active.filter(p => p.aligned).length;
    const frac    = active.length > 0 ? aligned / active.length : 0;
    const recents = misalignRef.current.filter(t => Date.now() - t < 8_000).length;
    setEm(deriveEmotion(frac, recents, g.hintReady));
  }, [g.lastTap, g.hintReady, g.phase]); // eslint-disable-line

  /* Reset on level change */
  useEffect(() => {
    misalignRef.current = [];
    setEm('calm');
    winLockedRef.current = false;
  }, [g.level]);

  /* ── Win — calculate score + sparkles ───────────────────────────────── */
  useEffect(() => {
    if (g.phase !== 'won') return;
    haptic.win();
    const elapsedSec = Math.round((Date.now() - g.startTime) / 1000);
    const arrowCount = g.puzzle.petals.filter(p => p.hasArrow).length;
    const score      = calcScore(g.moves, arrowCount, elapsedSec);
    setLevelScore(score);
    triggerSparkles(sparkLayerRef.current);
  }, [g.phase]); // eslint-disable-line

  /* ── TAP HANDLER ─────────────────────────────────────────────────────── */
  const handleTap = useCallback((idx, angleDeg) => {
    if (g.phase !== 'playing') return;
    let tapResult = 'misaligned';

    setG(prev => {
      if (prev.phase !== 'playing') return prev;
      const rotate    = spinDir(angleDeg) === 'ccw' ? rotateCCW : rotateCW;
      const newPetals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        const newDir     = rotate(p.dir);
        const nowAligned = newDir === prev.puzzle.center;
        if (nowAligned) tapResult = 'aligned';
        return { ...p, dir: newDir, aligned: nowAligned };
      });
      const allAligned = newPetals.filter(p => p.hasArrow).every(p => p.aligned);
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

    if (tapResult === 'aligned' || tapResult === 'won') haptic.align();
    else                                                 haptic.misalign();
  }, [g.phase]); // eslint-disable-line

  /* ── SWIPE HANDLER ───────────────────────────────────────────────────── */
  const handleSwipe = useCallback((idx, dx, dy) => {
    if (g.phase !== 'playing') return;
    const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const snapDir  = DIRS[Math.round(angleDeg / 45) % 8];

    setG(prev => {
      if (prev.phase !== 'playing') return prev;
      const newPetals = prev.puzzle.petals.map(p => {
        if (p.idx !== idx || !p.hasArrow) return p;
        return { ...p, dir: snapDir, aligned: snapDir === prev.puzzle.center };
      });
      const allAligned = newPetals.filter(p => p.hasArrow).every(p => p.aligned);
      if (allAligned && !winLockedRef.current) winLockedRef.current = true;
      return {
        ...prev,
        moves:   prev.moves + 1,
        puzzle:  { ...prev.puzzle, petals: newPetals },
        phase:   allAligned ? 'won' : prev.phase,
        lastTap: { idx, result: 'aligned', ts: Date.now() },
      };
    });
  }, [g.phase]); // eslint-disable-line

  /* ── NEXT LEVEL ─────────────────────────────────────────────────────────
     Chapter change → show ChapterTransition for 2.9s then load next level.
     Same chapter → load immediately.                                       */
  const handleNextLevel = useCallback(() => {
    const nextLevel   = g.level + 1;
    const prevChId    = g.chapter.id;
    const nextChapter = getChapter(nextLevel);
    const newTotal    = g.totalScore + levelScore;

    misalignRef.current  = [];
    winLockedRef.current = false;
    setEm('calm');

    if (nextChapter.id !== prevChId) {
      setTransitionCh(nextChapter);
      setTimeout(() => {
        setTransitionCh(null);
        setG(initState(nextLevel, newTotal));
      }, 2900);
    } else {
      setG(initState(nextLevel, newTotal));
    }
  }, [g.level, g.chapter.id, g.totalScore, levelScore]);

  /* ── RESET ───────────────────────────────────────────────────────────── */
  const handleReset = () => {
    setG(prev => ({
      ...prev,
      puzzle:     generatePuzzle(prev.level, prev.chapter),
      phase:      'playing',
      hintReady:  false,
      hintIdx:    null,
      lastTap:    null,
      moves:      0,
      startTime:  Date.now(),
    }));
    misalignRef.current  = [];
    winLockedRef.current = false;
    setEm('calm');
    setNavMode('game');
  };

  /* ── REPLAY CHAPTER from Journey Map ─────────────────────────────────── */
  const handleReplayChapter = chapter => {
    misalignRef.current  = [];
    winLockedRef.current = false;
    setNavMode('game');
    setG(initState(chapter.levels[0], g.totalScore));
    setEm('calm');
  };

  /* ── DERIVED STATE ───────────────────────────────────────────────────── */
  const { puzzle, chapter, phase, level, hintReady, hintIdx, lastTap, totalScore } = g;
  const activePetals = puzzle.petals.filter(p => p.hasArrow);
  const alignedCount = activePetals.filter(p => p.aligned).length;
  const totalActive  = activePetals.length;
  const progressPct  = totalActive > 0 ? (alignedCount / totalActive) * 100 : 0;
  const isWon        = phase === 'won';
  const isPaused     = phase === 'paused';

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="dz-app-root">

      {/* ── Chapter Transition (topmost overlay) ─────────────────────── */}
      {transitionCh && <ChapterTransition chapter={transitionCh} />}

      {/* ── Journey Map (full screen, z-index 10) ────────────────────── */}
      {navMode === 'journey' && (
        <JourneyMap
          currentLevel={level}
          totalScore={totalScore}
          onClose={() => {
            setNavMode('game');
            setG(prev => ({ ...prev, phase: 'playing' }));
          }}
          onReplay={handleReplayChapter}
        />
      )}

      {/* ── Win Card Overlay ─────────────────────────────────────────── */}
      {isWon && navMode === 'game' && !transitionCh && (
        <WinCard
          score={levelScore}
          totalScore={totalScore}
          epigraph={chapter.epigraph}
          onNext={handleNextLevel}
        />
      )}

      {/* ── Pause Modal ──────────────────────────────────────────────── */}
      {isPaused && navMode === 'game' && (
        <PauseModal
          chapterName={chapter.name}
          onContinue={() => setG(prev => ({ ...prev, phase: 'playing' }))}
          onReset={handleReset}
          onJourney={() => setNavMode('journey')}
        />
      )}

      {/* ── Game Screen ──────────────────────────────────────────────── */}
      <div className="dz-app">

        {/* Header */}
        <header className="dz-topbar">
          <button
            className="dz-btn"
            onClick={() => {
              setG(prev => ({ ...prev, phase: 'paused' }));
            }}
            aria-label="Pause"
          >
            ⏸
          </button>

          <div className="dz-title-area">
            <h1 className="dz-title">Level {level}</h1>
            <p className="dz-subtitle">{chapter.name}</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.45, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: chapter.accentDark }}>
              {String(totalScore).padStart(4, '0')}
            </div>
          </div>
        </header>

        {/* Flower Canvas */}
        <main className="dz-flower-wrapper">
          <div style={{ position: 'relative', width: 400, height: 440 }}>
            <DaisyFlower
              puzzle={puzzle}
              isWon={isWon}
              onTap={handleTap}
              hintPetalIdx={hintIdx}
            />
            {/* Sparkle injection layer */}
            <div
              ref={sparkLayerRef}
              className="dz-spark-layer"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
          </div>
        </main>

        {/* Control Panel */}
        <section className="dz-panel" aria-label="Alignment progress">
          <div className="dz-panel-head">
            <span>{chapter.name.toUpperCase()}</span>
            <span aria-live="polite">{alignedCount}/{totalActive}</span>
          </div>

          <div className="dz-progress-track" role="progressbar"
            aria-valuenow={alignedCount} aria-valuemin={0} aria-valuemax={totalActive}>
            <div className="dz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="dz-action-zone">
            <button className="dz-action-btn" onClick={handleReset} aria-label="Restore puzzle">
              ↻ Restore
            </button>
            <button
              className={`dz-action-btn accent${hintReady ? '' : ' locked'}`}
              onClick={() => setNavMode('journey')}
              aria-label="View Journey Map"
            >
              {hintReady ? '💡 Hint' : '🗺️ Journey'}
            </button>
          </div>

          {/* Emotion micro-indicator */}
          <p style={{
            marginTop: 10, fontSize: '0.65rem', fontWeight: 800,
            opacity: 0.3, textAlign: 'center', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {emotion} · {EMOTION_PROFILES[emotion].breathingPeriod}s
          </p>
        </section>

      </div>
    </div>
  );
}
