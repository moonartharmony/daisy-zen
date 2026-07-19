import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

/** Shown on /stats when the player has not yet cleared any levels. */
export function EmptyStats() {
  return (
    <section
      className="w-full max-w-md mx-auto neo-lg rounded-3xl bg-white p-8 flex flex-col items-center gap-4 text-center"
    >
      <div
        className="neo-sm rounded-full size-20 grid place-items-center"
        style={{ backgroundColor: "#EAF3E4", color: "#3E5C38" }}
      >
        <Sprout className="size-9" strokeWidth={2.25} />
      </div>
      <h2 className="text-headline">The garden is still.</h2>
      <p className="text-sm font-semibold opacity-70 max-w-[22rem]">
        Clear your first level to plant the first bloom. Your streaks, scrolls,
        and mindful minutes will grow here.
      </p>
      <Link
        to="/"
        className="neo neo-press rounded-xl bg-primary px-5 py-3 text-body-lg font-extrabold"
        style={{ color: "var(--ink)" }}
      >
        Begin the first breath
      </Link>
    </section>
  );
}
