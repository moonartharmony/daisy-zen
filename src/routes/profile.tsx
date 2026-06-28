import { createFileRoute } from "@tanstack/react-router";
import { Scale, BookOpen, Flame, Pencil, LogOut, Users } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";
import { useProgress } from "@/lib/progress";
import { CHAPTERS, getChapter } from "@/lib/chapters";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Daisy Zen" },
      { name: "description", content: "Your zen identity and progress." },
      { property: "og:title", content: "Profile — Daisy Zen" },
      { property: "og:description", content: "Your zen identity and progress." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { highestUnlocked } = useProgress();
  const chapter = getChapter(highestUnlocked);
  const totalLevels = CHAPTERS[CHAPTERS.length - 2]?.levelEnd ?? 50;
  const focus = Math.min(100, Math.round((highestUnlocked / totalLevels) * 100));
  const totalXP = highestUnlocked * 155; // simple deterministic stat
  const dailyStreak = 12;

  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-28">
      <ScreenHeader title="Daisy Zen" backTo="/journey" />

      {/* Identity card */}
      <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-white p-6 flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="size-28 rounded-full grid place-items-center border-[3.5px] overflow-hidden"
            style={{
              backgroundColor: "#D8C3A8",
              borderColor: "var(--ink)",
            }}
            aria-hidden
          >
            <Users className="size-14 text-[color:var(--ink)]/70" strokeWidth={1.5} />
          </div>
          <button
            aria-label="Edit avatar"
            className="absolute bottom-0 right-0 neo-sm rounded-full size-8 grid place-items-center"
            style={{ backgroundColor: "#2E6B6E", color: "#fff" }}
          >
            <Pencil className="size-4" strokeWidth={2.75} />
          </button>
        </div>
        <h2 className="text-[26px] font-extrabold" style={{ color: "var(--ink)" }}>
          Daisy Williams
        </h2>
        <p className="text-sm font-semibold" style={{ color: "var(--ink)", opacity: 0.7 }}>
          Zen Level: {chapter.name}
        </p>

        <div className="w-full flex items-center justify-between text-sm font-bold pt-3">
          <span style={{ color: "var(--ink)" }}>Current Focus</span>
          <span style={{ color: "#7A6A00" }}>{focus}%</span>
        </div>
        <div
          className="w-full h-3 rounded-full border-[3px] overflow-hidden bg-white"
          style={{ borderColor: "var(--ink)" }}
        >
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${Math.max(4, focus)}%`,
              backgroundColor: "#B8D6CC",
            }}
          />
        </div>
      </section>

      {/* Total alignment */}
      <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-[color:var(--primary)] p-4 flex items-center gap-4">
        <div className="neo-sm rounded-xl size-14 grid place-items-center bg-white shrink-0">
          <Scale className="size-7" strokeWidth={2.25} />
        </div>
        <div className="flex flex-col">
          <span
            className="text-[11px] font-bold tracking-[0.12em] uppercase"
            style={{ color: "var(--ink)", opacity: 0.7 }}
          >
            Total Alignment
          </span>
          <span className="text-[26px] font-extrabold leading-tight" style={{ color: "var(--ink)" }}>
            {totalXP.toLocaleString()} XP
          </span>
        </div>
      </section>

      {/* Stat duo */}
      <section className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
        <StatCard icon={<BookOpen className="size-5" strokeWidth={2.5} style={{ color: "#1F4F4A" }} />} label="Chapters" value={String(CHAPTERS.length - 2)} />
        <StatCard icon={<Flame className="size-5" strokeWidth={2.5} style={{ color: "#C0392B" }} fill="#C0392B" />} label="Daily Streak" value={`${dailyStreak} Days`} />
      </section>

      {/* Zen identity panel */}
      <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-white p-5 flex flex-col gap-3">
        <h3 className="text-headline" style={{ color: "var(--ink)" }}>
          Zen Identity
        </h3>
        <p className="text-sm" style={{ color: "var(--ink)", opacity: 0.7 }}>
          Sync your progress across the continuum.
        </p>

        <label className="text-sm font-bold mt-2" style={{ color: "var(--ink)" }}>
          Universal ID
        </label>
        <input
          type="email"
          placeholder="daisy@zen.com"
          className="neo-sm rounded-lg px-3 py-3 text-base bg-[color:var(--sand)]/50 placeholder:text-[color:var(--ink)]/45"
          style={{ color: "var(--ink)" }}
        />

        <label className="text-sm font-bold mt-1" style={{ color: "var(--ink)" }}>
          Access Phrase
        </label>
        <input
          type="password"
          placeholder="••••••••"
          className="neo-sm rounded-lg px-3 py-3 text-base bg-[color:var(--sand)]/50 placeholder:text-[color:var(--ink)]/45"
          style={{ color: "var(--ink)" }}
        />

        <button
          className="neo neo-press rounded-xl bg-[color:var(--primary)] py-3 text-base font-extrabold mt-2"
          style={{ color: "var(--ink)" }}
        >
          Connect Identity
        </button>

        <div className="flex items-center justify-between text-sm font-bold pt-2">
          <button className="hover:underline" style={{ color: "var(--ink)", opacity: 0.7 }}>
            Forgot Phrase?
          </button>
          <button className="hover:underline" style={{ color: "#2E6B6E" }}>
            New Explorer?
          </button>
        </div>
      </section>

      <button
        className="w-full max-w-md mx-auto text-sm font-bold flex items-center justify-center gap-2"
        style={{ color: "var(--ink)", opacity: 0.8 }}
      >
        <Users className="size-4" strokeWidth={2.5} />
        Switch Account
      </button>

      <button
        className="w-full max-w-md mx-auto neo rounded-xl bg-white py-3 text-base font-extrabold flex items-center justify-center gap-2"
        style={{ color: "#C0392B" }}
      >
        <LogOut className="size-5" strokeWidth={2.5} />
        Logout from Daisy Zen
      </button>

      <BottomNav />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="neo-lg rounded-2xl bg-white p-4 flex flex-col gap-2">
      <div>{icon}</div>
      <span
        className="text-[12px] font-bold tracking-wide"
        style={{ color: "var(--ink)", opacity: 0.75 }}
      >
        {label}
      </span>
      <span className="text-[22px] font-extrabold" style={{ color: "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}
