"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LocationPicker, type PickedLocation } from "./location-picker";
import { saveRoute } from "@/app/(app)/routes/actions";
import { Loader2, MapPin, Undo2, X, CornerDownRight } from "lucide-react";

/**
 * Manual route builder — OnTheGoMap-style.
 *
 * UX:
 *   1. Tap anywhere on the map → drop a start waypoint
 *   2. Tap again → we fetch a walking-profile segment from the last
 *      waypoint to the new click and append it to the route line
 *   3. Repeat until you like the route
 *   4. Optionally close the loop (routes back to start)
 *   5. Save → writes to generated_routes with the merged geometry
 *
 * Implementation notes:
 *   - Mapbox GL JS is dynamically imported so it doesn't balloon the
 *     initial bundle.
 *   - We keep two parallel arrays: `waypoints` (the ordered clicks)
 *     and `segments` (the walking paths between them). Undo pops the
 *     last pair atomically.
 *   - Elevation is sampled *once* on save to keep clicks cheap —
 *     reuses the same /api/routes/generate sampling logic by shipping
 *     a fake candidate through saveRoute.
 */

interface Waypoint {
  id: string;
  lng: number;
  lat: number;
}

interface Segment {
  from_id: string;
  to_id: string;
  distance_m: number;
  geometry: GeoJSON.LineString;
}

interface RouteBuilderProps {
  mapboxPublicToken: string | null;
}

const METERS_TO_MI = 0.000621371;

