import { useCallback, useEffect, useState } from "react";
import { CHAPTERS, getChapter, type ChapterId } from "./chapters";

const KEY = "daisy-v1-state";

export type GameState = {
  levelsCleared: number[];
  chapterMinutes: Record<ChapterId, number>;
  chapterCompletions: Record<ChapterId, number>;
  chapterXp: Record<ChapterId, number>;
  totalXp: number;
  totalPlaySeconds: number;
  streakDays: number;
  longestStreak: number;
  lastPlayISO: string | null;
  scrolls: Record<string, boolean>;
};

const emptyPerChapter = <T,>(v: T): Record<ChapterId, T> =>
  CHAPTERS.reduce(
    (acc, c) => {
      acc[c.id] = v;
      return acc;
    },
    {} as Record<ChapterId, T>,
  );

export const DEFAULT_STATE: GameState = {
  levelsCleared: [],
  chapterMinutes: emptyPerChapter(0),
  chapterCompletions: emptyPerChapter(0),
  chapterXp: emptyPerChapter(0),
  totalXp: 0,
  totalPlaySeconds: 0,
  streakDays: 0,
  longestStreak: 0,
  lastPlayISO: null,
  scrolls: {},
};

export function loadState(): GameState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      chapterMinutes: { ...DEFAULT_STATE.chapterMinutes, ...(parsed.chapterMinutes ?? {}) },
      chapterCompletions: { ...DEFAULT_STATE.chapterCompletions, ...(parsed.chapterCompletions ?? {}) },
      chapterXp: { ...DEFAULT_STATE.chapterXp, ...(parsed.chapterXp ?? {}) },
      scrolls: { ...(parsed.scrolls ?? {}) },
      levelsCleared: Array.isArray(parsed.levelsCleared) ? parsed.levelsCleared : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(next: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

function scrollMilestoneFor(level: number): { chapterId: ChapterId; index: number } | null {
  const ch = getChapter(level);
  const offset = level - ch.levelStart;
  if ((offset + 1) % 5 !== 0) return null;
  const index = Math.floor((offset + 1) / 5) - 1;
  if (index < 0 || index > 4) return null;
  return { chapterId: ch.id, index };
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  const utcA = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utcB = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export type WinPayload = {
  level: number;
  earnedXp: number;
  elapsedSeconds: number;
};

/** Merge a completed-level result into GameState. Idempotent for the same level. */
export function updateOnWin(payload: WinPayload): GameState {
  const prev = loadState();
  const { level, earnedXp, elapsedSeconds } = payload;
  const chapter = getChapter(level);
  const now = new Date().toISOString();

  const levelsCleared = prev.levelsCleared.includes(level)
    ? prev.levelsCleared
    : [...prev.levelsCleared, level].sort((a, b) => a - b);

  // Chapter completion increments when the last level in the chapter is cleared
  const chapterCompletions = { ...prev.chapterCompletions };
  if (level === chapter.levelEnd) {
    chapterCompletions[chapter.id] = (chapterCompletions[chapter.id] ?? 0) + 1;
  }

  const chapterXp = { ...prev.chapterXp };
  chapterXp[chapter.id] = (chapterXp[chapter.id] ?? 0) + earnedXp;

  const chapterMinutes = { ...prev.chapterMinutes };
  chapterMinutes[chapter.id] =
    (chapterMinutes[chapter.id] ?? 0) + Math.max(0, elapsedSeconds) / 60;

  // Streak logic
  let streakDays = prev.streakDays;
  if (!prev.lastPlayISO) {
    streakDays = 1;
  } else {
    const diff = daysBetween(prev.lastPlayISO, now);
    if (diff === 0) streakDays = Math.max(1, prev.streakDays);
    else if (diff === 1) streakDays = prev.streakDays + 1;
    else streakDays = 1;
  }
  const longestStreak = Math.max(prev.longestStreak, streakDays);

  // Scroll milestone
  const scrolls = { ...prev.scrolls };
  const milestone = scrollMilestoneFor(level);
  if (milestone) {
    scrolls[`${milestone.chapterId}:${milestone.index}`] = true;
  }

  const next: GameState = {
    levelsCleared,
    chapterMinutes,
    chapterCompletions,
    chapterXp,
    totalXp: prev.totalXp + earnedXp,
    totalPlaySeconds: prev.totalPlaySeconds + Math.max(0, elapsedSeconds),
    streakDays,
    longestStreak,
    lastPlayISO: now,
    scrolls,
  };
  saveState(next);
  return next;
}

// -------- Derived helpers ---------------------------------------------------

export function chapterXpCap(chapterId: ChapterId): number {
  const ch = CHAPTERS.find((c) => c.id === chapterId);
  if (!ch) return 1000;
  // Each level in the chapter is worth up to ~200 xp.
  return (ch.levelEnd - ch.levelStart + 1) * 200;
}

export function favoriteChapter(state: GameState): ChapterId {
  let best: ChapterId = CHAPTERS[0].id;
  let bestVal = -1;
  for (const c of CHAPTERS) {
    const v = state.chapterMinutes[c.id] ?? 0;
    if (v > bestVal) {
      bestVal = v;
      best = c.id;
    }
  }
  return best;
}

export function levelsClearedInChapter(state: GameState, chapterId: ChapterId): number {
  const ch = CHAPTERS.find((c) => c.id === chapterId);
  if (!ch) return 0;
  return state.levelsCleared.filter((l) => l >= ch.levelStart && l <= ch.levelEnd).length;
}

export function formatPlaytime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** React hook: subscribes to loadState, provides a mutator. */
export function useGameState() {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(loadState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commitWin = useCallback((payload: WinPayload) => {
    const next = updateOnWin(payload);
    setState(next);
    return next;
  }, []);

  return { state, hydrated, commitWin };
}
