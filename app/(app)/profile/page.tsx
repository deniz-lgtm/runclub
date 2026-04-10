import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

/**
 * Profile tab — Phase 1A placeholder.
 *
 * Phase 1B wires this up to the real signed-in user via Supabase auth.
 * For now it renders a demo profile card so the tab isn't empty, plus
 * placeholders for Connected Apps and settings links.
 */
export default function ProfilePage() {
  const demo = {
    displayName: "Deanna",
    username: "deanna",
    bio: "Making running social, one group run at a time. LA Marathon 2027. ✨",
    city: "Los Angeles, CA",
    weeklyGoal: 35,
    shoe: "On Cloudmonster",
    distance: "Marathon",
  };

  return (
    <>
      <PageHeader title="Profile" />

      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 space-y-4">
        {/* Profile summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {initials(demo.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{demo.displayName}</h2>
                  <Badge variant="muted">@{demo.username}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {demo.city} • {demo.distance}
                </p>
                <p className="mt-3 text-sm">{demo.bio}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
              <Stat label="Weekly goal" value={`${demo.weeklyGoal} mi`} />
              <Stat label="Current shoe" value={demo.shoe} />
              <Stat label="Clubs" value="1" />
            </div>
          </CardContent>
        </Card>

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
            <ConnectionRow name="Strava" note="Pull activities, routes, and maps" />
            <ConnectionRow
              name="TrainingPeaks"
              note="Sync your coach-built training plan"
            />
            <ConnectionRow
              name="Final Surge"
              note="Sync your coach-built training plan"
            />
          </CardContent>
        </Card>

        {/* Settings */}
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ConnectionRow({ name, note }: { name: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
      <Badge variant="muted">Not connected</Badge>
    </div>
  );
}
