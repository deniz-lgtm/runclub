import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Login page.
 *
 * Phase 1A stub: renders the brand, sign-in options, and wires the form
 * targets. The actual OAuth + magic link flows land in Phase 1B once
 * Supabase credentials are configured.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-md shadow-primary/25">
            F
          </div>
          <CardTitle className="text-2xl">Friends Who Run</CardTitle>
          <CardDescription>Your crew. Your miles. Your race.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* OAuth providers */}
          <Button variant="outline" size="lg" className="w-full" disabled>
            Continue with Google
          </Button>
          <Button variant="outline" size="lg" className="w-full" disabled>
            Continue with Apple
          </Button>

          <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Magic link */}
          <form className="flex flex-col gap-2" action="#">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-border bg-surface px-4 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" size="lg" className="w-full">
              Send magic link
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="mt-1 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link
              href="/onboarding"
              className="font-semibold text-primary hover:underline"
            >
              Start your profile
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
