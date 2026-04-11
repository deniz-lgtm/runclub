import Link from "next/link";
import { headers } from "next/headers";
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
import { DisconnectButton } from "@/components/profile/disconnect-button";
import { requireProfile } from "@/lib/auth";
import { buildStravaAuthUrl, hasStravaCredentials } from "@/lib/strava";
import { buildTPAuthUrl, hasTPCredentials } from "@/lib/trainingpeaks";
import { buildFSAuthUrl, hasFSCredentials } from "@/lib/finalsurge";
import { ChevronLeft } from "lucide-react";

/**
 * Connected apps settings page.
 *
 * Shows three connection cards (Strava, TrainingPeaks, Final Surge)
 * with real Connect buttons that build each provider's OAuth URL.
 * Tokens are stored on the profile row; the presence of athlete_id
 * is the "connected" signal.
 */
export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const profile = await requireProfile();

  const origin = `${headers().get("x-forwarded-proto") ?? "http"}://${headers().get("host") ?? "localhost:3000"}`;

  const stravaConnected = Boolean(
    (profile as { strava_athlete_id?: string | null }).strava_athlete_id,
  );
  const tpConnected = Boolean(
    (profile as { tp_access_token?: string | null }).tp_access_token,
  );
  const fsConnected = Boolean(
    (profile as { fs_access_token?: string | null }).fs_access_token,
  );

  const stravaAuthUrl = hasStravaCredentials()
    ? buildStravaAuthUrl(`${origin}/api/strava/callback`, "fwr")
    : null;
  const tpAuthUrl = hasTPCredentials()
    ? buildTPAuthUrl(`${origin}/api/trainingpeaks/callback`, "fwr")
    : null;
  const fsAuthUrl = hasFSCredentials()
    ? buildFSAuthUrl(`${origin}/api/finalsurge/callback`, "fwr")
    : null;

  return (
    <>
      <PageHeader
        title="Connections"
        description="Sync Strava, TrainingPeaks, and Final Surge."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-3">
        {/* Success / error banners */}
        {searchParams.strava === "connected" && (
          <Banner type="success">Strava connected successfully.</Banner>
        )}
        {searchParams.tp === "connected" && (
          <Banner type="success">TrainingPeaks connected successfully.</Banner>
        )}
        {searchParams.fs === "connected" && (
          <Banner type="success">Final Surge connected successfully.</Banner>
        )}
        {(searchParams.strava_error ||
          searchParams.tp_error ||
          searchParams.fs_error) && (
          <Banner type="error">
            Connection failed:{" "}
            {searchParams.strava_error ||
              searchParams.tp_error ||
              searchParams.fs_error}
          </Banner>
        )}

        {/* Strava */}
        <ConnectionCard
          name="Strava"
          note="Pull activities, routes, maps, and heart rate"
          connected={stravaConnected}
          authUrl={stravaAuthUrl}
          service="strava"
          phase="Phase 4"
        />

        {/* TrainingPeaks */}
        <ConnectionCard
          name="TrainingPeaks"
          note="Sync your coach-built plan"
          connected={tpConnected}
          authUrl={tpAuthUrl}
          service="tp"
          phase="Phase 2E"
        />

        {/* Final Surge */}
        <ConnectionCard
          name="Final Surge"
          note="Sync your coach-built plan"
          connected={fsConnected}
          authUrl={fsAuthUrl}
          service="fs"
          phase="Phase 2E"
        />

        <p className="px-1 text-[11px] text-muted-foreground">
          Connections require each service's client ID + secret to be set in{" "}
          <code>.env.local</code>. Until then, the connect buttons will
          show &ldquo;Set up required&rdquo;.
        </p>
      </div>
    </>
  );
}

function ConnectionCard({
  name,
  note,
  connected,
  authUrl,
  service,
  phase,
}: {
  name: string;
  note: string;
  connected: boolean;
  authUrl: string | null;
  service: "strava" | "tp" | "fs";
  phase: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          {connected ? (
            <Badge>Connected</Badge>
          ) : (
            <Badge variant="muted">{phase}</Badge>
          )}
        </div>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <DisconnectButton service={service} />
        ) : authUrl ? (
          <Button asChild className="w-full">
            <a href={authUrl}>Connect {name}</a>
          </Button>
        ) : (
          <Button disabled variant="outline" className="w-full">
            Set up required
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Banner({
  type,
  children,
}: {
  type: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-lg border px-4 py-3 text-xs " +
        (type === "success"
          ? "border-secondary/30 bg-secondary/5 text-secondary"
          : "border-destructive/30 bg-destructive/5 text-destructive")
      }
    >
      {children}
    </div>
  );
}
