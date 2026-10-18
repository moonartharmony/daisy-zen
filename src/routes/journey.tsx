import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { Flower2, Wind, Mountain, Cherry, Waves, Lock, Check, Play, Sparkles, ScrollText, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { CHAPTERS, type Chapter, type ChapterId } from "@/lib/chapters";
import {
  chapterStatus,
  startingLevelForChapter,
  useProgress,
  type ChapterStatus,
} from "@/lib/progress";

const LAST_LEVEL_SEEN_KEY = "daisy-zen-level-seen-v1";
const xpNeededFor = (level: number) => level * 200;

const searchSchema = z.object({
  chapter: z.enum(["daisy", "lavender", "mountain", "sakura", "lotus"]).optional(),
});

export const Route = createFileRoute("/journey")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Journey Map — Daisy Zen" },
      { name: "description", content: "Five biomes, one hundred and twenty-five levels of zen." },
      { property: "og:title", content: "Journey Map — Daisy Zen" },
      { property: "og:description", content: "Five biomes, one hundred and twenty-five levels of zen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyMap,
});

const ICONS: Record<ChapterId, typeof Flower2> = {
  daisy: Flower2,
  lavender: Wind,
  mountain: Mountain,
  sakura: Cherry,
  lotus: Waves,
};

function JourneyMap() {
  const { highestUnlocked, xp, scrolls, hydrated } = useProgress();
  const navigate = useNavigate();

  const level = Math.max(1, highestUnlocked);
  const xpNeeded = xpNeededFor(level);
  const currentXp = xp % xpNeeded;
  const progressPct = Math.min(100, (currentXp / xpNeeded) * 100);
  const scrollCount = Object.values(scrolls).filter(Boolean).length;

  const activeChapter =
    CHAPTERS.find((c) => chapterStatus(c, highestUnlocked) === "active") ?? CHAPTERS[CHAPTERS.length - 1];

  const [celebrateLevel, setCelebrateLevel] = useState<number | null>(null);
  const [xpFloat, setXpFloat] = useState<{ id: number; amount: number } | null>(null);
  const lastXpRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const raw = window.localStorage.getItem(LAST_LEVEL_SEEN_KEY);
    const lastSeen = raw ? parseInt(raw, 10) : level;
    if (Number.isFinite(lastSeen) && level > lastSeen) setCelebrateLevel(level);
    window.localStorage.setItem(LAST_LEVEL_SEEN_KEY, String(level));
  }, [hydrated, level]);

  useEffect(() => {
    if (!hydrated) return;
    if (lastXpRef.current === null) {
      lastXpRef.current = xp;
      return;
    }
    const delta = xp - lastXpRef.current;
    lastXpRef.current = xp;
    if (delta > 0) {
      const id = Date.now();
      setXpFloat({ id, amount: delta });
      const t = setTimeout(() => setXpFloat((f) => (f?.id === id ? null : f)), 1400);
      return () => clearTimeout(t);
    }
  }, [xp, hydrated]);

  const play = (id: ChapterId, lvl?: number) => {
    const startLevel = lvl ?? startingLevelForChapter(id, highestUnlocked);
    navigate({ to: "/", search: { chapter: id, level: startLevel } });
  };

  const ctaLevel = startingLevelForChapter(activeChapter.id, highestUnlocked);
  const isFresh = highestUnlocked <= 1;

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-background flex flex-col gap-5 px-4 pt-4 pb-64">
      <ScreenHeader title="Journey Map" backTo="/" />

      {/* Top stats bar */}
      <section className="w-full max-w-md mx-auto flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <StatBadge icon={<Zap className="size-4" strokeWidth={3} />} label="Level" value={String(level)} />
          <StatBadge icon={<Sparkles className="size-4" strokeWidth={3} />} label="XP" value={String(xp)} />
          <StatBadge icon={<ScrollText className="size-4" strokeWidth={3} />} label="Scrolls" value={String(scrollCount)} />
        </div>
        <div className="relative rounded-2xl bg-card p-3 neo-control">
          <div className="flex items-center justify-between text-xs font-black tracking-tight text-ink">
            <span>NEXT LEVEL</span>
            <span>
              {currentXp} / {xpNeeded} XP
            </span>
          </div>
          <div className="mt-2 h-3 w-full rounded-full overflow-hidden bg-card border-2 border-ink">
            <div
              className="h-full bg-ink transition-[width] duration-[400ms]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {xpFloat && (
            <div
              key={xpFloat.id}
              className="pointer-events-none absolute right-3 -top-3 text-sm font-black text-ink"
              style={{ animation: "xp-float 1.4s ease-out forwards" }}
            >
              +{xpFloat.amount} XP
            </div>
          )}
        </div>
      </section>

      <section className="w-full max-w-md mx-auto flex flex-col gap-5">
        {CHAPTERS.map((chapter, i) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={i + 1}
            status={chapterStatus(chapter, highestUnlocked)}
            highestUnlocked={highestUnlocked}
            onPlay={(lvl) => play(chapter.id, lvl)}
          />
        ))}
      </section>

      {/* Fixed bottom primary CTA */}
      <div className="fixed bottom-[8.5rem] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md pointer-events-auto">
        <div className="bg-card rounded-2xl p-4 flex items-center justify-between gap-3 border-[3px] border-ink shadow-[var(--shadow-neo-lg)]">
          <div className="min-w-0">
            <div className="text-[11px] font-black tracking-tight text-ink/60 uppercase truncate">
              {activeChapter.name}
            </div>
            <div className="text-lg font-black tracking-tight text-ink">Level {ctaLevel}</div>
          </div>
          <Button variant="neoPrimary" size="touch" className="rounded-xl px-5 font-black uppercase tracking-tight" onClick={() => play(activeChapter.id, ctaLevel)}>
            <Play className="size-4" fill="currentColor" />
            {isFresh ? "Start" : "Continue"}
          </Button>
        </div>
      </div>

      {celebrateLevel !== null && (
        <LevelUpModal level={celebrateLevel} onClose={() => setCelebrateLevel(null)} />
      )}

      <style>{`
        @keyframes xp-float {
          0% { opacity: 0; transform: translateY(6px); }
          15% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-24px); }
        }
      `}</style>

      <BottomNav />
    </main>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border-2 border-ink shadow-[2px_2px_0_var(--ink)] px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-ink">
      {icon}
      <span className="text-[11px] font-black tracking-tight uppercase opacity-60">{label}</span>
      <span className="text-sm font-black tracking-tight">{value}</span>
    </div>
  );
}

