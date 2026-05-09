import { useEffect } from "react";
import type { Chapter } from "@/lib/chapters";

type Props = {
  chapter: Chapter;
  onDone: () => void;
};

export function ChapterTransition({ chapter, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 px-6 animate-chapter-fade"
      style={{ backgroundColor: chapter.bgColor }}
    >
      <h1
        className="text-display text-white text-center"
        style={{ letterSpacing: "-0.02em" }}
      >
        {chapter.name}
      </h1>
      <p
        className="text-body-lg text-center italic"
        style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}
      >
        "{chapter.epigraph}"
      </p>
    </div>
  );
}
