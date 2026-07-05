import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Pause, RotateCcw, ArrowRight, Lightbulb, Map, Star } from "lucide-react";
import { Daisy, type PetalAnim } from "@/components/Daisy";
import {
  DIRECTIONS,
  DIR_DEG,
  TOTAL_LEVELS,
  getPuzzle,
  type Direction,
} from "@/lib/puzzles";
import { getChapter } from "@/lib/chapters";
import { ChapterTransition } from "@/components/ChapterTransition";
import { ChapterIntro } from "@/components/ChapterIntro";
import { ZenScroll } from "@/components/ZenScroll";
import { TutorialCoach } from "@/components/TutorialCoach";
import { BottomNav } from "@/components/BottomNav";
import { haptic } from "@/lib/haptic";
import {
  useEmotionEngine,
  petalAccentFromEmotion,
} from "@/engine/useEmotionEngine";
import { useProgress, scrollIdForLevel } from "@/lib/progress";

const searchSchema = z.object({
  chapter: z
    .enum(["daisy", "lavender", "mountain", "sakura", "lotus"])
    .optional(),
  level: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: Game,
});


// Rotation step: 90° (4 cardinal directions only).
function rotateCW(dir: Direction): Direction {
  const i = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[(i + 2) % 8];
}

// Number of 90° taps needed to go from `from` to `to`.
function stepsCW(from: Direction, to: Direction): number {
  const f = DIRECTIONS.indexOf(from);
  const t = DIRECTIONS.indexOf(to);
  return Math.round((((t - f + 8) % 8) / 2));
}

const MOVE_BUDGET_MULT = 3;
const HINT_DELAY_MS = 45000;

