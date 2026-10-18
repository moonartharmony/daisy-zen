import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Pause, RotateCcw, ArrowRight, Lightbulb, Map, Star, ScrollText, Sparkles } from "lucide-react";
import { Daisy, type PetalAnim } from "@/components/Daisy";
import { Button } from "@/components/ui/button";
import { CompletionRewards } from "@/components/CompletionRewards";
import {
  DIRECTIONS,
  DIR_DEG,
  getPuzzle,
  type Direction,
} from "@/lib/puzzles";
import { getChapter, TOTAL_LEVELS } from "@/lib/chapters";
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
import { updateOnWin } from "@/lib/gameState";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OverlayCard } from "@/components/OverlayPresentation";

const searchSchema = z.object({
  chapter: z
    .enum(["daisy", "lavender", "mountain", "sakura", "lotus"])
    .optional(),
  level: z.coerce.number().int().positive().optional(),
});

const OG_IMAGE = "https://daisy-zen.lovable.app/og-image.png";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Daisy Zen — Minimalist Spatial Puzzle Game" },
      {
        name: "description",
        content:
          "A minimalist, neo-brutalist puzzle game focusing on spatial intelligence and orientation.",
      },
      { property: "og:title", content: "Daisy Zen — Minimalist Spatial Puzzle Game" },
      {
        property: "og:description",
        content:
          "A minimalist, neo-brutalist puzzle game focusing on spatial intelligence and orientation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://daisy-zen.lovable.app/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Daisy Zen — Minimalist Spatial Puzzle Game" },
      {
        name: "twitter:description",
        content:
          "A minimalist, neo-brutalist puzzle game focusing on spatial intelligence and orientation.",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://daisy-zen.lovable.app/" }],
  }),
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
  const navigate = Route.useNavigate();
  const {
    xp,
    scrolls,
    unlockLevel,
    addXp,
    collectScroll,
    hasScroll,
    isChapterSeen,
    markChapterSeen,
    hydrated,
  } = useProgress();

  const [level, setLevel] = useState<number>(search.level ?? 1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasAligned, setHasAligned] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [completionVisible, setCompletionVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  const startedAtRef = useRef<number>(Date.now());
  const lastCanvasTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowerRef = useRef<HTMLDivElement>(null);
  const xpRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);

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

  // Chapter intro (poetic vignette) — shown once per biome.
  const [introChapterId, setIntroChapterId] = useState<string | null>(null);
  // Scroll modal — populated on win when level % 5 === 0 within a chapter.
  const [pendingScroll, setPendingScroll] = useState<{
    chapterId: string;
    index: number;
  } | null>(null);

  // Hint state — button stays unrendered until the timer elapses.
  const [hintReady, setHintReady] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHintTimer = () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintReady(false);
    hintTimerRef.current = setTimeout(() => setHintReady(true), HINT_DELAY_MS);
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

  // The vignette is a once-per-biome moment, so it is decided only after
  // stored progress has been read back — otherwise a biome you already
  // entered would introduce itself again on every page load.
  useEffect(() => {
    if (!hydrated) return;
    if (!isChapterSeen(chapter.id)) setIntroChapterId(chapter.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, chapter.id]);


  const arrowedIndices = puzzle.petals
    .map((p, i) => (p.hasArrow ? i : -1))
    .filter((i) => i >= 0);

  const matchedCount = arrowedIndices.filter(
    (i) => petalDirs[i] === puzzle.centerDir,
  ).length;

  const moveBudget = arrowedIndices.length * MOVE_BUDGET_MULT;
  const remaining = Math.max(0, moveBudget - moves);
  const minimumMoves = arrowedIndices.reduce((sum, i) => {
    const start = puzzle.petals[i]?.startDir;
    return sum + (start ? stepsCW(start, puzzle.centerDir) : 0);
  }, 0);

  // Only presentation waits for the flying reward; progress is awarded as before.
  useEffect(() => {
    setCompletionVisible(false);
    if (!won) return;
    const timer = setTimeout(() => setCompletionVisible(true), reducedMotion ? 0 : 600);
    return () => clearTimeout(timer);
  }, [won, reducedMotion]);

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
      setPetalAnim(i, "aligned", 420);
      engine.injectImpulse("align", i);
    } else if (wasAligned && !willAlign) {
      haptic.misalign();
      setPetalAnim(i, "error", 200);
      engine.injectImpulse("misalign", i);
    } else {
      haptic.tap();
      setPetalAnim(i, "pressed", 120);
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
      setEarnedXp(earned);
      setWon(true);
      haptic.win();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(50);
      }
      engine.injectImpulse("win");
      engine.surgeOpenness(0.15, 700);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setHintReady(false);
      // Merge win into centralized game state (streak, playtime, xp, scrolls).
      updateOnWin({
        level,
        earnedXp: earned,
        elapsedSeconds: elapsed,
      });
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
      // Scroll milestone — every 5th level within a chapter grants a scroll.
      const milestone = scrollIdForLevel(level);
      if (milestone && !hasScroll(milestone.chapterId, milestone.scrollIndex)) {
        setTimeout(() => {
          collectScroll(milestone.chapterId, milestone.scrollIndex);
          setPendingScroll({
            chapterId: milestone.chapterId,
            index: milestone.scrollIndex,
          });
        }, 900);
      }
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
    const nextLevel = level >= TOTAL_LEVELS ? level : level + 1;
    const nextChapter = getChapter(nextLevel);
    setLevel(nextLevel);
    unlockLevel(nextLevel);
    // Keep the URL in sync with the new level & biome so a refresh (or
    // deep-link share) lands on the correct chapter, not back on Ch. 1.
    navigate({
      to: "/",
      search: { chapter: nextChapter.id, level: nextLevel },
      replace: true,
    });
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
    setHintReady(false);
  };

  const totalArrowed = arrowedIndices.length;

  // Strict white-only interaction rule: petals & arrows are always pure white.
  // Contrast comes solely from the heavy black stroke against the chapter bg.
  const livePetalBase = "var(--petal)";
  const petalPalette: string[] | undefined = undefined;

  const idleSpin = false;

  const ink = "var(--biome-ink)";
  const theme = { accent: "var(--biome-accent)", onAccent: "var(--biome-on-accent)", progress: "var(--biome-progress)" };
  return (
    <main
      data-biome={chapter.id}
      className="game-theme chapter-bg bg-biome text-biome-ink min-h-[100dvh] w-full flex flex-col items-center px-4 pt-4 pb-28 gap-6"
    >
      <header
        className="w-full max-w-md flex items-center justify-between gap-3"
        style={{ background: "transparent", borderBottom: "none" }}
      >
        <Button variant="neo" size="touch"
          aria-label="Pause"
          onClick={() => setPaused(true)}
          className="rounded-xl"
        >
          <Pause className="size-5" strokeWidth={2.5} />
        </Button>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-black text-ink" aria-label="Game statistics">
          <span className="stat-badge rounded-lg bg-card px-2.5 py-2">LEVEL {String(level).padStart(2, "0")}</span>
          <span ref={xpRef} aria-label={`${xp} XP`} className="stat-badge rounded-lg bg-card px-2.5 py-2 flex items-center gap-1"><Sparkles className="size-3.5" />{xp} XP</span>
          <span ref={scrollRef} aria-label={`${Object.values(scrolls).filter(Boolean).length} Zen Scrolls`} title="Zen Scrolls" className="stat-badge rounded-lg bg-card px-2.5 py-2 flex items-center gap-1"><ScrollText className="size-3.5" />{Object.values(scrolls).filter(Boolean).length}</span>
        </div>
        <Button asChild variant="neo" size="touch" className="rounded-xl"><Link
          to="/journey"
          aria-label="Journey Map"
          title={`Score: ${score}`}
        >
          <Map className="size-5" strokeWidth={2.5} />
        </Link></Button>
      </header>

      <div className="w-full max-w-md flex flex-col items-center gap-0.5 -mt-2">
        <span
          className="text-[12px] font-extrabold"
          style={{ color: ink, opacity: 0.85 }}
        >
          {chapter.bolum}
        </span>
        <span className="rounded-full bg-card/60 border-2 border-ink px-4 py-1.5 text-base font-black uppercase text-ink text-center">
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
        <div ref={flowerRef}><Daisy
          puzzle={puzzle}
          snapshot={snapshot}
          petalAnims={petalAnims}
          alignedPetals={petalDirs.map((dir) => dir === puzzle.centerDir)}
          completed={won}
          onTapPetal={handleTap}
          bursting={bursting}
          centerPulsing={centerPulsing}
          centerGlow={centerGlow}
          petalColor={livePetalBase}
          petalColors={petalPalette}
          idleSpin={idleSpin}
          shape={chapter.petalShape}
          centerColor={theme.accent}
          centerArrowColor={theme.onAccent}
        /></div>
      </section>

      <footer className="w-full max-w-md flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label" style={{ color: "var(--ink)" }}>
            {chapter.name}
          </span>
          <span className="text-label" style={{ color: "var(--ink)" }}>
            {matchedCount}/{totalArrowed}
          </span>
        </div>

        <div className="neo-sm rounded-lg bg-card h-5 overflow-hidden p-0.5">
          <div
            className="bg-biome-progress h-full transition-[width] duration-300 ease-out"
            style={{
              width: totalArrowed
                ? `${(matchedCount / totalArrowed) * 100}%`
                : "0%",
            }}
          />
        </div>
        <div className="text-label -mt-1" style={{ color: "var(--ink)", opacity: 0.7 }}>
          Moves: {moves}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="neo" size="touch"
            onClick={handleReset}
            className="rounded-xl py-3 text-body-lg flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="size-5" strokeWidth={2.5} />
            Reset
          </Button>
          {hintReady && !won && (
            <Button variant="neo" size="touch"
              onClick={handleHint}
              className="rounded-xl py-3 px-4 text-body-lg animate-pop-in"
            >
              <Lightbulb className="size-5" strokeWidth={2.5} />
              Hint
            </Button>
          )}
        </div>
      </footer>

      {/* Chapter transition */}
      <AnimatePresence>
      {transitionChapterId && (
        <ChapterTransition
          key={transitionChapterId}
          chapter={chapter}
          onDone={() => setTransitionChapterId(null)}
        />
      )}
      </AnimatePresence>

      {/* Poetic chapter vignette — shown once per biome */}
      <AnimatePresence>
      {introChapterId === chapter.id && (
        <ChapterIntro
          key={chapter.id}
          chapter={chapter}
          onEnter={() => {
            markChapterSeen(chapter.id);
            setIntroChapterId(null);
          }}
        />
      )}
      </AnimatePresence>

      {/* Zen scroll collectible modal */}
      {pendingScroll && (
        <ZenScroll
          chapter={chapter}
          scrollIndex={pendingScroll.index}
          onClose={() => setPendingScroll(null)}
        />
      )}

      {/* First-time interaction guide (L1–L2) */}
      <TutorialCoach level={level} hasTapped={moves > 0} hasAligned={hasAligned} />

      {/* Win overlay */}
      {won && (
        <CompletionRewards earnedXp={earnedXp} originRef={flowerRef} xpRef={xpRef} scrollRef={scrollRef} hasScrollReward={Boolean(scrollIdForLevel(level))} />
      )}
      <AnimatePresence>
      {won && completionVisible && (
        <motion.div key="completion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="overlay-backdrop fixed inset-0 z-[90] pointer-events-auto flex items-center justify-center overflow-y-auto px-4 py-6"
        >
          <OverlayCard role="dialog" aria-modal="true" aria-labelledby="completion-title" className="completion-card rounded-2xl bg-card text-card-foreground w-full max-w-sm p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
            <div className="stat-badge rounded-full bg-biome-accent text-ink px-4 py-2 flex items-center gap-2" aria-label="Three stars">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className="size-7 fill-biome-accent text-ink"
                  strokeWidth={2.5}
                />
              ))}
            </div>
            <h2 id="completion-title" className="text-2xl sm:text-3xl font-black uppercase text-ink leading-tight">
              Level Complete!
            </h2>
            <div className="grid grid-cols-3 gap-2 w-full text-ink">
              <div className="stat-badge rounded-lg bg-card px-1 py-2 flex flex-col gap-1"><span className="text-[10px] font-bold">MOVES</span><span className="text-sm font-black">{moves} / {moveBudget}</span></div>
              <div className="stat-badge rounded-lg bg-butter px-1 py-2 flex flex-col gap-1"><span className="text-[10px] font-bold">ACCURACY</span><span className="text-[11px] font-black">{moves === minimumMoves ? "PERFECT" : moves <= moveBudget ? "EFFICIENT" : "COMPLETED"}</span></div>
              <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} className="stat-badge rounded-lg bg-primary px-1 py-2 flex flex-col gap-1"><span className="text-[10px] font-bold">REWARD</span><span className="text-sm font-black">+{displayedScore} XP</span></motion.div>
            </div>
            <Button variant="neoPrimary" size="touch"
              onClick={handleNext}
              className="rounded-xl py-3 px-4 text-base font-black whitespace-normal w-full"
            >
              {level === chapter.levelEnd && level < TOTAL_LEVELS ? "Enter Next Biome" : "Next Level"} <ArrowRight className="size-5" strokeWidth={2.5} />
            </Button>
          </OverlayCard>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Pause overlay */}
      {paused && !won && (
        <div
          className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center px-6"
        >
          <OverlayCard role="dialog" aria-modal="true" aria-label="Paused" className="completion-card rounded-3xl bg-card w-full max-w-sm p-8 flex flex-col gap-3">
            <h2 className="text-headline text-center text-ink mb-2">
              Paused
            </h2>
            <Button variant="neoPrimary" size="touch"
              onClick={() => setPaused(false)}
              className="rounded-xl py-3 text-body-lg"
            >
              Resume
            </Button>
            <Button variant="neo" size="touch"
              onClick={() => {
                handleReset();
                setPaused(false);
              }}
              className="rounded-xl py-3 text-body-lg"
            >
              Restart
            </Button>
          </OverlayCard>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
