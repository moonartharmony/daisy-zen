import { useCallback, useEffect, useState } from "react";
import { CHAPTERS, type Chapter, type ChapterId } from "./chapters";

const KEY = "daisy-zen-progress-v1";
const XP_KEY = "daisy-zen-xp-v1";
const SCROLLS_KEY = "daisy-zen-scrolls-v1";
const STATS_KEY = "daisy-zen-stats-v1";
const LAST_CHAPTER_KEY = "daisy-last-chapter";
const CURRENT_LEVEL_KEY = "current-level";
const CHAPTER_SEEN_KEY = "daisy-zen-intro-seen-v1";

const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;

/**
 * ZenStats — all fields are derived from real gameplay events.
 * Written by updateOnWin() on each level completion.
 */
export type ZenStats = {
  /** Sorted list of level numbers the player has cleared. */
  levelsCleared: number[];
  /** Accumulated play time in seconds across all wins. */
  playSeconds: number;
  /** Total petal taps across all wins. */
  totalMoves: number;
  /** Total arrows aligned across all wins (= Σ arrowedIndices.length per win). */
  totalAligned: number;
  /** XP earned per chapter id. */
  chapterXp: Partial<Record<ChapterId, number>>;
  currentStreakDays: number;
  longestStreakDays: number;
  /** ISO date "YYYY-MM-DD" of last play session. */
  lastPlayDate: string;
  /** XP earned per ISO date, kept for the 7-day activity chart. */
  dailyXp: Record<string, number>;
};

const EMPTY_STATS: ZenStats = {
  levelsCleared: [],
  playSeconds: 0,
  totalMoves: 0,
  totalAligned: 0,
  chapterXp: {},
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastPlayDate: "",
  dailyXp: {},
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
 * seen, and real gameplay stats. All fields persist in localStorage.
 */
export function useProgress() {
  const [highestUnlocked, setHighestUnlocked] = useState<number>(DEFAULT_LEVEL);
  const [xp, setXp] = useState<number>(DEFAULT_XP);
  const [scrolls, setScrolls] = useState<Record<string, boolean>>({});
  const [seenChapters, setSeenChapters] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<ZenStats>(EMPTY_STATS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHighestUnlocked(readNumber(KEY, DEFAULT_LEVEL));
    setXp(readNumber(XP_KEY, DEFAULT_XP));
    setScrolls(readJson<Record<string, boolean>>(SCROLLS_KEY, {}));
    setSeenChapters(readJson<Record<string, boolean>>(CHAPTER_SEEN_KEY, {}));
    // Migrate: if stored object has old mock shape, fall back to EMPTY_STATS.
    const stored = readJson<ZenStats>(STATS_KEY, EMPTY_STATS);
    setStats(Array.isArray(stored.levelsCleared) ? stored : EMPTY_STATS);
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

  /**
   * updateOnWin — merge one win's performance data into ZenStats.
   * Call this immediately after a level is cleared, alongside addXp/unlockLevel.
   */
  const updateOnWin = useCallback((opts: {
    level: number;
    elapsed: number;
    moves: number;
    aligned: number;
    chapterId: ChapterId;
    xpEarned: number;
  }) => {
    setStats((prev) => {
      const today = new Date().toISOString().slice(0, 10);

      const levelsCleared = prev.levelsCleared.includes(opts.level)
        ? prev.levelsCleared
        : [...prev.levelsCleared, opts.level].sort((a, b) => a - b);

      // Streak: extend if yesterday was the last play date, reset otherwise.
      let { currentStreakDays, longestStreakDays, lastPlayDate } = prev;
      if (lastPlayDate !== today) {
        const yesterday = new Date(Date.now() - 86_400_000)
          .toISOString()
          .slice(0, 10);
        currentStreakDays =
          lastPlayDate === yesterday ? currentStreakDays + 1 : 1;
        longestStreakDays = Math.max(longestStreakDays, currentStreakDays);
        lastPlayDate = today;
      }

      const dailyXp = {
        ...prev.dailyXp,
        [today]: (prev.dailyXp[today] ?? 0) + opts.xpEarned,
      };
      const chapterXp = {
        ...prev.chapterXp,
        [opts.chapterId]:
          (prev.chapterXp[opts.chapterId] ?? 0) + opts.xpEarned,
      };

      const next: ZenStats = {
        levelsCleared,
        playSeconds: prev.playSeconds + opts.elapsed,
        totalMoves: prev.totalMoves + opts.moves,
        totalAligned: prev.totalAligned + opts.aligned,
        chapterXp,
        currentStreakDays,
        longestStreakDays,
        lastPlayDate,
        dailyXp,
      };
      writeJson(STATS_KEY, next);
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
    writeJson(STATS_KEY, EMPTY_STATS);
    setHighestUnlocked(DEFAULT_LEVEL);
    setXp(DEFAULT_XP);
    setScrolls({});
    setSeenChapters({});
    setStats(EMPTY_STATS);
  }, []);

  return {
    highestUnlocked,
    xp,
    hydrated,
    scrolls,
    stats,
    unlockLevel,
    addXp,
    updateOnWin,
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
