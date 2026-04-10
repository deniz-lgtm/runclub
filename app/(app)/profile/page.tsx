import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSummary } from "@/components/profile/profile-summary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/login/actions";

/**
 * Your own profile page.
 *
 * Requires a completed profile — `requireProfile()` will redirect to
 * /login if unauth or /onboarding if the profile row is missing.
 */
export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader title="Profile" />

      <div className="w-full px-4 space-y-4">
        <ProfileSummary profile={profile} />

        {/* Connected apps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected apps</CardTitle>
            <CardDescription>
              Sync Strava, TrainingPeaks, and Final Surge to bring your runs
              and training plans into FWR.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ConnectionRow
              name="Strava"
              note="Activities, routes, and maps"
            />
            <ConnectionRow
              name="TrainingPeaks"
              note="Coach-built training plan"
            />
            <ConnectionRow
              name="Final Surge"
              note="Coach-built training plan"
            />
          </CardContent>
        </Card>

        {/* Settings + sign out */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href="/profile/settings">Account settings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile/settings/connections">
                Manage connections
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/friends">Friends</Link>
            </Button>
            <form action={signOut}>
              <Button
                variant="ghost"
                type="submit"
                className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ConnectionRow({ name, note }: { name: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{note}</div>
      </div>
      <Badge variant="muted">Not connected</Badge>
    </div>
  );
}
