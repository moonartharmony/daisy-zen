import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, RotateCcw, ArrowRight } from "lucide-react";
import { Daisy } from "@/components/Daisy";
import {
  DIRECTIONS,
  TOTAL_LEVELS,
  getPuzzle,
  type Direction,
} from "@/lib/puzzles";

export const Route = createFileRoute("/")({
  component: Game,
});

function rotateCW(dir: Direction): Direction {
  const i = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[(i + 1) % 8];
}

const MOVE_BUDGET_MULT = 3; // budget = arrowed petals * 3

function Game() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [moves, setMoves] = useState(0);
  const [displayedScore, setDisplayedScore] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  const puzzle = useMemo(() => getPuzzle(level), [level]);

  const [petalDirs, setPetalDirs] = useState<(Direction | null)[]>(
    () => puzzle.petals.map((p) => p.startDir),
  );

  // Reset state on level change
  useEffect(() => {
    setPetalDirs(puzzle.petals.map((p) => p.startDir));
    setMoves(0);
    setWon(false);
    setBursting(false);
    startedAtRef.current = Date.now();
  }, [puzzle]);

  const arrowedIndices = puzzle.petals
    .map((p, i) => (p.hasArrow ? i : -1))
    .filter((i) => i >= 0);

  const matchedCount = arrowedIndices.filter(
    (i) => petalDirs[i] === puzzle.centerDir,
  ).length;

  const moveBudget = arrowedIndices.length * MOVE_BUDGET_MULT;
  const remaining = Math.max(0, moveBudget - moves);

  const handleTap = (i: number) => {
    if (won || paused) return;
    setPetalDirs((prev) => {
      const next = [...prev];
      const cur = next[i];
      if (!cur) return prev;
      next[i] = rotateCW(cur);
      return next;
    });
    setMoves((m) => m + 1);
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
      // Burst petals after a short delay
      setTimeout(() => setBursting(true), 200);
      // Animate score count up
      const target = earned;
      setDisplayedScore(0);
      const startTs = performance.now();
      const dur = 700;
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTs) / dur);
        setDisplayedScore(Math.round(target * t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setScore((s) => s + earned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petalDirs]);

  const handleReset = () => {
    setPetalDirs(puzzle.petals.map((p) => p.startDir));
    setMoves(0);
    startedAtRef.current = Date.now();
  };

  const handleNext = () => {
    setLevel((l) => (l >= TOTAL_LEVELS ? 1 : l + 1));
  };

  const totalArrowed = arrowedIndices.length;

  return (
    <main className="min-h-[100dvh] w-full flex flex-col items-center px-4 py-5 gap-6">
      {/* Header */}
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

      {/* Daisy */}
      <section className="flex-1 flex items-center justify-center w-full">
        <Daisy
          puzzle={puzzle}
          petalDirs={petalDirs}
          onTapPetal={handleTap}
          bursting={bursting}
        />
      </section>

      {/* Footer */}
      <footer className="w-full max-w-md flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-label text-[color:var(--ink)]">Progress</span>
          <span className="text-label text-[color:var(--ink)] ml-auto">
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
        <div className="text-label text-[color:var(--ink)] -mt-1">
          Moves {moves} · Budget {moveBudget}
        </div>
        <button
          onClick={handleReset}
          className="neo neo-press rounded-xl bg-primary text-[color:var(--primary-foreground)] py-3 text-body-lg flex items-center justify-center gap-2"
        >
          <RotateCcw className="size-5" strokeWidth={2.5} />
          Reset
        </button>
      </footer>

      {/* Win overlay */}
      {won && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6"
             style={{ backgroundColor: "rgba(178,172,136,0.92)" }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
             style={{ backgroundColor: "rgba(27,28,28,0.85)" }}>
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
