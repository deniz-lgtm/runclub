import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

/**
 * Sign-in page.
 *
 * Server component wrapper around the <LoginForm/> client component,
 * which handles the magic-link + Google OAuth flows via server actions.
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

        <CardContent className="flex flex-col gap-4">
          <LoginForm />

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="text-center text-xs text-muted-foreground">
            First time here?{" "}
            <Link
              href="/onboarding"
              className="font-semibold text-primary hover:underline"
            >
              Set up your profile
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
