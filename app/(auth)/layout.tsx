/**
 * Auth route group layout.
 *
 * Auth pages (login, onboarding) render *outside* the app shell — no
 * sidebar, no bottom nav. This route group has its own minimal layout.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {children}
    </div>
  );
}
