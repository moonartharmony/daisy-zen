import { useEffect, useRef } from "react";
import type { Chapter } from "@/lib/chapters";
import { motion } from "framer-motion";
import { OverlayCard } from "@/components/OverlayPresentation";

type Props = {
  chapter: Chapter;
  onDone: () => void;
};

export function ChapterTransition({ chapter, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 2500);
    return () => clearTimeout(t);
  }, [chapter.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="overlay-backdrop fixed inset-0 z-[100] pointer-events-none flex items-center justify-center px-6"
    >
      <OverlayCard className="completion-card rounded-2xl bg-card text-card-foreground w-full max-w-md p-8 flex flex-col items-center gap-4 text-center">
      <h1
        className="text-2xl md:text-3xl font-black uppercase text-center"
      >
        {chapter.name}
      </h1>
      <p
        className="text-base leading-relaxed text-center text-muted-foreground"
      >
        "{chapter.epigraph}"
      </p>
      </OverlayCard>
    </motion.div>
  );
}
