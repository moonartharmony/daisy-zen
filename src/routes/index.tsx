import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useGame } from '../game/useGame';
import { DaisyCanvas, type EmotionalState } from '../game/DaisyCanvas';
import { useAudio } from '../game/useAudio';
import {
  Header, BottomArea, WinScreen,
  PauseModal, ChapterTransition, TutorialSheet,
} from '../game/UI';
import { getChapter } from '../game/types';

export const Route = createFileRoute('/')({ component: Game });

function Game() {
  const {
    s, tap, setDir, snapSwipe,
    nextLevel, reset, togglePause,
    dismissTr, hintIdx, circleRef, lastTap,
  } = useGame();

  const [tutSeen, setTutSeen] = useState(false);
  const [tutStep, setTutStep] = useState<1 | 2>(1);

  const { puzzle, phase, chapter, totalScore, level, score, showTransition, hintReady } = s;

  const aligned = puzzle.petals.filter(p => p.hasArrow && p.aligned).length;
  const total   = puzzle.petals.filter(p => p.hasArrow).length;
  const nextCh  = getChapter(level + 1);
  const showTut = level === 1 && !tutSeen && phase === 'playing';

  /* ── Phase 2: Emotional state ────────────────────────────────────────
     Maps game progress + hint readiness to three emotional archetypes
     that drive the petal gradient tip colour in DaisyCanvas.
       calm        — default, steady progress
       anxious     — hint ready AND < 50% aligned (struggling)
       melancholic — > 70% aligned (contemplative near-completion)       */
  const alignedFrac     = aligned / Math.max(total, 1);
  const emotionalState: EmotionalState =
    hintReady && alignedFrac < 0.5 ? 'anxious'     :
    alignedFrac > 0.7               ? 'melancholic' :
    'calm';

  /* ── Phase 3: Web Audio ambient engine ──────────────────────────────
     Starts on first pointerdown (AudioContext browser policy).
     Crossfades drone frequency + filter on chapter change.
     Writes --audio-pulse CSS var every rAF from FFT data.              */
  useAudio(chapter, phase === 'playing');

  /* ── Gesture handlers ──────────────────────────────────────────────── */
  const handleTap = (idx: number, angle: number) => {
    if (showTut && tutStep === 1) setTutStep(2);  // advance tutorial to swipe step
    tap(idx, angle);
  };

  const handleSwipe = (idx: number, dx: number, dy: number) => {
    if (showTut) setTutSeen(true);                // swipe completes the tutorial
    setDir(idx, snapSwipe(dx, dy));
  };

  return (
    <div style={{
      position:      'relative',
      width:         '100%',
      height:        '100dvh',
      maxWidth:      430,
      margin:        '0 auto',
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
    }}>
      <Header
        level={level}
        chapter={chapter}
        totalScore={totalScore}
        onPause={togglePause}
      />

      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <DaisyCanvas
          puzzle={puzzle}
          chapter={chapter}
          onTap={handleTap}
          onSwipe={handleSwipe}
          isWon={phase === 'won'}
          hintIdx={hintIdx}
          lastTap={lastTap}
          emotionalState={emotionalState}
          circleRef={circleRef}
        />
      </div>

      <BottomArea
        chapter={chapter}
        aligned={aligned}
        total={total}
        onReset={reset}
        onHint={() => {}}
        hintReady={hintReady}
      />

      {showTut && (
        <TutorialSheet
          step={tutStep}
          onDismiss={() => setTutSeen(true)}
        />
      )}

      {phase === 'won' && (
        <WinScreen
          score={score}
          nextCh={nextCh}
          curCh={chapter}
          petalCount={puzzle.petals.length}
          onNext={nextLevel}
        />
      )}

      {phase === 'paused' && (
        <PauseModal
          chapter={chapter}
          onResume={togglePause}
          onRestart={reset}
        />
      )}

      {showTransition && (
        <ChapterTransition chapter={chapter} onDismiss={dismissTr} />
      )}
    </div>
  );
}
