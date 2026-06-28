import { Link, useRouterState } from "@tanstack/react-router";
import { Home, RotateCcw, BarChart3, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Item = {
  to: "/" | "/journey" | "/stats" | "/profile";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const ITEMS: Item[] = [
  { to: "/", label: "Ana Sayfa", Icon: Home },
  { to: "/journey", label: "Tekrarla", Icon: RotateCcw },
  { to: "/stats", label: "İstatistik", Icon: BarChart3 },
  { to: "/profile", label: "Profil", Icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 bg-[color:var(--peach)] border-t-[3.5px] border-[color:var(--ink)]"
    >
      <ul className="flex items-center justify-around max-w-md mx-auto px-3 py-3">
        {ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 group"
              >
                <span
                  className={
                    active
                      ? "neo-sm rounded-xl bg-primary p-2.5 text-[color:var(--ink)]"
                      : "p-2.5 text-[color:var(--ink)]/80"
                  }
                >
                  <Icon className="size-5" strokeWidth={2.5} />
                </span>
                <span
                  className="text-[11px] font-bold tracking-wide"
                  style={{ color: "var(--ink)" }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
