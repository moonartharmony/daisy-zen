import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Daisy Zen" },
      { name: "description", content: "Track your alignment and progress." },
    ],
  }),
  component: Stats,
});

function Stats() {
  return (
    <main className="min-h-[100dvh] w-full bg-[color:var(--peach)] flex flex-col gap-5 px-4 pt-4 pb-28">
      <ScreenHeader title="İstatistik" backTo="/journey" />
      <section className="w-full max-w-md mx-auto neo-lg rounded-2xl bg-white p-8 flex flex-col items-center gap-3 mt-6">
        <BarChart3 className="size-12" strokeWidth={2} />
        <h2 className="text-headline" style={{ color: "var(--ink)" }}>Coming soon</h2>
        <p className="text-sm text-center" style={{ color: "var(--ink)", opacity: 0.7 }}>
          Detailed alignment statistics will live here.
        </p>
        <Link
          to="/journey"
          className="neo neo-press rounded-xl bg-primary px-5 py-2 text-sm font-extrabold mt-2"
          style={{ color: "var(--ink)" }}
        >
          Back to Journey
        </Link>
      </section>
      <BottomNav />
    </main>
  );
}
