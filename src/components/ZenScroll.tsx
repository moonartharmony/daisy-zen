import { useEffect } from "react";
import { ScrollText, Sparkles } from "lucide-react";
import type { Chapter } from "@/lib/chapters";
import { motion } from "framer-motion";
import { OverlayCard } from "@/components/OverlayPresentation";
import { Button } from "@/components/ui/button";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="overlay-backdrop fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto px-6 py-6"
    >
      <OverlayCard role="dialog" aria-modal="true" aria-labelledby="zen-scroll-title"
        className="neo-lg rounded-3xl bg-biome-tile text-ink w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center"
      >
        <div
          className="neo-sm rounded-2xl size-14 grid place-items-center bg-card text-scroll-accent"
        >
          <ScrollText className="size-7" strokeWidth={2.25} />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.22em] uppercase opacity-70">
          <Sparkles className="size-3.5" strokeWidth={2.5} />
          Zen Scroll {scrollIndex + 1} · {chapter.name}
        </div>
        <h3 id="zen-scroll-title" className="text-headline">{scroll.title}</h3>
        <p className="text-body-lg italic leading-relaxed opacity-90">
          "{scroll.body}"
        </p>
        <Button variant="neo" size="touch"
          onClick={onClose}
          className="rounded-xl py-3 px-6 text-body-lg font-extrabold w-full mt-1"
        >
          Keep in Garden
        </Button>
      </OverlayCard>
    </motion.div>
  );
}
