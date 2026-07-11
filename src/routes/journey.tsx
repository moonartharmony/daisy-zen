import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Flower2, Wind, Mountain, Cherry, Waves, Star, Lock, Zap, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { CHAPTERS, type Chapter, type ChapterId } from "@/lib/chapters";
import {
  chapterProgress,
  chapterStatus,
  startingLevelForChapter,
  useProgress,
  type ChapterStatus,
} from "@/lib/progress";

const LAST_LEVEL_SEEN_KEY = "daisy-zen-level-seen-v1";
const xpNeededFor = (level: number) => level * 200;

const search = z
  .object({
    chapter: z
      .enum(["daisy", "lavender", "mountain", "sakura", "lotus"])
      .optional(),
  })
  .parse;

export const Route = createFileRoute("/journey")({
  validateSearch: (s: Record<string, unknown>) => search(s),
  head: () => ({
    meta: [
      { title: "Journey Map — Daisy Zen" },
      { name: "description", content: "Five biomes, one hundred and twenty-five levels of zen." },
      { property: "og:title", content: "Journey Map — Daisy Zen" },
      { property: "og:description", content: "Five biomes, one hundred and twenty-five levels of zen." },
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
  const { highestUnlocked, xp, hydrated } = useProgress();
  const navigate = useNavigate();

  // Derive level from highestUnlocked (each unlocked level = one ascension).
  const level = Math.max(1, highestUnlocked);
  const xpNeeded = xpNeededFor(level);
  const currentXp = xp % xpNeeded;
  const progressPct = Math.min(100, (currentXp / xpNeeded) * 100);

  // Level-up celebration: watches for level increases vs last-seen level.
  const [celebrateLevel, setCelebrateLevel] = useState<number | null>(null);
  const [xpFloat, setXpFloat] = useState<{ id: number; amount: number } | null>(null);
  const lastXpRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(LAST_LEVEL_SEEN_KEY);
    const lastSeen = raw ? parseInt(raw, 10) : level;
    if (Number.isFinite(lastSeen) && level > lastSeen) {
      setCelebrateLevel(level);
    }
    window.localStorage.setItem(LAST_LEVEL_SEEN_KEY, String(level));
  }, [hydrated, level]);

  // Floating "+XP" indicator when xp changes.
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

  const play = (id: ChapterId) => {
    const startLevel = startingLevelForChapter(id, highestUnlocked);
    navigate({ to: "/", search: { chapter: id, level: startLevel } });
  };

  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-28">
      <ScreenHeader title="Journey Map" backTo="/" />

      <section className="w-full max-w-md mx-auto flex flex-col gap-5 mt-2">
        {CHAPTERS.map((chapter, i) => {
          const status = chapterStatus(chapter, highestUnlocked);
          return (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={i + 1}
              status={status}
              progress={chapterProgress(chapter, highestUnlocked)}
              onPlay={() => play(chapter.id)}
            />
          );
        })}
      </section>

      <BottomNav />
    </main>
  );
}

function ChapterCard({
  chapter,
  index,
  status,
  progress,
  onPlay,
}: {
  chapter: Chapter;
  index: number;
  status: ChapterStatus;
  progress: number;
  onPlay: () => void;
}) {
  const Icon = ICONS[chapter.id];
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";

  // Locked cards use a chapter-themed pastel surface (sand for mountain,
  // dusty pink for sakura) so the map already hints at the biome.
  const lockedTint: Record<ChapterId, string> = {
    daisy: "#FFFFFF",
    lavender: "#EDE2F7",
    mountain: "#EFE6D2",
    sakura: "#FBD9C3",
    lotus: "#DCEFE8",
  };
  const cardBg = isActive
    ? "var(--primary)"
    : isLocked
      ? lockedTint[chapter.id]
      : "#FFFFFF";
  const inkSoft = isLocked ? "rgba(31,31,31,0.55)" : "var(--ink)";

  return (
    <article
      className="neo-lg rounded-2xl p-4 flex flex-col gap-3"
      style={{
        backgroundColor: cardBg,
        opacity: isLocked ? 0.92 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="neo-sm rounded-xl size-14 grid place-items-center shrink-0"
          style={{
            backgroundColor: isCompleted
              ? "#D8EBD2"
              : isActive
                ? "#FFFFFF"
                : "#F3ECDC",
            color: inkSoft,
          }}
        >
          <Icon className="size-7" strokeWidth={2.25} />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="text-[12px] font-bold tracking-[0.12em] uppercase"
            style={{ color: inkSoft, opacity: 0.7 }}
          >
            Bölüm {index}
          </div>
          <h2
            className="text-[26px] font-extrabold leading-tight"
            style={{ color: inkSoft }}
          >
            {chapter.name}
          </h2>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="text-[14px] font-bold" style={{ color: inkSoft }}>
            Seviye {chapter.levelStart}-{chapter.levelEnd}
          </div>
          {isActive && (
            <div
              className="h-3 w-32 rounded-full border-[3px] overflow-hidden bg-white"
              style={{ borderColor: "var(--ink)" }}
            >
              <div
                className="h-full bg-[color:var(--ink)] transition-[width] duration-500"
                style={{ width: `${Math.max(6, progress * 100)}%` }}
              />
            </div>
          )}
        </div>

        <CTAButton status={status} onClick={onPlay} />
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ChapterStatus }) {
  if (status === "completed") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <Star key={i} className="size-4" fill="#FFD700" stroke="#1F1F1F" strokeWidth={2} />
          ))}
        </div>
        <span
          className="text-[11px] font-extrabold tracking-wider"
          style={{ color: "#3E5C38" }}
        >
          TAMAMLANDI
        </span>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div
        className="neo-sm rounded-lg px-2 py-1 bg-white flex items-center gap-1"
        style={{ color: "var(--ink)" }}
      >
        <Zap className="size-3.5" strokeWidth={3} fill="currentColor" />
        <span className="text-[11px] font-extrabold tracking-wider">AKTİF</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg p-1.5" style={{ color: "rgba(31,31,31,0.55)" }}>
      <Lock className="size-5" strokeWidth={2.5} />
    </div>
  );
}

function CTAButton({
  status,
  onClick,
}: {
  status: ChapterStatus;
  onClick: () => void;
}) {
  if (status === "completed") {
    return (
      <button
        onClick={onClick}
        className="neo neo-press rounded-xl px-5 py-2.5 text-[13px] font-extrabold tracking-wider"
        style={{ backgroundColor: "var(--forest-green)", color: "#FFFFFF" }}
      >
        TEKRARLA
      </button>
    );
  }
  if (status === "active") {
    return (
      <button
        onClick={onClick}
        className="neo neo-press rounded-xl px-5 py-2.5 text-[13px] font-extrabold tracking-wider"
        style={{ backgroundColor: "var(--ink)", color: "#FFFFFF" }}
      >
        DEVAM ET
      </button>
    );
  }
  return (
    <button
      disabled
      className="rounded-xl px-5 py-2.5 text-[13px] font-extrabold tracking-wider border-[3px] cursor-not-allowed"
      style={{
        backgroundColor: "transparent",
        color: "rgba(31,31,31,0.45)",
        borderColor: "rgba(31,31,31,0.35)",
      }}
    >
      KİLİTLİ
    </button>
  );
}
