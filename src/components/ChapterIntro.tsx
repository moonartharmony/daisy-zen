import { useEffect } from "react";
import type { Chapter } from "@/lib/chapters";
import { ScrollText, ArrowRight } from "lucide-react";

type Props = {
  chapter: Chapter;
  onEnter: () => void;
};

/**
 * ChapterIntro
 * -------------
 * Full-screen poetic vignette shown once per biome (the first time it
 * opens). Uses the chapter's own background so the transition already
 * establishes the world's palette before gameplay begins.
 *
 * Layout: three grouped bands — identity, story, action — spread evenly
 * inside a min-height card. Proximity keeps each band together while the
 * whitespace between bands carries the reading order down to the CTA.
 */
export function ChapterIntro({ chapter, onEnter }: Props) {
  // Escape / Enter dismiss for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnter]);

  return (
    <div
      className="fixed inset-0 z-[110] pointer-events-auto flex flex-col items-center justify-center px-6 md:px-8 animate-pop-in"
      style={{ backgroundColor: chapter.bgColor, color: chapter.inkColor }}
    >
      <div
        className="neo-lg rounded-3xl bg-white/90 backdrop-blur-sm w-full max-w-md min-h-[420px] p-8 md:p-10 flex flex-col items-center justify-between text-center text-ink"
      >
        {/* Band 1 — identity: icon tile + chapter pill */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="neo-sm rounded-2xl size-14 grid place-items-center"
            style={{ backgroundColor: chapter.tileColor }}
          >
            <ScrollText className="size-7" strokeWidth={2.25} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest bg-butter border-2 border-ink px-3 py-1 rounded-full shadow-[1.5px_1.5px_0px_var(--ink)]">
            {chapter.bolum}
          </span>
        </div>

        {/* Band 2 — story: title + readable description */}
        <div className="flex flex-col items-center gap-3 py-2">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight text-ink">
            {chapter.name}
          </h2>
          <p className="text-sm md:text-base font-medium leading-relaxed max-w-xs text-slate-700">
            {chapter.intro}
          </p>
        </div>

        {/* Band 3 — action: wide, high-affordance tactile target */}
        <button
          onClick={onEnter}
          className="w-full max-w-xs mb-1 py-3.5 px-6 flex items-center justify-center gap-2 bg-ink text-petal font-bold rounded-xl border-2 border-ink shadow-[4px_4px_0px_var(--primary)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_var(--primary)] transition-all"
        >
          Enter the {chapter.name.replace(/^The\s+/, "")}
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
