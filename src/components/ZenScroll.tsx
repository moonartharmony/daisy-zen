import { useEffect } from "react";
import { ScrollText, Sparkles } from "lucide-react";
import type { Chapter } from "@/lib/chapters";

type Props = {
  chapter: Chapter;
  scrollIndex: number;
  onClose: () => void;
};

/**
 * ZenScroll
 * ---------
 * Collectible "Memory Pebble" surfaced every 5 levels within a chapter,
 * containing a short philosophical quote on flow / gestalt / attention.
 */
export function ZenScroll({ chapter, scrollIndex, onClose }: Props) {
  const scroll = chapter.scrolls[scrollIndex];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!scroll) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(31,31,31,0.55)" }}
    >
      <div
        className="neo-lg rounded-3xl w-full max-w-sm p-8 flex flex-col items-center gap-4 animate-pop-in text-center"
        style={{ backgroundColor: chapter.tileColor, color: "#1F1F1F" }}
      >
        <div
          className="neo-sm rounded-2xl size-14 grid place-items-center bg-white"
          style={{ color: chapter.accentColor }}
        >
          <ScrollText className="size-7" strokeWidth={2.25} />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.22em] uppercase opacity-70">
          <Sparkles className="size-3.5" strokeWidth={2.5} />
          Zen Scroll {scrollIndex + 1} · {chapter.name}
        </div>
        <h3 className="text-headline">{scroll.title}</h3>
        <p className="text-body-lg italic leading-relaxed opacity-90">
          "{scroll.body}"
        </p>
        <button
          onClick={onClose}
          className="neo neo-press rounded-xl bg-white py-3 px-6 text-body-lg font-extrabold w-full mt-1 hover:-translate-y-0.5 transition-transform"
        >
          Keep in Garden
        </button>
      </div>
    </div>
  );
}
