import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, RotateCcw, ArrowRight, Lightbulb } from "lucide-react";
import { Daisy, type PetalAnim } from "@/components/Daisy";
import {
  DIRECTIONS,
  TOTAL_LEVELS,
  getPuzzle,
  type Direction,
} from "@/lib/puzzles";
import { getChapter } from "@/lib/chapters";
import { ChapterTransition } from "@/components/ChapterTransition";
import { TutorialCoach } from "@/components/TutorialCoach";
import { haptic } from "@/lib/haptic";

export const Route = createFileRoute("/")({
  component: Game,
});

function rotateCW(dir: Direction): Direction {
  const i = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[(i + 1) % 8];
}

function stepsCW(from: Direction, to: Direction): number {
  const f = DIRECTIONS.indexOf(from);
  const t = DIRECTIONS.indexOf(to);
  return (t - f + 8) % 8;
}

const MOVE_BUDGET_MULT = 3;
const HINT_DELAY_MS = 45000;

function Game() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasAligned, setHasAligned] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  const puzzle = useMemo(() => getPuzzle(level), [level]);
  const chapter = useMemo(() => getChapter(level), [level]);

  const [petalDirs, setPetalDirs] = useState<(Direction | null)[]>(
    () => puzzle.petals.map((p) => p.startDir),
  );
  const [petalAnims, setPetalAnims] = useState<PetalAnim[]>(
    () => puzzle.petals.map(() => null),
  );
  const [centerPulsing, setCenterPulsing] = useState(false);
  const [centerGlow, setCenterGlow] = useState(false);

  // Chapter transition state — show overlay when entering a new chapter
  const [transitionChapterId, setTransitionChapterId] = useState<string | null>(
    chapter.id,
  );
  const lastChapterIdRef = useRef<string>(chapter.id);

  // Hint state
  const [hintAvailable, setHintAvailable] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHintTimer = () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintAvailable(false);
    hintTimerRef.current = setTimeout(() => setHintAvailable(true), HINT_DELAY_MS);
  };

  // Reset state on level change
  useEffect(() => {
    setPetalDirs(puzzle.petals.map((p) => p.startDir));
    setPetalAnims(puzzle.petals.map(() => null));
    setMoves(0);
    setHasAligned(false);
    setWon(false);
    setBursting(false);
    setCenterGlow(false);
    setCenterPulsing(false);
    startedAtRef.current = Date.now();
    startHintTimer();

    if (chapter.id !== lastChapterIdRef.current) {
      lastChapterIdRef.current = chapter.id;
      setTransitionChapterId(chapter.id);
      haptic.chapter();
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  const arrowedIndices = puzzle.petals
    .map((p, i) => (p.hasArrow ? i : -1))
    .filter((i) => i >= 0);

  const matchedCount = arrowedIndices.filter(
    (i) => petalDirs[i] === puzzle.centerDir,
  ).length;

  const moveBudget = arrowedIndices.length * MOVE_BUDGET_MULT;
  const remaining = Math.max(0, moveBudget - moves);

  const setPetalAnim = (i: number, a: PetalAnim, ms: number) => {
    setPetalAnims((prev) => {
      const next = [...prev];
      next[i] = a;
      return next;
    });
    setTimeout(() => {
      setPetalAnims((prev) => {
        if (prev[i] !== a) return prev;
        const next = [...prev];
        next[i] = null;
        return next;
      });
    }, ms);
  };

  const handleTap = (i: number) => {
    if (won || paused) return;
    const cur = petalDirs[i];
    if (!cur) return;
    const next = rotateCW(cur);
    const target = puzzle.centerDir;
    const wasAligned = cur === target;
    const willAlign = next === target;

    setPetalDirs((prev) => {
      const arr = [...prev];
      arr[i] = next;
      return arr;
    });
    setMoves((m) => m + 1);

    // Reset hint timer on every interaction
    startHintTimer();

    if (willAlign) {
      // Snap into place — satisfying "click"
      haptic.align();
      setHasAligned(true);
      setPetalAnim(i, "aligned", 320);
      setCenterPulsing(true);
      setTimeout(() => setCenterPulsing(false), 260);
    } else if (wasAligned && !willAlign) {
      // Was correct, now broke it
      haptic.misalign();
      setPetalAnim(i, "error", 220);
    } else {
      // Plain tap
      haptic.tap();
      setPetalAnim(i, "pressed", 80);
    }
  };

  // Win detection
  useEffect(() => {
    if (won || arrowedIndices.length === 0) return;
    const allMatch = arrowedIndices.every(
      (i) => petalDirs[i] === puzzle.centerDir,
    );
    if (allMatch) {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const timeBonus = elapsed < 30 ? 50 : elapsed < 60 ? 25 : 0;
      const earned = remaining * 10 + timeBonus;
      setWon(true);
      haptic.win();
      setCenterGlow(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setHintAvailable(false);
      setTimeout(() => setBursting(true), 250);
      const target = earned;
      setDisplayedScore(0);
      const startTs = performance.now();
      const dur = 700;
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTs) / dur);
        setDisplayedScore(Math.round(target * t));
        if (t < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 400);
      setScore((s) => s + earned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petalDirs]);

  const handleReset = () => {
    setPetalDirs(puzzle.petals.map((p) => p.startDir));
    setPetalAnims(puzzle.petals.map(() => null));
    setMoves(0);
    setHasAligned(false);
    setCenterGlow(false);
    setBursting(false);
    setWon(false);
    startedAtRef.current = Date.now();
    startHintTimer();
  };

  const handleNext = () => {
    setLevel((l) => (l >= TOTAL_LEVELS ? 1 : l + 1));
  };

  const handleHint = () => {
    // Find the arrowed petal needing fewest CW rotations to align (and not 0)
    let bestIdx = -1;
    let bestSteps = 9;
    for (const i of arrowedIndices) {
      const d = petalDirs[i];
      if (!d) continue;
      const s = stepsCW(d, puzzle.centerDir);
      if (s > 0 && s < bestSteps) {
        bestSteps = s;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      setPetalAnim(bestIdx, "hint", 2200);
    }
    setHintAvailable(false);
  };

  const totalArrowed = arrowedIndices.length;

  return (
    <main
      className="chapter-bg min-h-[100dvh] w-full flex flex-col items-center px-4 py-5 gap-6"
      style={{ backgroundColor: chapter.bgColor }}
    >
      <header className="w-full max-w-md flex items-center justify-between gap-3">
        <button
          aria-label="Pause"
          onClick={() => setPaused(true)}
          className="neo neo-press rounded-xl bg-white p-2.5"
        >
          <Pause className="size-5" strokeWidth={2.5} />
        </button>
        <div className="neo rounded-xl bg-white px-4 py-2 text-body-lg">
          Level {level}
        </div>
        <div className="neo rounded-xl bg-primary px-4 py-2 text-body-lg text-[color:var(--primary-foreground)]">
          {score}
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center w-full">
        <Daisy
          puzzle={puzzle}
          petalDirs={petalDirs}
          petalAnims={petalAnims}
          onTapPetal={handleTap}
          bursting={bursting}
          centerPulsing={centerPulsing}
          centerGlow={centerGlow}
          petalColor={chapter.petalColor}
        />
      </section>

      <footer className="w-full max-w-md flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-label" style={{ color: "rgba(255,255,255,0.85)" }}>
            {chapter.name}
          </span>
          <span className="text-label ml-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
            {matchedCount}/{totalArrowed}
          </span>
        </div>
        <div className="neo rounded-xl bg-white h-5 overflow-hidden p-0.5">
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{
              width: totalArrowed
                ? `${(matchedCount / totalArrowed) * 100}%`
                : "0%",
            }}
          />
        </div>
        <div className="text-label -mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          Moves {moves} · Budget {moveBudget}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="neo neo-press rounded-xl bg-primary text-[color:var(--primary-foreground)] py-3 text-body-lg flex items-center justify-center gap-2 flex-1"
          >
            <RotateCcw className="size-5" strokeWidth={2.5} />
            Reset
          </button>
          {hintAvailable && !won && (
            <button
              onClick={handleHint}
              className="neo neo-press rounded-xl bg-white text-[color:var(--ink)] py-3 px-4 text-body-lg flex items-center justify-center gap-2 animate-pop-in"
            >
              <Lightbulb className="size-5" strokeWidth={2.5} />
              Hint
            </button>
          )}
        </div>
      </footer>

      {/* Chapter transition */}
      {transitionChapterId && (
        <ChapterTransition
          chapter={chapter}
          onDone={() => setTransitionChapterId(null)}
        />
      )}

      {/* First-time interaction guide (L1–L2) */}
      <TutorialCoach level={level} hasTapped={moves > 0} hasAligned={hasAligned} />

      {/* Win overlay */}
      {won && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="neo rounded-3xl bg-white w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-pop-in text-center">
            <h2 className="text-display text-[color:var(--ink)]">
              Level Complete!
            </h2>
            <div className="text-body-lg text-[color:var(--ink)]">
              +{displayedScore} points
            </div>
            <button
              onClick={handleNext}
              className="neo neo-press rounded-xl bg-primary text-[color:var(--primary-foreground)] py-3 px-6 text-body-lg flex items-center justify-center gap-2 w-full"
            >
              Next Level <ArrowRight className="size-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {paused && !won && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(27,28,28,0.85)" }}
        >
          <div className="neo rounded-3xl bg-white w-full max-w-sm p-8 flex flex-col gap-3 animate-pop-in">
            <h2 className="text-headline text-center text-[color:var(--ink)] mb-2">
              Paused
            </h2>
            <button
              onClick={() => setPaused(false)}
              className="neo neo-press rounded-xl bg-primary text-[color:var(--primary-foreground)] py-3 text-body-lg"
            >
              Resume
            </button>
            <button
              onClick={() => {
                handleReset();
                setPaused(false);
              }}
              className="neo neo-press rounded-xl bg-white text-[color:var(--ink)] py-3 text-body-lg"
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
