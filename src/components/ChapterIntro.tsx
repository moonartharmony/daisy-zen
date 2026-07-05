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
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center px-8 animate-chapter-fade"
      style={{ backgroundColor: chapter.bgColor, color: chapter.inkColor }}
    >
      <div
        className="neo-lg rounded-3xl bg-white/85 backdrop-blur-sm max-w-md w-full p-8 flex flex-col items-center gap-5 text-center"
        style={{ color: "#1F1F1F" }}
      >
        <div
          className="neo-sm rounded-2xl size-14 grid place-items-center"
          style={{ backgroundColor: chapter.tileColor }}
        >
          <ScrollText className="size-7" strokeWidth={2.25} />
        </div>
        <div
          className="text-[12px] font-bold tracking-[0.22em]"
          style={{ color: "#1F1F1F", opacity: 0.7 }}
        >
          {chapter.bolum}
        </div>
        <h2 className="text-display leading-tight">{chapter.name}</h2>
        <p
          className="text-body-lg italic leading-relaxed"
          style={{ opacity: 0.85 }}
        >
          {chapter.intro}
        </p>
        <button
          onClick={onEnter}
          className="neo neo-press rounded-2xl bg-[color:var(--ink)] text-white py-3 px-6 text-body-lg flex items-center gap-2 mt-1 hover:-translate-y-0.5 transition-transform"
        >
          Enter the {chapter.name.replace(/^The\s+/, "")}
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
