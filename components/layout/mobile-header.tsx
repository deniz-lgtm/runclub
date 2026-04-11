"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Sticky top header — editorial / race-bib treatment.
 *
 * Left: heavy wordmark. Right: uppercase tab label + bib-style index.
 * Ink on bone. One hairline rule at the bottom.
 */
export function MobileHeader() {
  const pathname = usePathname();

  const currentIdx = Math.max(
    NAV_ITEMS.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ),
    0,
  );
  const current = NAV_ITEMS[currentIdx];

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-bone/90 backdrop-blur safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Brand mark */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xs bg-ink text-white">
            <span className="font-display text-[13px] font-black leading-none">
              F
            </span>
          </div>
          <span className="font-display text-[11px] font-extrabold uppercase tracking-bib text-ink">
            Friends Who Run
          </span>
        </div>

        {/* Current section */}
        <div className="flex items-center gap-1.5">
          <span className="bib">
            {String(currentIdx + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-bib text-ink">
            {current.label}
          </span>
        </div>
      </div>
    </header>
  );
}
