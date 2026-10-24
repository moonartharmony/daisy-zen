import { useEffect } from "react";
import type { Chapter } from "@/lib/chapters";
import { ScrollText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { OverlayCard } from "@/components/OverlayPresentation";
import { Button } from "@/components/ui/button";

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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="overlay-backdrop fixed inset-0 z-[110] pointer-events-auto flex flex-col items-center justify-center overflow-y-auto px-6 py-6 md:px-8"
    >
      <OverlayCard role="dialog" aria-modal="true" aria-labelledby="chapter-intro-title"
        className="neo-lg rounded-3xl bg-card w-full max-w-md min-h-[420px] p-8 md:p-10 flex flex-col items-center justify-between text-center text-ink"
      >
        {/* Band 1 — identity: icon tile + chapter pill */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="neo-sm rounded-2xl size-14 grid place-items-center bg-biome-accent text-biome-on-accent"
          >
            <ScrollText className="size-7" strokeWidth={2.25} />
          </div>
          <span className="stat-badge text-xs font-bold uppercase bg-butter px-3 py-1 rounded-full">
            {chapter.bolum}
          </span>
        </div>

        {/* Band 2 — story: title + readable description */}
        <div className="flex flex-col items-center gap-3 py-2">
          <h2 id="chapter-intro-title" className="text-2xl md:text-3xl font-black uppercase leading-tight text-ink">
            {chapter.name}
          </h2>
          <p className="text-sm md:text-base font-medium leading-relaxed max-w-xs text-muted-foreground">
            {chapter.intro}
          </p>
        </div>

        {/* Band 3 — action: wide, high-affordance tactile target */}
        <Button variant="neoInk" size="touch"
          onClick={onEnter}
          className="w-full max-w-xs mb-1 py-3.5 px-6 whitespace-normal font-bold rounded-xl"
        >
          Enter the {chapter.name.replace(/^The\s+/, "")}
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </Button>
      </OverlayCard>
    </motion.div>
  );
}
