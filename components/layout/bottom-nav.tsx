"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom nav — editorial treatment.
 *
 * Ink-on-bone bar. Active tab gets a flash-orange top accent bar
 * (like a race-bib number tab), inactive tabs stay muted.
 * Fixed to the bottom of the phone viewport, respects iOS safe area.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-ink/10 bg-bone/95 backdrop-blur safe-bottom">
      <ul className="flex items-stretch justify-between">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="relative flex-1">
              {/* Active accent bar across the top */}
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-[2px] bg-flash"
                  aria-hidden
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                )}
              >
                <Icon
                  className="h-[20px] w-[20px]"
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span className="text-[9px] font-bold uppercase tracking-bib">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
