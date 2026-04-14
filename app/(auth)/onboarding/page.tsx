import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Profile setup flow. For users without an auth account yet (i.e. arriving
 * from the login page's "New here?" link), we also collect email + password
 * so we can create the Supabase auth user before the profile row.
 *
 * If a user is already signed in (e.g. via Google OAuth), the form only
 * shows the profile fields.
 */
export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const needsAccount = !user;

  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-8 pb-12">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader>
          <span className="inline-flex items-center self-start rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Welcome
          </span>
          <CardTitle className="text-2xl">
            {needsAccount ? "Create your account" : "Set up your profile"}
          </CardTitle>
          <CardDescription>
            A few quick details so your friends can find you and your
            calendar feels useful from day one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm needsAccount={needsAccount} />
        </CardContent>
      </Card>
    </div>
  );
}
