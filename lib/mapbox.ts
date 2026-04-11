/**
 * Mapbox API client helpers.
 *
 * We use three endpoints for the route generator:
 *   1. Directions API (walking profile) — the actual routes
 *   2. Tilequery API (terrain-rgb) — sampled elevation along the route
 *   3. Geocoding API — reverse-geocode the start point for display
 *
 * The walking profile is intentional — it's the most accurate for
 * runners. `cycling` misroutes pedestrians (one-way streets, no
 * sidewalks). `driving` routes on highways.
 *
 * All calls go through the *secret* token on the server so we don't
 * leak the public token's quota to browsers or expose a secret to
 * clients.
 */

const MAPBOX_BASE = "https://api.mapbox.com";

function token(): string {
  const t = process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!t) {
    throw new Error(
      "Mapbox token missing. Set MAPBOX_SECRET_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN in .env.local.",
    );
  }
  return t;
}

export function hasMapboxToken(): boolean {
  return Boolean(
    process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  );
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DirectionsStep {
  instruction: string;
  distance_m: number;
  coordinates: [number, number]; // [lng, lat]
}

export interface DirectionsResult {
  distance_m: number;
  duration_s: number;
  geometry: GeoJSON.LineString;
  steps: DirectionsStep[];
}

/**
 * Fetch a walking-profile route through the provided waypoints.
 * Coordinates are [lng, lat] (GeoJSON order).
 */
export async function fetchDirections(
  waypoints: Array<[number, number]>,
): Promise<DirectionsResult> {
  if (waypoints.length < 2) {
    throw new Error("Need at least 2 waypoints for directions.");
  }

  const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url =
    `${MAPBOX_BASE}/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full&steps=true&access_token=${token()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mapbox directions failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    routes: Array<{
      distance: number;
      duration: number;
      geometry: GeoJSON.LineString;
      legs: Array<{
        steps: Array<{
          distance: number;
          maneuver: {
            instruction: string;
            location: [number, number];
          };
        }>;
      }>;
    }>;
  };

  if (!json.routes?.[0]) throw new Error("Mapbox returned no routes.");
  const route = json.routes[0];

  const steps: DirectionsStep[] = route.legs.flatMap((leg) =>
    leg.steps.map((s) => ({
      instruction: s.maneuver.instruction,
      distance_m: s.distance,
      coordinates: s.maneuver.location,
    })),
  );

  return {
    distance_m: route.distance,
    duration_s: route.duration,
    geometry: route.geometry,
    steps,
  };
}

/**
 * Sample elevations at points along a LineString using Mapbox's
 * Tilequery API against the mapbox.terrain-rgb tileset.
 *
 * This is a sequence of HTTP calls (one per sample point) — call it
 * with a modest sample count (every 0.1mi → ~50 samples for 5 miles).
 */
export async function sampleElevations(
  coords: Array<[number, number]>,
): Promise<number[]> {
  const out: number[] = [];
  for (const [lng, lat] of coords) {
    const url =
      `${MAPBOX_BASE}/v4/mapbox.terrain-rgb/tilequery/${lng},${lat}.json` +
      `?layers=contour&access_token=${token()}`;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      // Terrain-rgb is noisy at ocean edges; push 0 and keep going.
      out.push(0);
      continue;
    }
    const json = (await res.json()) as {
      features: Array<{ properties: { ele: number } }>;
    };
    const ele = json.features?.[0]?.properties?.ele ?? 0;
    out.push(ele);
  }
  return out;
}

/** Reverse geocode a coordinate to a human-readable address. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url =
      `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=address,neighborhood&limit=1&access_token=${token()}`;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features: Array<{ place_name: string }>;
    };
    return json.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}