export function RouteBuilder({ mapboxPublicToken }: RouteBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null); // mapboxgl.Map
  const mapboxglRef = useRef<unknown>(null); // mapboxgl namespace
  const markersRef = useRef<unknown[]>([]); // mapboxgl.Marker[]

  const [mapReady, setMapReady] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [jumpLocation, setJumpLocation] = useState<PickedLocation | null>(null);

  // Refs that mirror state so the map click handler (which is bound
  // once) can always see the latest value.
  const waypointsRef = useRef(waypoints);
  const segmentsRef = useRef(segments);
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // ──────────────────────────────────────────────────────────────────
  // Map init
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapboxPublicToken || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapboxgl = (await import("mapbox-gl" as any)).default;
      await import("mapbox-gl/dist/mapbox-gl.css" as any);
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = mapboxPublicToken;
      mapboxglRef.current = mapboxgl;

      // Default to the user's current location if geolocation is granted;
      // otherwise fall back to a reasonable US-center view.
      const initialCenter: [number, number] = [-118.2437, 34.0522]; // LA
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: initialCenter,
        zoom: 12,
      });
      mapRef.current = map;

      map.on("load", () => {
        // Source + layer for the growing route line
        map.addSource("route-line", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#FF5A1F",
            "line-width": 4,
          },
        });

        setMapReady(true);

        // Try to center on the user's actual location.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.flyTo({
                center: [pos.coords.longitude, pos.coords.latitude],
                zoom: 14,
                essential: true,
              });
            },
            () => {
              // silently fall back to LA
            },
          );
        }
      });

      // Click handler — add a waypoint and auto-route to it.
      map.on("click", (e: { lngLat: { lng: number; lat: number } }) => {
        const newWaypoint: Waypoint = {
          id: crypto.randomUUID(),
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        };
        handleNewWaypoint(newWaypoint);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current && typeof mapRef.current === "object") {
        (mapRef.current as { remove?: () => void }).remove?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxPublicToken]);

  // ──────────────────────────────────────────────────────────────────
  // Jump map to picked location when the LocationPicker changes
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !jumpLocation) return;
    const map = mapRef.current as {
      flyTo: (opts: {
        center: [number, number];
        zoom?: number;
        essential?: boolean;
      }) => void;
    };
    map.flyTo({
      center: [jumpLocation.lng, jumpLocation.lat],
      zoom: 14,
      essential: true,
    });
  }, [jumpLocation, mapReady]);

  // ──────────────────────────────────────────────────────────────────
  // Render waypoint markers on the map
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxglRef.current) return;
    const mapboxgl = mapboxglRef.current as {
      Marker: new (opts: { element: HTMLElement }) => {
        setLngLat: (c: [number, number]) => {
          addTo: (m: unknown) => { remove: () => void };
        };
      };
    };

    // Clear old markers
    for (const m of markersRef.current) {
      (m as { remove?: () => void }).remove?.();
    }
    markersRef.current = [];

    // Redraw
    waypoints.forEach((wp, idx) => {
      const el = document.createElement("div");
      el.style.cssText = [
        "width:22px",
        "height:22px",
        "border-radius:2px",
        "background:#0A0A0A",
        "color:#FFFFFF",
        "border:2px solid #FF5A1F",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "font-family:ui-monospace, 'JetBrains Mono', monospace",
        "font-size:10px",
        "font-weight:800",
        "letter-spacing:-0.02em",
        "cursor:pointer",
      ].join(";");
      el.textContent = String(idx + 1).padStart(2, "0");

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([wp.lng, wp.lat])
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [waypoints, mapReady]);

  // ──────────────────────────────────────────────────────────────────
  // Update the route line on the map when segments change
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current as {
      getSource: (id: string) => { setData: (data: unknown) => void } | null;
    };
    const source = map.getSource("route-line");
    if (!source) return;

    const features = segments.map((s) => ({
      type: "Feature",
      properties: {},
      geometry: s.geometry,
    }));

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [segments, mapReady]);

  // ──────────────────────────────────────────────────────────────────
  // Waypoint click logic
  // ──────────────────────────────────────────────────────────────────
  async function handleNewWaypoint(wp: Waypoint) {
    setError(null);
    setSaved(false);
    const prev = waypointsRef.current;

    // First click — just drop the pin, no routing yet
    if (prev.length === 0) {
      setWaypoints([wp]);
      return;
    }

    // Otherwise fetch a walking segment from the last waypoint → wp
    const last = prev[prev.length - 1];
    setLoading(true);
    try {
      const res = await fetch("/api/routes/directions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from: [last.lng, last.lat],
          to: [wp.lng, wp.lat],
        }),
      });
      const json = (await res.json()) as {
        distance_m?: number;
        geometry?: GeoJSON.LineString;
        error?: string;
      };
      if (json.error) throw new Error(json.error);
      if (!json.geometry || json.distance_m == null) {
        throw new Error("Bad response from directions API");
      }

      setWaypoints([...prev, wp]);
      setSegments([
        ...segmentsRef.current,
        {
          from_id: last.id,
          to_id: wp.id,
          distance_m: json.distance_m,
          geometry: json.geometry,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Routing failed.");
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Controls
  // ──────────────────────────────────────────────────────────────────
  function handleUndo() {
    if (waypoints.length === 0) return;
    setSaved(false);
    setError(null);
    setWaypoints((prev) => prev.slice(0, -1));
    setSegments((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setSaved(false);
    setError(null);
    setWaypoints([]);
    setSegments([]);
  }

  async function handleCloseLoop() {
    if (waypoints.length < 2) return;
    setError(null);
    setLoading(true);
    try {
      const last = waypoints[waypoints.length - 1];
      const first = waypoints[0];
      const res = await fetch("/api/routes/directions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from: [last.lng, last.lat],
          to: [first.lng, first.lat],
        }),
      });
      const json = (await res.json()) as {
        distance_m?: number;
        geometry?: GeoJSON.LineString;
        error?: string;
      };
      if (json.error) throw new Error(json.error);
      if (!json.geometry || json.distance_m == null) {
        throw new Error("Bad response from directions API");
      }

      // Don't add a new waypoint — it would be a duplicate of #01.
      // Just append the closing segment.
      setSegments([
        ...segments,
        {
          from_id: last.id,
          to_id: first.id,
          distance_m: json.distance_m,
          geometry: json.geometry,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Close loop failed.");
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Derived state
  // ──────────────────────────────────────────────────────────────────
  const totalDistanceMi =
    segments.reduce((sum, s) => sum + s.distance_m, 0) * METERS_TO_MI;

  // Merged geometry — concatenate all segment coordinates.
  // We drop the first coord of each subsequent segment because it's
  // the same as the last coord of the previous one.
  const mergedCoords: Array<[number, number]> = segments.reduce(
    (acc, s, i) => {
      const coords = s.geometry.coordinates as Array<[number, number]>;
      if (i === 0) return coords.slice();
      return [...acc, ...coords.slice(1)];
    },
    [] as Array<[number, number]>,
  );

  const mergedGeometry: GeoJSON.LineString = {
    type: "LineString",
    coordinates: mergedCoords,
  };

  const isLoop =
    waypoints.length >= 2 &&
    segments.length >= waypoints.length; // last segment closes back to start

  // ──────────────────────────────────────────────────────────────────
  // Save
  // ──────────────────────────────────────────────────────────────────
  function handleSave() {
    if (waypoints.length < 2 || segments.length === 0) return;
    startTransition(async () => {
      setError(null);
      const first = waypoints[0];
      // We ship a minimal candidate — the save action handles the
      // database write. Elevation is stored as null; the detail page
      // still renders a map + stats. Full elevation sampling on
      // save would take another ~2s of Mapbox calls, so we defer
      // that to the route detail page view if needed.
      const result = await saveRoute({
        title: `${totalDistanceMi.toFixed(1)}mi custom ${isLoop ? "loop" : "route"}`,
        candidate: {
          title: "custom",
          actual_distance_miles: Math.round(totalDistanceMi * 100) / 100,
          geometry: mergedGeometry,
          elevation: {
            points: [],
            gain_ft: 0,
            loss_ft: 0,
            max_ft: 0,
            min_ft: 0,
          },
          turn_by_turn: [],
          score: 0,
        },
        start: { lat: first.lat, lng: first.lng },
        target_distance_miles: Math.round(totalDistanceMi * 100) / 100,
        route_type: isLoop ? "loop" : "point_to_point",
        surface_type: "road",
        terrain_preference: "no_preference",
        avoidances: [],
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // No-mapbox fallback
  // ──────────────────────────────────────────────────────────────────
  if (!mapboxPublicToken) {
    return (
      <div className="rounded-sm border border-dashed border-ink/30 bg-surface p-5 text-center">
        <div className="label-bib mb-2">Mapbox required</div>
        <p className="text-sm leading-snug text-ink-muted">
          The custom route builder needs a Mapbox token to render the map
          and auto-route between waypoints. Add{" "}
          <code className="rounded-xs bg-bone-soft px-1">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to your environment variables and redeploy.
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Intro strip */}
      <div className="rounded-sm border border-ink/10 bg-surface p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-flash" />
          <span className="label-bib">Tap the map to build</span>
        </div>
        <p className="mt-1 text-xs leading-snug text-ink-muted">
          Each tap drops a waypoint. We auto-route along the walking
          path from the last waypoint to the new one. Jump to any
          city or address below to plan a run anywhere.
        </p>
      </div>

      {/* Location picker — jumps the map to any searched location */}
      <div className="rounded-sm border border-ink/10 bg-surface p-3">
        <LocationPicker
          value={jumpLocation}
          onChange={setJumpLocation}
          placeholder="Jump to a city or address…"
        />
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="h-[60vh] w-full overflow-hidden rounded-sm border border-ink/10 bg-bone-soft"
      />

      {/* Totals bar */}
      <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-sm border border-ink">
        <Stat label="Distance" value={totalDistanceMi.toFixed(2)} unit="MI" />
        <Stat label="Points" value={String(waypoints.length)} border />
        <Stat
          label="Shape"
          value={isLoop ? "LOOP" : waypoints.length >= 2 ? "OPEN" : "—"}
          border
          small
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={waypoints.length === 0 || loading}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCloseLoop}
          disabled={waypoints.length < 2 || isLoop || loading}
        >
          <CornerDownRight className="h-3.5 w-3.5" />
          Close loop
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClear}
          disabled={waypoints.length === 0 || loading}
          className="text-siren hover:bg-siren/5 hover:text-siren"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="flash"
          onClick={handleSave}
          disabled={waypoints.length < 2 || loading || pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            "Saved ✓"
          ) : (
            "Save route"
          )}
        </Button>
      </div>

      {loading && (
        <p className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          Routing…
        </p>
      )}
      {error && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {error}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  border,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  border?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`p-3 ${border ? "border-l border-ink" : ""} bg-surface`}
    >
      <div className="text-[8px] font-bold uppercase tracking-bib text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={`font-display font-black leading-none tracking-tightest tabular-nums text-ink ${small ? "text-sm" : "text-2xl"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9px] font-bold uppercase text-ink-muted">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
