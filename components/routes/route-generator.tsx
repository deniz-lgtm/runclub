"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RouteMap } from "./route-map";
import { ElevationChart } from "./elevation-chart";
import { LocationPicker, type PickedLocation } from "./location-picker";
import { saveRoute } from "@/app/(app)/routes/actions";
import type { RouteCandidate } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface RouteGeneratorProps {
  mapboxPublicToken: string | null;
  defaultDistance?: number;
  linkedWorkoutId?: string | null;
}

type RouteType = "loop" | "out_and_back" | "point_to_point";
type Terrain = "flat" | "rolling" | "hilly" | "no_preference";
type Surface = "road" | "trail" | "mixed" | "track";

/**
 * The big client-side interaction for Phase 2D.
 *
 * State machine:
 *   1. Collect form input (start point, distance, route type, terrain, surface, avoidances)
 *   2. POST /api/routes/generate → loading
 *   3. Render candidates with tabs, map preview, elevation chart
 *   4. Save selected candidate to the routes library
 */
export function RouteGenerator({
  mapboxPublicToken,
  defaultDistance = 5,
  linkedWorkoutId = null,
}: RouteGeneratorProps) {
  // Form state
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [distance, setDistance] = useState(defaultDistance);
  const [routeType, setRouteType] = useState<RouteType>("loop");
  const [terrain, setTerrain] = useState<Terrain>("no_preference");
  const [surface, setSurface] = useState<Surface>("road");
  const [avoidances, setAvoidances] = useState<string[]>([]);

  // Result state
  const [candidates, setCandidates] = useState<RouteCandidate[] | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);

  function toggleAvoidance(key: string) {
    setAvoidances((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function generate() {
    if (!location) {
      setError("Pick a start location first.");
      return;
    }
    setError(null);
    setLoading(true);
    setCandidates(null);
    setSavedId(null);

    try {
      const res = await fetch("/api/routes/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          start: { lat: location.lat, lng: location.lng },
          target_distance_miles: distance,
          route_type: routeType,
          terrain_preference: terrain,
          surface_type: surface,
          avoidances,
        }),
      });
      const json = (await res.json()) as {
        candidates?: RouteCandidate[];
        error?: string;
      };
      if (json.error) {
        setError(json.error);
      } else if (json.candidates?.length) {
        setCandidates(json.candidates);
        setSelectedIdx(0);
      } else {
        setError("No routes could be generated for these inputs.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!candidates || !location) return;
    const candidate = candidates[selectedIdx];

    startTransition(async () => {
      const result = await saveRoute({
        title: `${candidate.actual_distance_miles}mi ${routeType === "loop" ? "loop" : routeType === "out_and_back" ? "out & back" : "route"}`,
        candidate,
        start: { lat: location.lat, lng: location.lng, address: location.label },
        target_distance_miles: distance,
        route_type: routeType,
        terrain_preference: terrain,
        surface_type: surface,
        avoidances,
        linked_workout_id: linkedWorkoutId,
      });
      if (result?.error) {
        setError(result.error);
      } else if (result?.ok && "id" in result) {
        setSavedId(result.id as string);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input form */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <LocationPicker value={location} onChange={setLocation} />

          {/* Distance slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Target distance
              </label>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {distance.toFixed(1)} mi
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={26.2}
              step={0.1}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
          </div>

          {/* Route type */}
          <PillGroup
            label="Route shape"
            value={routeType}
            onChange={(v) => setRouteType(v as RouteType)}
            options={[
              { value: "loop", label: "Loop" },
              { value: "out_and_back", label: "Out & Back" },
              { value: "point_to_point", label: "P2P" },
            ]}
          />

          {/* Terrain */}
          <PillGroup
            label="Terrain"
            value={terrain}
            onChange={(v) => setTerrain(v as Terrain)}
            options={[
              { value: "flat", label: "Flat" },
              { value: "rolling", label: "Rolling" },
              { value: "hilly", label: "Hilly" },
              { value: "no_preference", label: "Any" },
            ]}
          />

          {/* Surface */}
          <PillGroup
            label="Surface"
            value={surface}
            onChange={(v) => setSurface(v as Surface)}
            options={[
              { value: "road", label: "Road" },
              { value: "trail", label: "Trail" },
              { value: "mixed", label: "Mixed" },
              { value: "track", label: "Track" },
            ]}
          />

          {/* Avoidances */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Avoid
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "highways", label: "Highways" },
                { key: "unpaved", label: "Unpaved" },
                { key: "stairs", label: "Stairs" },
                { key: "high_traffic", label: "High traffic" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleAvoidance(opt.key)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                    avoidances.includes(opt.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={generate}
            variant="flash"
            size="lg"
            disabled={loading || !location}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding your perfect route…
              </>
            ) : (
              "Generate route"
            )}
          </Button>
          {error && (
            <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Candidates */}
      {candidates && candidates.length > 0 && (
        <>
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-colors",
                  i === selectedIdx
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Option {String.fromCharCode(65 + i)}
                </div>
                <div className="mt-0.5 text-sm font-bold tabular-nums">
                  {c.actual_distance_miles} mi
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  ↑ {c.elevation.gain_ft}ft
                </div>
              </button>
            ))}
          </div>

          {/* Selected route detail */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div>
                <h3 className="text-base font-bold">
                  {candidates[selectedIdx].title}
                </h3>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">
                    {candidates[selectedIdx].actual_distance_miles} mi
                  </span>
                  <span>↑ {candidates[selectedIdx].elevation.gain_ft} ft</span>
                  <span>↓ {candidates[selectedIdx].elevation.loss_ft} ft</span>
                  <span>
                    max {candidates[selectedIdx].elevation.max_ft} ft
                  </span>
                </div>
              </div>

              {location && (
                <RouteMap
                  geometry={candidates[selectedIdx].geometry}
                  startLat={location.lat}
                  startLng={location.lng}
                  mapboxToken={mapboxPublicToken}
                />
              )}

              <ElevationChart
                points={candidates[selectedIdx].elevation.points}
                gain_ft={candidates[selectedIdx].elevation.gain_ft}
                loss_ft={candidates[selectedIdx].elevation.loss_ft}
                max_ft={candidates[selectedIdx].elevation.max_ft}
                min_ft={candidates[selectedIdx].elevation.min_ft}
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={savedId != null}
                >
                  {savedId ? "Saved ✓" : "Save route"}
                </Button>
                <Button variant="outline" onClick={generate}>
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PillGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-1.5 overflow-x-auto">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-md border px-3 py-1 text-[11px] font-semibold transition-colors",
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