function Game() {
  // Inbound chapter / level from the Journey Map (?chapter=forest&level=8).
  const search = Route.useSearch();
  const {
    unlockLevel,
    addXp,
    collectScroll,
    hasScroll,
    isChapterSeen,
    markChapterSeen,
  } = useProgress();

  const [level, setLevel] = useState<number>(search.level ?? 1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasAligned, setHasAligned] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const lastCanvasTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const puzzle = useMemo(() => getPuzzle(level), [level]);
  const chapter = useMemo(() => getChapter(level), [level]);

  // --- Engine: owns all per-frame motion. ---
  const { engine, snapshot } = useEmotionEngine();

  // Sync the deep-linked level if the search param changes underfoot
  // (e.g., user re-enters from the Journey Map).
  useEffect(() => {
    if (search.level && search.level !== level) setLevel(search.level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.level]);


  // Puzzle truth — direction each petal currently points.
  // Engine receives the corresponding target rotation, never the raw state.
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

  // Reset state on level change. Engine is reset and seeded with the new
  // puzzle's targets so petals don't fly across the screen.
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

    // Seed engine with the level's starting rotations (no spring fly-in).
    const targets = Array.from({ length: 8 }, (_, i) => {
      const p = puzzle.petals[i];
      const dir = p?.startDir ?? null;
      return {
        rotationDeg: dir ? DIR_DEG[dir] : 0,
        hasArrow: !!p?.hasArrow,
      };
    });
    engine.resetPetals(targets);
    engine.injectImpulse("reset");

    if (chapter.id !== lastChapterIdRef.current) {
      lastChapterIdRef.current = chapter.id;
      setTransitionChapterId(chapter.id);
      haptic.chapter();
    }
    // Apply per-chapter difficulty profile to the simulation.
    engine.setDifficulty(chapter.difficulty);
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

    // Push the new desired rotation into the engine — the spring takes it from there.
    engine.setPetalTarget(i, DIR_DEG[next], 1);
    engine.injectImpulse("tap", i);

    startHintTimer();

    if (willAlign) {
      haptic.align();
      setHasAligned(true);
      setPetalAnim(i, "aligned", 320);
      setCenterPulsing(true);
      setTimeout(() => setCenterPulsing(false), 260);
      engine.injectImpulse("align", i);
    } else if (wasAligned && !willAlign) {
      haptic.misalign();
      setPetalAnim(i, "error", 220);
      engine.injectImpulse("misalign", i);
    } else {
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
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(50);
      }
      setCenterGlow(true);
      engine.injectImpulse("win");
      engine.surgeOpenness(0.25, 900);
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
      addXp(earned);
      unlockLevel(level + 1);
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
    const targets = Array.from({ length: 8 }, (_, i) => {
      const p = puzzle.petals[i];
      const dir = p?.startDir ?? null;
      return {
        rotationDeg: dir ? DIR_DEG[dir] : 0,
        hasArrow: !!p?.hasArrow,
      };
    });
    engine.resetPetals(targets);
    engine.injectImpulse("reset");
  };

  const handleNext = () => {
    setLevel((l) => (l >= TOTAL_LEVELS ? 1 : l + 1));
  };

  const handleHint = () => {
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

  // Petal accent shifts with the emotional field (alert ↔ chapter ↔ gold).
  // Sakura chapter uses pink as its alert color instead of red.
  const livePetalBase = petalAccentFromEmotion(
    snapshot.globalEmotion.stability,
    snapshot.globalEmotion.valence,
    chapter.petalColor,
    chapter.alertColor,
  );
  const liveAltColor = chapter.petalAlt
    ? petalAccentFromEmotion(
        snapshot.globalEmotion.stability,
        snapshot.globalEmotion.valence,
        chapter.petalAlt,
        chapter.alertColor,
      )
    : undefined;
  // Build per-petal palette: alternate base / alt when chapter defines one.
  const petalPalette = liveAltColor
    ? puzzle.petals.map((_, i) => (i % 2 === 0 ? livePetalBase : liveAltColor))
    : undefined;
  const idleSpin = moves === 0 && !won;

  const ink = chapter.inkColor;
  return (
    <main
      className="chapter-bg min-h-[100dvh] w-full flex flex-col items-center px-4 py-5 pb-28 gap-6"
      style={{ backgroundColor: chapter.bgColor, color: ink }}
    >
      <header className="w-full max-w-md flex items-center justify-between gap-3">
        <button
          aria-label="Pause"
          onClick={() => setPaused(true)}
          className="neo neo-press rounded-xl bg-white p-2.5"
        >
          <Pause className="size-5" strokeWidth={2.5} style={{ color: "#1F1F1F" }} />
        </button>
        <div className="text-headline" style={{ color: ink }}>
          Level {String(level).padStart(2, "0")}
        </div>
        <Link
          to="/journey"
          aria-label="Journey Map"
          title={`Score: ${score}`}
          className="neo neo-press rounded-xl bg-white p-2.5 grid place-items-center"
        >
          <Map className="size-5" strokeWidth={2.5} style={{ color: "#1F1F1F" }} />
        </Link>
      </header>

      <div className="w-full max-w-md flex flex-col items-center gap-0.5 -mt-2">
        <span
          className="text-[12px] font-extrabold tracking-[0.22em]"
          style={{ color: ink, opacity: 0.85 }}
        >
          {chapter.bolum}
        </span>
        <span className="text-headline" style={{ color: ink }}>
          {chapter.name}
        </span>
      </div>

      <section
        className="flex-1 flex items-center justify-center w-full"
        onPointerDown={(e) => {
          // Invisible reset gesture: double-tap or long-press anywhere on
          // the flower canvas (but not the petals themselves, which stop
          // propagation via their own pointer handlers indirectly — we
          // simply skip when the win overlay is up).
          if (won || paused) return;
          const now = performance.now();
          const last = lastCanvasTapRef.current;
          lastCanvasTapRef.current = now;
          // Double-tap window: 320ms
          if (last && now - last < 320) {
            handleReset();
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
            return;
          }
          // Long-press: 600ms hold
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = setTimeout(() => {
            handleReset();
          }, 600);
          const cancel = () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
            window.removeEventListener("pointerup", cancel);
            window.removeEventListener("pointercancel", cancel);
            window.removeEventListener("pointermove", cancel);
          };
          window.addEventListener("pointerup", cancel);
          window.addEventListener("pointercancel", cancel);
          window.addEventListener("pointermove", cancel);
        }}
      >
        <Daisy
          puzzle={puzzle}
          snapshot={snapshot}
          petalAnims={petalAnims}
          onTapPetal={handleTap}
          bursting={bursting}
          centerPulsing={centerPulsing}
          centerGlow={centerGlow}
          petalColor={livePetalBase}
          petalColors={petalPalette}
          idleSpin={idleSpin}
          shape={chapter.petalShape}
        />
      </section>

      <footer className="w-full max-w-md flex flex-col gap-3">
        <div className="neo-lg rounded-2xl bg-white px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-label" style={{ color: "var(--ink)" }}>
            {chapter.name}
          </span>
          <span className="text-label" style={{ color: "var(--ink)" }}>
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
        <div className="text-label -mt-1" style={{ color: "var(--ink)", opacity: 0.7 }}>
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
          <div className="neo-lg rounded-3xl bg-white w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-pop-in text-center">
            <div className="flex items-center gap-2" aria-label="Three stars">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className="size-10"
                  fill="#FFD700"
                  stroke="#1F1F1F"
                  strokeWidth={2.5}
                  style={{ animation: `pop-in 320ms ${i * 120}ms both` }}
                />
              ))}
            </div>
            <h2 className="text-display text-[color:var(--ink)]">
              Level Complete!
            </h2>
            <div className="text-body-lg text-[color:var(--ink)]">
              +{displayedScore} XP
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

      <BottomNav />
    </main>
  );
}
