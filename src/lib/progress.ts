import { useCallback, useEffect, useState } from "react";
import { CHAPTERS, type Chapter, type ChapterId } from "./chapters";

const KEY = "daisy-zen-progress-v1";
const XP_KEY = "daisy-zen-xp-v1";
const SCROLLS_KEY = "daisy-zen-scrolls-v1";
const STATS_KEY = "daisy-zen-stats-v1";
const LAST_CHAPTER_KEY = "daisy-last-chapter";
const CURRENT_LEVEL_KEY = "current-level";
const CHAPTER_SEEN_KEY = "daisy-zen-intro-seen-v1";

const DEFAULT_LEVEL = 8;
const DEFAULT_XP = 1240;

/** Mock stats snapshot — surfaced on /stats until real analytics arrives. */
export type ZenStats = {
  currentStreakDays: number;
  longestStreakDays: number;
  flowersCollected: number;
  puzzlesSolved: number;
  playMinutes: number;
  accuracy: number; // 0..1
  favoriteChapter: ChapterId;
  weekly: number[]; // 7 entries, 0..1 intensity for Mon..Sun
};

const DEFAULT_STATS: ZenStats = {
  currentStreakDays: 5,
  longestStreakDays: 14,
  flowersCollected: 42,
  puzzlesSolved: 120,
  playMinutes: 195, // 3h 15m
  accuracy: 0.94,
  favoriteChapter: "sakura",
  weekly: [0.4, 0.7, 0.9, 0.5, 1, 0.6, 0.3],
};

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function writeNumber(key: string, n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(n));
}
function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
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

/** True if `level` is a scroll milestone (every 5th level within a chapter). */
export function scrollIdForLevel(level: number): {
  chapterId: ChapterId;
  scrollIndex: number;
} | null {
  const ch = CHAPTERS.find(
    (c) => level >= c.levelStart && level <= c.levelEnd,
  );
  if (!ch) return null;
  const offset = level - ch.levelStart; // 0..24
  if ((offset + 1) % 5 !== 0) return null;
  const scrollIndex = Math.floor((offset + 1) / 5) - 1; // 0..4
  if (scrollIndex < 0 || scrollIndex > 4) return null;
  return { chapterId: ch.id, scrollIndex };
}

/**
 * useProgress
 * -----------
 * Tracks highest-unlocked level, XP, collected scrolls, chapter intros
 * seen, and mock zen stats. All fields persist in localStorage.
 */
export function useProgress() {
  const [highestUnlocked, setHighestUnlocked] = useState<number>(DEFAULT_LEVEL);
  const [xp, setXp] = useState<number>(DEFAULT_XP);
  const [scrolls, setScrolls] = useState<Record<string, boolean>>({});
  const [seenChapters, setSeenChapters] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<ZenStats>(DEFAULT_STATS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHighestUnlocked(readNumber(KEY, DEFAULT_LEVEL));
    setXp(readNumber(XP_KEY, DEFAULT_XP));
    setScrolls(readJson<Record<string, boolean>>(SCROLLS_KEY, {}));
    setSeenChapters(readJson<Record<string, boolean>>(CHAPTER_SEEN_KEY, {}));
    setStats(readJson<ZenStats>(STATS_KEY, DEFAULT_STATS));
    setHydrated(true);
  }, []);

  const unlockLevel = useCallback((level: number) => {
    setHighestUnlocked((prev) => {
      const next = Math.max(prev, level);
      writeNumber(KEY, next);
      writeNumber(CURRENT_LEVEL_KEY, next);
      return next;
    });
  }, []);

  const addXp = useCallback((delta: number) => {
    setXp((prev) => {
      const next = Math.max(0, prev + delta);
      writeNumber(XP_KEY, next);
      return next;
    });
  }, []);

  const collectScroll = useCallback((chapterId: ChapterId, index: number) => {
    const key = `${chapterId}:${index}`;
    setScrolls((prev) => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true };
      writeJson(SCROLLS_KEY, next);
      return next;
    });
  }, []);

  const hasScroll = useCallback(
    (chapterId: ChapterId, index: number) =>
      !!scrolls[`${chapterId}:${index}`],
    [scrolls],
  );

  const markChapterSeen = useCallback((chapterId: ChapterId) => {
    setSeenChapters((prev) => {
      if (prev[chapterId]) return prev;
      const next = { ...prev, [chapterId]: true };
      writeJson(CHAPTER_SEEN_KEY, next);
      writeJson(LAST_CHAPTER_KEY, chapterId);
      return next;
    });
  }, []);

  const isChapterSeen = useCallback(
    (chapterId: ChapterId) => !!seenChapters[chapterId],
    [seenChapters],
  );

  const reset = useCallback(() => {
    writeNumber(KEY, DEFAULT_LEVEL);
    writeNumber(XP_KEY, DEFAULT_XP);
    writeJson(SCROLLS_KEY, {});
    writeJson(CHAPTER_SEEN_KEY, {});
    setHighestUnlocked(DEFAULT_LEVEL);
    setXp(DEFAULT_XP);
    setScrolls({});
    setSeenChapters({});
  }, []);

  return {
    highestUnlocked,
    xp,
    hydrated,
    scrolls,
    stats,
    unlockLevel,
    addXp,
    collectScroll,
    hasScroll,
    markChapterSeen,
    isChapterSeen,
    reset,
  };
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
