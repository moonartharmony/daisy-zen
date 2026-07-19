import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://eu.i.posthog.com";

/**
 * Initialize PostHog once on app mount.
 * No-ops when VITE_POSTHOG_KEY is absent (local / CI environments).
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false,   // TanStack Router manages navigation events
    persistence: "localStorage+cookie",
    autocapture: false,
  });
}

/**
 * Associate the current anonymous session with an authenticated user.
 * Safe to call on every auth state change — PostHog deduplicates.
 */
export function identifyUser(userId: string, email?: string): void {
  if (typeof window === "undefined" || !KEY) return;
  posthog.identify(userId, { email });
}

/** Detach the current user on sign-out; resets to anonymous tracking. */
export function resetAnalyticsUser(): void {
  if (typeof window === "undefined" || !KEY) return;
  posthog.reset();
}
