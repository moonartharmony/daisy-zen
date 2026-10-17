import { useEffect, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollText, Sparkles } from "lucide-react";

type Props = {
  originRef: RefObject<HTMLDivElement | null>;
  xpRef: RefObject<HTMLSpanElement | null>;
  scrollRef: RefObject<HTMLSpanElement | null>;
  hasScrollReward: boolean;
};

/** Pure visual reward projection; it never awards XP or changes progress. */
export function CompletionRewards({ originRef, xpRef, scrollRef, hasScrollReward }: Props) {
  const reducedMotion = useReducedMotion();
  const [points, setPoints] = useState<{ x: number; y: number; xpX: number; xpY: number; scrollX: number; scrollY: number } | null>(null);
  useEffect(() => {
    const origin = originRef.current?.getBoundingClientRect();
    const xp = xpRef.current?.getBoundingClientRect();
    const scroll = scrollRef.current?.getBoundingClientRect();
    if (!origin || !xp || !scroll) return;
    setPoints({ x: origin.x + origin.width / 2, y: origin.y + origin.height / 2, xpX: xp.x + xp.width / 2, xpY: xp.y + xp.height / 2, scrollX: scroll.x + scroll.width / 2, scrollY: scroll.y + scroll.height / 2 });
  }, [originRef, xpRef, scrollRef]);
  if (!points || reducedMotion) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
      {Array.from({ length: hasScrollReward ? 6 : 5 }, (_, i) => {
        const isScroll = hasScrollReward && i === 5;
        const Icon = isScroll ? ScrollText : Sparkles;
        const x = (isScroll ? points.scrollX : points.xpX) - points.x;
        const y = (isScroll ? points.scrollY : points.xpY) - points.y;
        return (
          <motion.span key={i} className="absolute left-0 top-0 grid size-7 place-items-center rounded-full border-2 border-ink bg-primary text-primary-foreground"
            initial={{ x: points.x - 14, y: points.y - 14, opacity: 0 }}
            animate={{ x: [points.x - 14, points.x + (i - 2) * 24, points.x + x - 14], y: [points.y - 14, points.y - 70 - i * 5, points.y + y - 14], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.75, delay: i * 0.045, ease: "easeOut", times: [0, 0.25, 0.8, 1] }}>
            <Icon className="size-4" strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}