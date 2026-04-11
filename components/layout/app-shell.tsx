import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";

/**
 * Top-level layout shell — **mobile-only**.
 *
 * Friends Who Run is a mobile app (installable as a PWA). There is no
 * desktop sidebar. The content column is constrained to a phone width
 * (max-w-md ≈ 448px) and centered, so when viewed on desktop it looks
 * like a phone-sized viewport instead of sprawling across the screen.
 *
 * On desktop the surrounding frame is solid ink so the bone-colored
 * phone column stands out like a printed page on a dark table.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink md:bg-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-bone md:my-0 md:min-h-screen md:border-x md:border-ink/20">
        <MobileHeader />
        <main className="flex-1 pb-28">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
