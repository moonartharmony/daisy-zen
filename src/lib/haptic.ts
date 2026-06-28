// Centralized haptic feedback. No-op on unsupported platforms (iOS Safari, desktop).
const v = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
};

export const haptic = {
  tap: () => v(8),
  align: () => v(15),
  misalign: () => v(12),
  win: () => v([40, 60, 40, 60, 80]),
  chapter: () => v([20, 40, 20]),
};
