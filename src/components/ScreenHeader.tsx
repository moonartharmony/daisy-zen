import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Button asChild variant="neo" size="touch" className="rounded-xl size-12 p-0"><Link
          to={backTo}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" strokeWidth={2.75} />
        </Link></Button>
      ) : (
        <Button variant="neo" size="touch"
          aria-label="Back"
          onClick={() => router.history.back()}
          className="rounded-xl size-12 p-0"
        >
          <ArrowLeft className="size-5" strokeWidth={2.75} />
        </Button>
      )}

      <h1
        className="text-headline text-center flex-1 truncate"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h1>

      {showHome ? (
        <Button asChild variant="neo" size="touch" className="rounded-xl size-12 p-0"><Link
          to="/"
          aria-label="Home"
        >
          <Home className="size-5" strokeWidth={2.75} />
        </Link></Button>
      ) : (
        <span className="size-12" aria-hidden />
      )}
    </header>
  );
}
