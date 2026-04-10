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
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

/**
 * Connected apps settings.
 *
 * Shows the three integrations (Strava, TrainingPeaks, Final Surge) and
 * their connection state. Phase 4 / Phase 2E wire up the OAuth flows.
 * For now we derive the state from the token columns on the profile.
 */
export default async function ConnectionsPage() {
  const profile = await requireProfile();

  const connections = [
    {
      name: "Strava",
      note: "Activities, routes, heart rate, splits",
      connected: Boolean(profile.strava_athlete_id ?? false),
      phase: "Phase 4",
    },
    {
      name: "TrainingPeaks",
      note: "Sync your coach-built training plan",
      connected: Boolean(profile.tp_athlete_id ?? false),
      phase: "Phase 2E",
    },
    {
      name: "Final Surge",
      note: "Sync your coach-built training plan",
      connected: Boolean(profile.fs_athlete_id ?? false),
      phase: "Phase 2E",
    },
  ] as const;

  return (
    <>
      <PageHeader title="Connections" description="Sync Strava, TP, and Final Surge">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-3">
        {connections.map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{c.name}</CardTitle>
                {c.connected ? (
                  <Badge>Connected</Badge>
                ) : (
                  <Badge variant="muted">{c.phase}</Badge>
                )}
              </div>
              <CardDescription>{c.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                {c.connected ? "Manage" : `Connect ${c.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
