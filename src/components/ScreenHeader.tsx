import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

type Props = {
  title: string;
  /** Override the back destination; default = router back(). */
  backTo?: "/" | "/journey" | "/profile";
  /** Set false to hide the trailing home button. */
  showHome?: boolean;
};

/**
 * Heavy-bordered Neubrutalist screen header.
 * Square back button on the left, centered title, optional home button right.
 */
export function ScreenHeader({ title, backTo, showHome = true }: Props) {
  const router = useRouter();

  return (
    <header className="w-full max-w-md mx-auto flex items-center justify-between gap-3 pt-2">
      {backTo ? (
        <Link
          to={backTo}
          aria-label="Back"
          className="neo neo-press rounded-xl bg-white size-12 grid place-items-center"
        >
          <ArrowLeft className="size-5" strokeWidth={2.75} />
        </Link>
      ) : (
        <button
          aria-label="Back"
          onClick={() => router.history.back()}
          className="neo neo-press rounded-xl bg-white size-12 grid place-items-center"
        >
          <ArrowLeft className="size-5" strokeWidth={2.75} />
        </button>
      )}

      <h1
        className="text-headline text-center flex-1 truncate"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h1>

      {showHome ? (
        <Link
          to="/"
          aria-label="Home"
          className="neo neo-press rounded-xl bg-white size-12 grid place-items-center"
        >
          <Home className="size-5" strokeWidth={2.75} />
        </Link>
      ) : (
        <span className="size-12" aria-hidden />
      )}
    </header>
  );
}