/** Up to 5 level nodes around the player's position within a chapter. */
function nodeWindow(chapter: Chapter, highestUnlocked: number, status: ChapterStatus): number[] {
  const start =
    status === "active"
      ? Math.min(Math.max(chapter.levelStart, highestUnlocked - 2), chapter.levelEnd - 4)
      : status === "completed"
        ? chapter.levelEnd - 4
        : chapter.levelStart;
  return Array.from({ length: 5 }, (_, k) => start + k);
}

function LevelNode({
  level,
  state,
  accent,
  onClick,
}: {
  level: number;
  state: "done" | "active" | "locked";
  accent: string;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  if (state === "active") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={`Play level ${level}`}
        title={`Level ${level}`}
        animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="size-12 shrink-0 rounded-full bg-primary text-ink border-[3px] border-ink shadow-[4px_4px_0_var(--ink)] grid place-items-center"
      >
        <Play className="size-5" fill="currentColor" strokeWidth={2.5} />
      </motion.button>
    );
  }
  if (state === "done") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Replay level ${level}`}
        title={`Level ${level}`}
        className="size-11 shrink-0 rounded-full border-2 border-ink shadow-[2px_2px_0_var(--ink)] grid place-items-center text-card active:translate-y-[2px] active:shadow-none transition-transform"
        style={{ backgroundColor: accent }}
      >
        <Check className="size-5 drop-shadow-[0_1px_0_var(--ink)]" strokeWidth={4} />
      </button>
    );
  }
  return (
    <div
      aria-label={`Level ${level} locked`}
      title={`Level ${level}`}
      className="size-11 shrink-0 rounded-full border-2 border-ink/40 bg-muted grid place-items-center text-ink/50"
    >
      <Lock className="size-4" strokeWidth={2.5} />
    </div>
  );
}

function ChapterCard({
  chapter,
  index,
  status,
  highestUnlocked,
  onPlay,
}: {
  chapter: Chapter;
  index: number;
  status: ChapterStatus;
  highestUnlocked: number;
  onPlay: (level?: number) => void;
}) {
  const Icon = ICONS[chapter.id];
  const isLocked = status === "locked";
  const span = chapter.levelEnd - chapter.levelStart + 1;
  const cleared = Math.max(0, Math.min(span, highestUnlocked - chapter.levelStart));
  const nodes = nodeWindow(chapter, highestUnlocked, status);
  // Locked-chapter progress: levels completed toward this chapter's first level.
  const toUnlock = Math.min(highestUnlocked, chapter.levelStart);

  return (
    <article
      className={`rounded-2xl bg-card p-4 flex flex-col gap-4 border-[3px] border-ink shadow-[var(--shadow-neo)] ${isLocked ? "grayscale opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="rounded-xl size-12 grid place-items-center shrink-0 border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
          style={{ backgroundColor: isLocked ? undefined : chapter.bgColor }}
        >
          <Icon className="size-6 text-ink" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black tracking-tight uppercase text-ink/60">
            Chapter {index} · Levels {chapter.levelStart}–{chapter.levelEnd}
          </div>
          <h2 className="text-xl font-black tracking-tight leading-tight text-ink">{chapter.name}</h2>
        </div>
        <span className="shrink-0 rounded-lg border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-ink bg-card">
          {status === "completed" ? "Completed" : status === "active" ? "Active" : "Locked"}
        </span>
      </div>

      {/* Level path */}
      <div className="relative flex items-center justify-between px-1">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-ink/40" aria-hidden />
        {nodes.map((lvl) => {
          const state: "done" | "active" | "locked" =
            lvl < highestUnlocked ? "done" : lvl === highestUnlocked ? "active" : "locked";
          return (
            <div key={lvl} className="relative flex flex-col items-center gap-1">
              <LevelNode
                level={lvl}
                state={isLocked ? "locked" : state}
                accent={chapter.accentColor}
                onClick={state === "locked" ? undefined : () => onPlay(lvl)}
              />
              <span className="text-[10px] font-black text-ink/70">{lvl}</span>
            </div>
          );
        })}
      </div>

      {isLocked ? (
        <ProgressRow
          label={`Unlocks at level ${chapter.levelStart}`}
          value={`${toUnlock} / ${chapter.levelStart}`}
          pct={(toUnlock / chapter.levelStart) * 100}
        />
      ) : (
        <ProgressRow label="Levels cleared" value={`${cleared} / ${span}`} pct={(cleared / span) * 100} />
      )}
    </article>
  );
}

function ProgressRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px] font-black tracking-tight text-ink">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 w-full rounded-full border-2 border-ink bg-card overflow-hidden">
        <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-ink/35"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-card p-6 flex flex-col items-center gap-4 border-4 border-ink shadow-[var(--shadow-neo-lg)] animate-pop-in"
      >
        <div className="rounded-2xl px-3 py-2 flex items-center gap-2 border-[3px] border-ink bg-primary text-ink">
          <Sparkles className="size-4" strokeWidth={3} />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Level Aligned</span>
        </div>
        <h2 className="text-[28px] font-black text-center leading-tight uppercase text-ink">
          Ascended to Level {level}
        </h2>
        <p className="text-[13px] text-center font-semibold text-ink/70">
          The field is quieter now. Breathe once, then continue.
        </p>
        <Button variant="neo" size="touch" onClick={onClose} className="w-full bg-ink text-card rounded-xl font-black uppercase tracking-[0.18em] hover:bg-ink/90">
          Continue the Flow
        </Button>
      </div>
    </div>
  );
}
