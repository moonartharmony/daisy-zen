import { useEffect, useState } from "react";
import { CHAPTERS, type Chapter, type ChapterId } from "./chapters";

const KEY = "daisy-zen-progress-v1";
const XP_KEY = "daisy-zen-xp-v1";
const DEFAULT_LEVEL = 8;
const DEFAULT_XP = 1240;

function readLevel(): number {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LEVEL;
}
function writeLevel(level: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, String(level));
}
function readXp(): number {
  if (typeof window === "undefined") return DEFAULT_XP;
  const raw = window.localStorage.getItem(XP_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_XP;
}
function writeXp(xp: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(XP_KEY, String(xp));
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
 * Tracks highest-unlocked level + accumulated XP in localStorage.
 */
export function useProgress() {
  const [highestUnlocked, setHighestUnlocked] = useState<number>(DEFAULT_LEVEL);
  const [xp, setXp] = useState<number>(DEFAULT_XP);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHighestUnlocked(readLevel());
    setXp(readXp());
    setHydrated(true);
  }, []);

  const unlockLevel = (level: number) => {
    setHighestUnlocked((prev) => {
      const next = Math.max(prev, level);
      writeLevel(next);
      return next;
    });
  };

  const addXp = (delta: number) => {
    setXp((prev) => {
      const next = Math.max(0, prev + delta);
      writeXp(next);
      return next;
    });
  };

  const reset = () => {
    writeLevel(DEFAULT_LEVEL);
    writeXp(DEFAULT_XP);
    setHighestUnlocked(DEFAULT_LEVEL);
    setXp(DEFAULT_XP);
  };

  return { highestUnlocked, xp, hydrated, unlockLevel, addXp, reset };
}

export function startingLevelForChapter(id: ChapterId, highestUnlocked: number) {
  const chapter = CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
  if (
    highestUnlocked >= chapter.levelStart &&
    highestUnlocked <= chapter.levelEnd
  ) {
    return highestUnlocked;
  }
  return chapter.levelStart;
}
