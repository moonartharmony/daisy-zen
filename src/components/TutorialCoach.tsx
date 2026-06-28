import { useEffect, useState } from "react";

type Props = {
  level: number;
  hasTapped: boolean;
  hasAligned: boolean;
};

const STORAGE_KEY = "daisy.tutorial.seen.v1";

/**
 * Lightweight coach marks for the first two levels.
 * - L1 step 1: "Tap a petal to rotate its arrow"
 * - L1 step 2 (after first tap): "Match the arrow to the yellow center"
 * - L1 done after first alignment.
 * - L2: single bottom hint reminder, auto-fades after 4s or first tap.
 */
export function TutorialCoach({ level, hasTapped, hasAligned }: Props) {
  // Start as "not seen" on both server and first client render to avoid
  // hydration mismatch; hydrate from localStorage in an effect.
  const [seen, setSeen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [l2Visible, setL2Visible] = useState(true);

  useEffect(() => {
    setHydrated(true);
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setSeen(true);
  }, []);

  // Mark tutorial as seen once the player aligns their first petal on L1.
  useEffect(() => {
    if (level === 1 && hasAligned && !seen) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setSeen(true);
    }
  }, [level, hasAligned, seen]);

  // L2 reminder fades after first tap or after 4s.
  useEffect(() => {
    if (level !== 2) return;
    if (hasTapped) {
      const t = setTimeout(() => setL2Visible(false), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setL2Visible(false), 4000);
    return () => clearTimeout(t);
  }, [level, hasTapped]);

  if (!hydrated) return null;
  if (seen && level !== 2) return null;

  if (level === 1) {
    const message = !hasTapped
      ? {
          title: "Bir yaprağa dokun",
          body: "Her dokunuş, oktaki yönü saat yönünde çevirir.",
        }
      : !hasAligned
      ? {
          title: "Sarı merkezle hizala",
          body: "Tüm yaprak oklarını ortadaki yönle aynı yöne çevir.",
        }
      : null;

    if (!message) return null;

    return (
      <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4">
        <div className="neo pointer-events-auto animate-pop-in max-w-xs rounded-2xl bg-white px-4 py-3 text-center">
          <div className="text-body-lg text-[color:var(--ink)]">{message.title}</div>
          <div className="mt-1 text-sm font-medium text-[color:var(--ink)] opacity-75">
            {message.body}
          </div>
        </div>
      </div>
    );
  }

  if (level === 2 && l2Visible) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4">
        <div className="neo pointer-events-auto animate-pop-in max-w-xs rounded-2xl bg-white px-4 py-2 text-center">
          <div className="text-sm font-semibold text-[color:var(--ink)]">
            İpucu: tüm okları sarı merkezin yönüne çevir.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
