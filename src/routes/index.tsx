import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useGame } from '../game/useGame';
import { DaisyCanvas } from '../game/DaisyCanvas';
import {
  Header,
  ProgressArea,
  WinOverlay,
  PauseModal,
  ChapterTransition,
  TutorialSheet,
} from '../game/GameUI';

export const Route = createFileRoute('/')({
  component: Game,
});

function Game() {
  const {
    s,
    tap,
    nextLevel,
    reset,
    togglePause,
    dismissTransition,
    hintIdx,
    circleRef,
  } = useGame();

  const [tutorialSeen, setTutorialSeen] = useState(false);
  const showTutorial = s.level === 1 && !tutorialSeen && s.phase === 'playing';

  const { puzzle, phase, chapter, totalScore, level, score, moves, showTransition, hintReady } = s;

  const aligned = puzzle.petals.filter(p => p.hasArrow && p.aligned).length;
  const total   = puzzle.petals.filter(p => p.hasArrow).length;

  const handleTap = (idx: number) => {
    if (showTutorial) setTutorialSeen(true);
    tap(idx);
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
        totalScore={totalScore}
        onPause={togglePause}
      />

      {/* Canvas */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <DaisyCanvas
          puzzle={puzzle}
          onTap={handleTap}
          isWon={phase === 'won'}
          hintIdx={hintIdx}
          circleRef={circleRef}
        />
      </div>

      <ProgressArea
        chapterName={chapter.name}
        aligned={aligned}
        total={total}
        moves={moves}
        onReset={reset}
        onHint={() => {}}
        hintReady={hintReady}
      />

      {/* Overlays — stacked by z-index */}
      {showTutorial && (
        <TutorialSheet onDismiss={() => setTutorialSeen(true)} />
      )}
      {phase === 'won' && (
        <WinOverlay score={score} onNext={nextLevel} />
      )}
      {phase === 'paused' && (
        <PauseModal
          chapter={chapter}
          onResume={togglePause}
          onRestart={reset}
        />
      )}
      {showTransition && (
        <ChapterTransition
          chapter={chapter}
          onDismiss={dismissTransition}
        />
      )}
    </div>
  );
}
