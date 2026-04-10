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
 * The MobileHeader is sticky at the top, the BottomNav is fixed at the
 * bottom with safe-area padding for iOS home indicator.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    // Outer wrapper — neutral gray on desktop so the phone viewport pops.
    <div className="min-h-screen bg-muted/40 md:bg-gradient-to-br md:from-muted/60 md:to-muted/20">
      {/* Phone-width column, centered */}
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-sm md:my-0 md:min-h-screen md:border-x md:border-border">
        <MobileHeader />
        <main className="flex-1 pb-24">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
