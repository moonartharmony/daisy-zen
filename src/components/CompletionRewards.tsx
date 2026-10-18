import { useEffect, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollText, Sparkles } from "lucide-react";

type Props = {
  originRef: RefObject<HTMLDivElement | null>;
  xpRef: RefObject<HTMLSpanElement | null>;
  scrollRef: RefObject<HTMLSpanElement | null>;
  hasScrollReward: boolean;
  earnedXp: number;
};

/** Pure visual reward projection; it never awards XP or changes progress. */
export function CompletionRewards({ originRef, xpRef, scrollRef, hasScrollReward, earnedXp }: Props) {
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
      {Array.from({ length: hasScrollReward ? 2 : 1 }, (_, i) => {
        const isScroll = i === 1;
        const Icon = isScroll ? ScrollText : Sparkles;
        const x = (isScroll ? points.scrollX : points.xpX) - points.x;
        const y = (isScroll ? points.scrollY : points.xpY) - points.y;
        return (
          <motion.span key={i} className="absolute left-0 top-0 flex h-8 items-center justify-center gap-1 rounded-full border-2 border-ink bg-primary px-2 text-xs font-black text-primary-foreground"
            initial={{ x: points.x - (isScroll ? 16 : 46), y: points.y - 16, opacity: 0 }}
            animate={{ x: [points.x - (isScroll ? 16 : 46), points.x - (isScroll ? 16 : 46), points.x + x - (isScroll ? 16 : 46)], y: [points.y - 16, points.y - 56, points.y + y - 16], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, ease: "easeOut", times: [0, 0.35, 1] }}>
            <Icon className="size-4" strokeWidth={2.5} />
            {!isScroll && `+${earnedXp} XP`}
          </motion.span>
        );
      })}
    </div>
  );
}