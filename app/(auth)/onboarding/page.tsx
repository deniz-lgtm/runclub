import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "@/components/auth/onboarding-form";

/**
 * Profile setup flow. Collects the fields we need before dropping the
 * user into the app: username, display name, city, preferred distance,
 * weekly mileage goal, bio. Submits to the `createProfile` server action.
 */
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-8 pb-12">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader>
          <span className="inline-flex items-center self-start rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Welcome
          </span>
          <CardTitle className="text-2xl">Set up your profile</CardTitle>
          <CardDescription>
            A few quick details so your friends can find you and your
            calendar feels useful from day one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
