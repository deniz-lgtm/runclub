import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { RaceLog } from "@/components/profile/race-log";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/login/actions";
import { getMyRaceResults } from "@/app/(app)/profile/race-actions";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const races = await getMyRaceResults();

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title={profile.display_name ?? profile.username}
      />

      <div className="column space-y-4">
        <ProfileSummary profile={profile} />

        {/* Race results */}
        <RaceLog races={races} />

        {/* Connected apps */}
        <div className="rounded-sm border border-ink/15 bg-surface p-4">
          <div className="label-bib mb-3">Connected apps</div>
          <div className="flex flex-col gap-2">
            <ConnectionRow name="Strava" note="Activities, routes, maps" />
            <ConnectionRow name="TrainingPeaks" note="Coach-built plan" />
            <ConnectionRow name="Final Surge" note="Coach-built plan" />
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
            <Link href="/profile/settings/connections">Manage</Link>
          </Button>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-2">
          <Button variant="outline" asChild>
            <Link href="/profile/settings">Account settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/friends">Friends</Link>
          </Button>
          <form action={signOut}>
            <Button
              variant="ghost"
              type="submit"
              className="w-full text-siren hover:bg-siren/5 hover:text-siren"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

function ConnectionRow({ name, note }: { name: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-xs border border-ink/10 bg-bone-soft/50 px-3 py-2.5">
      <div className="min-w-0">
        <div className="font-display text-xs font-extrabold text-ink">
          {name}
        </div>
        <div className="truncate font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          {note}
        </div>
      </div>
      <Badge variant="muted">Not connected</Badge>
    </div>
  );
}
