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

      {/* Level + XP progress panel */}
      <section className="w-full max-w-md mx-auto">
        <div
          className="relative rounded-2xl bg-white p-4 flex flex-col gap-3"
          style={{
            border: "3px solid #1F1F1F",
            boxShadow: "4px 4px 0px #1F1F1F",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: "#1F1F1F", opacity: 0.55 }}
              >
                Current Level
              </span>
              <span className="text-[28px] font-extrabold leading-none" style={{ color: "#1F1F1F" }}>
                {level}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: "#1F1F1F", opacity: 0.55 }}
              >
                XP
              </span>
              <span className="text-[16px] font-extrabold" style={{ color: "#1F1F1F" }}>
                {currentXp} / {xpNeeded}
              </span>
            </div>
          </div>

          <div
            className="relative h-4 w-full rounded-full overflow-hidden bg-white"
            style={{ border: "3px solid #1F1F1F" }}
          >
            <div
              className="h-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: "#1F1F1F",
                transition: "width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            />
          </div>

          {xpFloat && (
            <div
              key={xpFloat.id}
              className="pointer-events-none absolute right-4 top-2 text-[14px] font-extrabold"
              style={{
                color: "#1F1F1F",
                animation: "xp-float 1.4s ease-out forwards",
              }}
            >
              +{xpFloat.amount} XP
            </div>
          )}
        </div>
      </section>

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

      {celebrateLevel !== null && (
        <LevelUpModal
          level={celebrateLevel}
          onClose={() => setCelebrateLevel(null)}
        />
      )}

      <style>{`
        @keyframes xp-float {
          0% { opacity: 0; transform: translateY(6px); }
          15% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-24px); }
        }
        @keyframes levelup-pop {
          0% { opacity: 0; transform: scale(0.85); }
          60% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <BottomNav />
    </main>
  );
}

function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(31,31,31,0.35)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 flex flex-col items-center gap-4"
        style={{
          border: "4px solid #1F1F1F",
          boxShadow: "6px 6px 0px #1F1F1F",
          animation: "levelup-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        }}
      >
        <div
          className="rounded-2xl px-3 py-2 flex items-center gap-2"
          style={{ border: "3px solid #1F1F1F", backgroundColor: "#FFD700" }}
        >
          <Sparkles className="size-4" strokeWidth={3} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">
            Level Aligned
          </span>
        </div>
        <h2
          className="text-[28px] font-extrabold text-center leading-tight uppercase"
          style={{ color: "#1F1F1F" }}
        >
          Ascended to Level {level}
        </h2>
        <p
          className="text-[13px] text-center font-semibold"
          style={{ color: "#1F1F1F", opacity: 0.7 }}
        >
          The field is quieter now. Breathe once, then continue.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl px-5 py-3 text-[13px] font-extrabold uppercase tracking-[0.18em] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
          style={{
            backgroundColor: "#1F1F1F",
            color: "#FFFFFF",
            border: "3px solid #1F1F1F",
            boxShadow: "4px 4px 0px #1F1F1F",
          }}
        >
          Continue the Flow
        </button>
      </div>
    </div>
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
