import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Button } from "@/components/ui/button";

type Item = {
  to: "/" | "/journey" | "/stats" | "/profile";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Clean vector map icon (folded map w/ pin). */
const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.25}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
    <path d="M9 3v16" />
    <path d="M15 5v16" />
  </svg>
);

const ITEMS: Item[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/journey", label: "Journey", Icon: MapIcon },
  { to: "/stats", label: "Stats", Icon: BarChart3 },
  { to: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 bg-background border-t-[3.5px] border-ink"
    >
      <ul className="flex items-center justify-around max-w-md mx-auto px-3 py-3">
        {ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <div className="flex flex-col items-center gap-1.5">
                <Button asChild variant={active ? "neoPrimary" : "neo"} size="touch" className="size-11 rounded-xl p-0">
                  <Link to={to} aria-label={label} aria-current={active ? "page" : undefined} title={label}>
                    <Icon className="size-5" />
                  </Link>
                </Button>
                <span className="text-[11px] font-extrabold text-ink">{label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
