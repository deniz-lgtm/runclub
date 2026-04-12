"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/routes/route-map";
import type { WorkoutType } from "@/lib/types";
import {
  Play,
  ExternalLink,
  Watch,
  Mountain,
  Route as RouteIcon,
} from "lucide-react";

interface RouteInfo {
  title: string | null;
  geometry: GeoJSON.LineString | null;
  startLat: number;
  startLng: number;
  elevationGainFt: number | null;
  distanceMiles: number;
}

interface StartRunClientProps {
  workoutId: string;
  workoutType: WorkoutType;
  targetDistance: number | null;
  route: RouteInfo | null;
  mapboxToken: string | null;
}

/**
 * Client-side portion of the Start Run screen.
 *
 * Renders:
 *  - Route map (if a matching route exists)
 *  - Quick-start tips for the workout type
 *  - Deep-link buttons to Strava and Apple Watch
 *  - Fallback "log manually after" link
 */
export function StartRunClient({
  workoutId,
  workoutType,
  targetDistance,
  route,
  mapboxToken,
}: StartRunClientProps) {
  const [started, setStarted] = useState(false);

  const tips = getTips(workoutType, targetDistance);

  return (
    <div className="space-y-4">
      {/* Route map */}
      {route?.geometry && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink">
              Route
            </h3>
            {route.title && (
              <span className="text-xs text-muted-foreground">
                {route.title}
              </span>
            )}
          </div>
          <RouteMap
            geometry={route.geometry}
            startLat={route.startLat}
            startLng={route.startLng}
            mapboxToken={mapboxToken}
          />
          <div className="flex gap-3 text-xs text-muted-foreground">
            {route.distanceMiles != null && (
              <span className="inline-flex items-center gap-1">
                <RouteIcon className="h-3 w-3" />
                {route.distanceMiles.toFixed(1)} mi
              </span>
            )}
            {route.elevationGainFt != null && (
              <span className="inline-flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                {Math.round(route.elevationGainFt)} ft gain
              </span>
            )}
          </div>
        </div>
      )}

      {/* No route — show link to find one */}
      {!route && targetDistance != null && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">No route selected</p>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <Link
              href={`/routes?distance=${targetDistance}&workoutId=${workoutId}`}
            >
              <RouteIcon className="h-3 w-3" /> Find a route
            </Link>
          </Button>
        </div>
      )}

      {/* Workout tips */}
      {tips && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink">
            Game plan
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {tips}
          </p>
        </div>
      )}

      {/* Start run actions */}
      {!started ? (
        <div className="space-y-3">
          {/* Primary: Open Strava */}
          <Button
            variant="flash"
            size="lg"
            className="w-full"
            onClick={() => {
              setStarted(true);
              // Strava deep link to start a recording.
              // On iOS, strava:// opens the app. The record screen
              // is the default landing when the app opens.
              window.location.href = "strava://record";
            }}
          >
            <Play className="h-4 w-4" />
            Start run in Strava
          </Button>

          {/* Secondary: Apple Watch native workout */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setStarted(true);
              // On iOS, this deep link opens the Workout app.
              // If the user has an Apple Watch paired, starting
              // a workout on the phone mirrors to the watch.
              window.location.href = "workout://";
            }}
          >
            <Watch className="h-4 w-4" />
            Start on Apple Watch
          </Button>

          <p className="text-center text-[10px] text-muted-foreground">
            Start your run using your preferred tracker. When you finish,
            your activity will sync back automatically via Strava.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border border-secondary/30 bg-secondary/5 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15">
            <Play className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Run started!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your tracker should be recording. When you&apos;re done, your
              activity will auto-sync back to this workout via Strava.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workout/${workoutId}`}>
                <ExternalLink className="h-3 w-3" /> Back to workout
              </Link>
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-ink"
              onClick={() => setStarted(false)}
            >
              Didn&apos;t open? Try again
            </button>
          </div>
        </div>
      )}

      {/* Manual log fallback */}
      <div className="text-center">
        <Link
          href={`/workout/${workoutId}`}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-ink"
        >
          Skip — I&apos;ll log it manually after
        </Link>
      </div>
    </div>
  );
}

/**
 * Quick coaching tips based on workout type.
 */
function getTips(type: WorkoutType, distance: number | null): string | null {
  switch (type) {
    case "easy":
      return "Keep it conversational. You should be able to hold a full conversation the entire time. If in doubt, slow down.";
    case "long_run":
      return `${distance ? `${distance} miles today — ` : ""}start easy and settle into a rhythm. Take water if it's warm. Save the last 10% for a strong finish.`;
    case "tempo":
      return "Warm up for 10-15 minutes, then hold a comfortably hard pace — about 80-85% effort. You can speak in short phrases but not full sentences.";
    case "intervals":
      return "Warm up thoroughly before the first rep. Hit your target pace on each interval, and jog easy between reps. Focus on form when you're tired.";
    case "hills":
      return "Shorten your stride on the uphills, lean slightly forward, and drive with your arms. Use the downhills to recover. Stay relaxed.";
    case "recovery":
      return "Truly easy today. This run is for blood flow, not fitness. If it feels too slow, you're doing it right.";
    case "race":
      return "Race day! Stick to your plan for the first half. Trust your training and don't go out too fast. You've got this.";
    case "cross_training":
      return "Focus on complementary movement. Keep the intensity moderate and enjoy doing something different.";
    default:
      return null;
  }
}
