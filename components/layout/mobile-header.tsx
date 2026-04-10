"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Sticky top header. Shows the current tab's name and a subtle brand
 * mark. Always visible (mobile-only app).
 */
export function MobileHeader() {
  const pathname = usePathname();

  const current =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            F
          </div>
          <span className="text-base font-semibold tracking-tight">
            {current.label}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Friends Who Run
        </span>
      </div>
    </header>
  );
}
