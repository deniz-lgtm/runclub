import { AppShell } from "@/components/layout/app-shell";

/**
 * Main app layout (route group).
 *
 * Every tab page — feed, calendar, routes, train, clubs, profile — renders
 * inside this layout, so they all get the sidebar (desktop) / bottom nav
 * (mobile) wrapper. Auth pages live in the `(auth)` route group and do
 * NOT get this shell.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
