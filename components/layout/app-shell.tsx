import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";

/**
 * Top-level layout shell.
 *
 * Mobile (<md): sticky MobileHeader + content + fixed BottomNav.
 * Desktop (md+): fixed Sidebar on the left, content fills the rest.
 *
 * Auth routes like /login and /onboarding render outside this shell by
 * using a route group with its own layout — this shell is only applied
 * by the root layout to the main app surface.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64">
        <MobileHeader />
        <main className="pb-24 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
