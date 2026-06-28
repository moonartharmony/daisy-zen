import { useEffect, useState } from "react";
import { CHAPTERS, type Chapter, type ChapterId } from "./chapters";

const KEY = "daisy-zen-progress-v1";
// Default seeded so the demo Journey Map matches the reference layout:
// Garden completed, Forest active around level 8.
const DEFAULT_LEVEL = 8;

function read(): number {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LEVEL;
}

function write(level: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, String(level));
}

export type ChapterStatus = "completed" | "active" | "locked";

export function chapterStatus(
  chapter: Chapter,
  highestUnlocked: number,
): ChapterStatus {
  if (highestUnlocked > chapter.levelEnd) return "completed";
  if (highestUnlocked >= chapter.levelStart) return "active";
  return "locked";
}

export function chapterProgress(chapter: Chapter, highestUnlocked: number) {
  const span = chapter.levelEnd - chapter.levelStart + 1;
  const done = Math.max(0, Math.min(span, highestUnlocked - chapter.levelStart));
  return done / span;
}

/**
 * useProgress
 * -----------
 * Tracks the user's furthest-unlocked level in localStorage.
 * Hydration-safe: starts at the default and re-reads on mount so SSR
 * markup stays stable.
 */
export function useProgress() {
  const [highestUnlocked, setHighestUnlocked] = useState<number>(DEFAULT_LEVEL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHighestUnlocked(read());
    setHydrated(true);
  }, []);

  const unlockLevel = (level: number) => {
    setHighestUnlocked((prev) => {
      const next = Math.max(prev, level);
      write(next);
      return next;
    });
  };

  const reset = () => {
    write(DEFAULT_LEVEL);
    setHighestUnlocked(DEFAULT_LEVEL);
  };

  return { highestUnlocked, hydrated, unlockLevel, reset };
}

export function startingLevelForChapter(id: ChapterId, highestUnlocked: number) {
  const chapter = CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
  // If user is mid-chapter, drop them where they left off; else first level.
  if (
    highestUnlocked >= chapter.levelStart &&
    highestUnlocked <= chapter.levelEnd
  ) {
    return highestUnlocked;
  }
  return chapter.levelStart;
}
