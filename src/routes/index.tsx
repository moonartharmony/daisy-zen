import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useGame } from '../game/useGame';
import { DaisyCanvas } from '../game/DaisyCanvas';
import {
  Header, BottomArea, WinScreen,
  PauseModal, ChapterTransition, TutorialSheet,
} from '../game/UI';
import { getChapter } from '../game/types';

export const Route = createFileRoute('/')({ component: Game });

function Game() {
  const {
    s, tap, setDir, snapSwipe, nextLevel, reset, togglePause,
    dismissTr, hintIdx, circleRef,
  } = useGame();

  const [tutSeen, setTutSeen]   = useState(false);
  const [tutStep, setTutStep]   = useState<1 | 2>(1);

  const { puzzle, phase, chapter, totalScore, level, score, showTransition, hintReady } = s;

  const aligned  = puzzle.petals.filter(p => p.hasArrow && p.aligned).length;
  const total    = puzzle.petals.filter(p => p.hasArrow).length;
  const nextCh   = getChapter(level + 1);
  const showTut  = level === 1 && !tutSeen && phase === 'playing';

  const handleTap = (idx: number, angle: number) => {
    if (showTut && tutStep === 1) setTutStep(2);   /* advance to swipe step */
    tap(idx, angle);
  };

  const handleSwipe = (idx: number, dx: number, dy: number) => {
    if (showTut) setTutSeen(true);                 /* swipe ends the tutorial */
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

