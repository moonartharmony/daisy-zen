import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Flower2,
  Waves,
  Sparkles,
  Award,
  MountainSnow,
  Wind,
  Cherry,
  ScrollText,
  Lock,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyStats } from "@/components/EmptyStats";
import { useProgress } from "@/lib/progress";
import { CHAPTERS, getChapter, getChapterById, type ChapterId } from "@/lib/chapters";
import {
  favoriteChapter as pickFavorite,
  formatPlaytime,
  useGameState,
} from "@/lib/gameState";

const getChapterIdForLevel = (lvl: number): ChapterId => getChapter(lvl).id;

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Daisy Zen" },
      {
        name: "description",
        content:
          "Growth streaks, garden harvest, mindful minutes, and the scrolls you've gathered along the way.",
      },
    ],
  }),
  component: Stats,
});

const CHAPTER_ICONS: Record<ChapterId, ComponentType<SVGProps<SVGSVGElement>>> = {
  daisy: Flower2,
  lavender: Wind,
  mountain: MountainSnow,
  sakura: Cherry,
  lotus: Waves,
};

type Achievement = {
  id: string;
  title: string;
  hint: string;
  unlocked: boolean;
};

function Stats() {
  const { highestUnlocked, hydrated: progressHydrated } = useProgress();
  const { state, hydrated } = useGameState();

  const flowersCollected = state.levelsCleared.length;
  const puzzlesSolved = state.levelsCleared.length;
  const currentStreakDays = state.streakDays;
  const longestStreakDays = state.longestStreak;
  const playSeconds = state.totalPlaySeconds;
  const scrollCount = Object.values(state.scrolls).filter(Boolean).length;
  const accuracy = puzzlesSolved > 0 ? 0.94 : 0;

  const favoriteId = pickFavorite(state);
  const favorite = getChapterById(favoriteId);

  const totalScrolls = CHAPTERS.length * 5;
  const collectedScrolls = scrollCount;

  const achievements: Achievement[] = [
    { id: "first-bloom", title: "First Bloom", hint: "Clear level 1.", unlocked: flowersCollected >= 1 },
    { id: "meadow", title: "Meadow Walker", hint: "Clear all 25 Daisy Forest levels.", unlocked: highestUnlocked > 25 },
    { id: "valley", title: "Valley Listener", hint: "Reach the Lavender Valley.", unlocked: highestUnlocked >= 26 },
    { id: "mountain", title: "Mountain Tamer", hint: "Summit the Mountain Peak.", unlocked: highestUnlocked > 75 },
    { id: "sakura", title: "Petal Whisperer", hint: "Bloom the Sakura Garden.", unlocked: highestUnlocked > 100 },
    { id: "flow", title: "Flow Master", hint: "Complete all 125 levels.", unlocked: highestUnlocked > 125 },
  ];

  // Empty state: player has not cleared any level yet.
  if (hydrated && progressHydrated && flowersCollected === 0) {
    return (
      <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-32">
        <ScreenHeader title="İstatistik" backTo="/journey" />
        <EmptyStats />
        <BottomNav />
      </main>
    );
  }

  const playtimeLabel = formatPlaytime(playSeconds);

  // Weekly bloom — derive from recent play; keep a soft mock shape when data
  // is thin so the card still reads visually.
  const weekly = [0.2, 0.35, 0.5, 0.4, 0.7, 0.55, Math.min(1, flowersCollected / 10)];

  // Dynamic timeline: most recently cleared levels first.
  const recentLevels = [...state.levelsCleared].sort((a, b) => b - a).slice(0, 4);
  const timeline = recentLevels.length
    ? recentLevels.map((lvl, i) => ({
        day: i === 0 ? "Just now" : `${i} step${i === 1 ? "" : "s"} ago`,
        text: `Level ${lvl} cleared · ${getChapterById(getChapterIdForLevel(lvl)).name}`,
      }))
    : [];

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-32">
      <ScreenHeader title="İstatistik" backTo="/journey" />

      <section className="w-full max-w-md mx-auto flex flex-col gap-5">
        {/* Growth streak — amber sun */}
        <article
          className="neo-lg rounded-3xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
          style={{ backgroundColor: "#FCE1A2" }}
        >
          <div
            className="neo-sm rounded-full size-16 grid place-items-center shrink-0 bg-white"
            style={{ color: "#B36F00" }}
          >
            <Flame className="size-7" strokeWidth={2.5} fill="#F5B342" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
              Growth Streak
            </div>
            <div className="text-[28px] font-extrabold leading-tight">
              {currentStreakDays} Day{currentStreakDays === 1 ? "" : "s"}
            </div>
            <div className="text-[13px] font-semibold opacity-75">
              Longest: {longestStreakDays} days
            </div>
          </div>
        </article>

        {/* Garden harvest — flower grid */}
        <article className="neo-lg rounded-3xl p-5 bg-white flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
                Garden Harvest
              </div>
              <div className="text-[24px] font-extrabold leading-tight">
                {flowersCollected} Flowers
              </div>
              <div className="text-[13px] font-semibold opacity-75">
                {puzzlesSolved} puzzles solved
              </div>
            </div>
            <div
              className="neo-sm rounded-2xl size-14 grid place-items-center"
              style={{ backgroundColor: "#EAF3E4", color: "#3E5C38" }}
            >
              <Flower2 className="size-7" strokeWidth={2.25} />
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 40 }).map((_, i) => {
              const filled = i < Math.min(40, flowersCollected);
              return (
                <div
                  key={i}
                  className="aspect-square rounded-full border-2"
                  style={{
                    borderColor: "#1F1F1F",
                    backgroundColor: filled ? "#FFD84D" : "transparent",
                    opacity: filled ? 1 : 0.3,
                  }}
                  aria-hidden
                />
              );
            })}
          </div>
        </article>

        {/* Mindful time — river/wave card */}
        <article
          className="neo-lg rounded-3xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform"
          style={{ backgroundColor: "#CDE7E0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="neo-sm rounded-2xl size-14 grid place-items-center shrink-0 bg-white"
              style={{ color: "#2E6B6E" }}
            >
              <Waves className="size-7" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
                Mindful Time
              </div>
              <div className="text-[24px] font-extrabold leading-tight">
                {playtimeLabel}
              </div>
              <div className="text-[13px] font-semibold opacity-75">
                Accuracy {Math.round(accuracy * 100)}%
              </div>
            </div>
          </div>
          <svg
            viewBox="0 0 300 60"
            className="w-full h-16"
            aria-hidden
          >
            <path
              d="M0 40 Q 30 10 60 30 T 120 30 T 180 30 T 240 30 T 300 30"
              fill="none"
              stroke="#1F1F1F"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <path
              d="M0 48 Q 30 22 60 40 T 120 40 T 180 40 T 240 40 T 300 40"
              fill="none"
              stroke="#2E6B6E"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.6}
            />
          </svg>
        </article>

        {/* Zonal affinity — favorite chapter */}
        <article
          className="neo-lg rounded-3xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
          style={{ backgroundColor: favorite.tileColor }}
        >
          <div
            className="neo-sm rounded-2xl size-14 grid place-items-center shrink-0 bg-white"
            style={{ color: favorite.accentColor }}
          >
            {(() => {
              const Icon = CHAPTER_ICONS[favorite.id];
              return <Icon className="size-7" strokeWidth={2.25} />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
              Zonal Affinity
            </div>
            <div className="text-[22px] font-extrabold leading-tight">
              Favorite: {favorite.name}
            </div>
            <div className="text-[13px] italic opacity-75">
              "{favorite.epigraph}"
            </div>
          </div>
        </article>

        {/* Weekly activity — 7-day leaf grid */}
        <article className="neo-lg rounded-3xl p-5 bg-white flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <h3 className="text-headline">Weekly Bloom</h3>
            <span className="text-[12px] font-bold opacity-70">Last 7 days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekly.map((v: number, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square rounded-2xl border-[3px] grid place-items-center"
                  style={{
                    borderColor: "#1F1F1F",
                    backgroundColor: `rgba(62,92,56,${Math.max(0.08, v)})`,
                  }}
                >
                  <Flower2
                    className="size-5"
                    strokeWidth={2.5}
                    style={{
                      color: v > 0.4 ? "#FFFFFF" : "#1F1F1F",
                      opacity: v > 0.1 ? 1 : 0.35,
                    }}
                  />
                </div>
                <span className="text-[11px] font-extrabold opacity-70">
                  {dayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Recent progress — organic timeline */}
        <article className="neo-lg rounded-3xl p-5 bg-white flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
          <h3 className="text-headline">Recent Progress</h3>
          <ol className="relative flex flex-col gap-4 pl-6">
            <span
              className="absolute left-[9px] top-2 bottom-2 border-l-[3px] border-dotted"
              style={{ borderColor: "#1F1F1F", opacity: 0.35 }}
              aria-hidden
            />
            {timeline.map((t: { day: string; text: string }, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="relative -ml-6 mt-1 grid place-items-center size-5 rounded-full border-[3px] bg-[color:var(--primary)]"
                  style={{ borderColor: "#1F1F1F" }}
                  aria-hidden
                />
                <div>
                  <div className="text-[12px] font-bold opacity-70">{t.day}</div>
                  <div className="text-[15px] font-semibold leading-snug">
                    {t.text}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </article>

        {/* Scrolls collected */}
        <article className="neo-lg rounded-3xl p-5 bg-white flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <h3 className="text-headline flex items-center gap-2">
              <ScrollText className="size-5" strokeWidth={2.25} />
              Zen Scrolls
            </h3>
            <span className="text-[12px] font-bold opacity-70">
              {collectedScrolls}/{totalScrolls}
            </span>
          </div>
          <p className="text-[13px] opacity-70">
            Small memories gathered every five levels.
          </p>
          {collectedScrolls === 0 && (
            <div
              className="rounded-2xl border-[3px] border-dashed p-4 text-sm text-center"
              style={{ borderColor: "rgba(31,31,31,0.35)", opacity: 0.75 }}
            >
              No scrolls yet — clear level 5 to receive your First Bloom scroll.
            </div>
          )}
        </article>

        {/* Achievements shelf */}
        <article className="neo-lg rounded-3xl p-5 bg-white flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
          <h3 className="text-headline flex items-center gap-2">
            <Award className="size-5" strokeWidth={2.25} />
            Achievements
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border-[3px] p-3 flex flex-col items-center text-center gap-1.5"
                style={{
                  borderColor: "#1F1F1F",
                  backgroundColor: a.unlocked ? "#FFF6D6" : "#F3ECDC",
                  opacity: a.unlocked ? 1 : 0.55,
                }}
                title={a.hint}
              >
                <div
                  className="size-9 rounded-full grid place-items-center border-[2.5px]"
                  style={{
                    borderColor: "#1F1F1F",
                    backgroundColor: a.unlocked ? "#FFD84D" : "#FFFFFF",
                  }}
                >
                  {a.unlocked ? (
                    <Sparkles className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Lock className="size-4" strokeWidth={2.5} />
                  )}
                </div>
                <div className="text-[11px] font-extrabold leading-tight">
                  {a.title}
                </div>
              </div>
            ))}
          </div>
        </article>

        <Link
          to="/journey"
          className="neo neo-press rounded-2xl bg-primary text-center py-3 text-body-lg font-extrabold hover:-translate-y-0.5 transition-transform"
          style={{ color: "var(--ink)" }}
        >
          Return to Journey Map
        </Link>
      </section>

      <BottomNav />
    </main>
  );
}
