/**
 * Route generation engine.
 *
 * The contract: given a start point, a target distance, a route shape
 * (loop / out-and-back / point-to-point), and optional preferences,
 * return 3 candidate routes sorted by how well they match the target.
 *
 * Algorithm:
 *   1. For loops — generate waypoints radiating out from start at
 *      varying angles (every 60°). For each triplet of angles, request
 *      a 3-waypoint route that forms a rough loop and measure distance.
 *   2. For out-and-back — pick a single direction, request a route
 *      halfway out, double it.
 *   3. For point-to-point — standard A→B.
 *   4. Iteratively adjust waypoint distance until route length is
 *      within 2% of target. Cap at 5 iterations per candidate.
 *   5. Rank candidates by distance delta; return top 3.
 *
 * For the non-live-Mapbox case (no token), we generate a synthetic
 * circular "route" around the start point so the UI still works.
 */

import {
  fetchDirections,
  hasMapboxToken,
  sampleElevations,
  type DirectionsResult,
  type DirectionsStep,
} from "@/lib/mapbox";
import {
  buildElevationProfile,
  downsampleCoords,
  type ElevationProfile,
} from "@/lib/elevation";

const MILES_TO_METERS = 1609.344;
const EARTH_RADIUS_M = 6371000;

export interface GenerateRouteInput {
  start: { lat: number; lng: number };
  target_distance_miles: number;
  route_type: "loop" | "out_and_back" | "point_to_point";
  end?: { lat: number; lng: number } | null; // only for point_to_point
  terrain_preference: "flat" | "rolling" | "hilly" | "no_preference";
  surface_type: "road" | "trail" | "mixed" | "track";
}

export interface RouteCandidate {
  title: string;
  actual_distance_miles: number;
  geometry: GeoJSON.LineString;
  elevation: ElevationProfile;
  turn_by_turn: DirectionsStep[];
  score: number; // 0 = perfect match, higher = worse
}

/**
 * Move a point by `distance_m` meters in the given `bearing_deg`.
 * Used to place waypoints around a start point.
 */
function moveByBearing(
  lat: number,
  lng: number,
  distance_m: number,
  bearing_deg: number,
): [number, number] {
  const bearing = (bearing_deg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angular = distance_m / EARTH_RADIUS_M;

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(angular) +
      Math.cos(latRad) * Math.sin(angular) * Math.cos(bearing),
  );
  const newLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(latRad),
      Math.cos(angular) - Math.sin(latRad) * Math.sin(newLat),
    );

  return [(newLng * 180) / Math.PI, (newLat * 180) / Math.PI];
}

/**
 * Generate one loop candidate. A loop is made of 3 waypoints at
 * angles (baseBearing, baseBearing+120°, baseBearing+240°), each at
 * roughly target/3 radius from start. We iteratively adjust the
 * radius until total distance converges on target.
 */
async function generateLoopCandidate(
  input: GenerateRouteInput,
  baseBearing: number,
): Promise<DirectionsResult> {
  const targetMeters = input.target_distance_miles * MILES_TO_METERS;
  // Initial radius: a loop through 3 waypoints is ~3 * √3 * radius
  // for an equilateral triangle, so radius ≈ target / (3√3) ≈ target * 0.192
  let radius = targetMeters * 0.2;
  let result: DirectionsResult | null = null;

  for (let i = 0; i < 5; i++) {
    const wp1 = moveByBearing(
      input.start.lat,
      input.start.lng,
      radius,
      baseBearing,
    );
    const wp2 = moveByBearing(
      input.start.lat,
      input.start.lng,
      radius,
      baseBearing + 120,
    );
    const wp3 = moveByBearing(
      input.start.lat,
      input.start.lng,
      radius,
      baseBearing + 240,
    );

    result = await fetchDirections([
      [input.start.lng, input.start.lat],
      wp1,
      wp2,
      wp3,
      [input.start.lng, input.start.lat], // close the loop
    ]);

    const diff = result.distance_m - targetMeters;
    const percentErr = Math.abs(diff) / targetMeters;
    if (percentErr < 0.02) break; // within 2% = done
    radius *= targetMeters / result.distance_m;
  }

  if (!result) throw new Error("Loop generation failed.");
  return result;
}

/** Generate an out-and-back: pick a bearing, push out ~half the target, double back. */
async function generateOutAndBackCandidate(
  input: GenerateRouteInput,
  bearing: number,
): Promise<DirectionsResult> {
  const targetMeters = input.target_distance_miles * MILES_TO_METERS;
  let radius = targetMeters * 0.5;
  let result: DirectionsResult | null = null;

  for (let i = 0; i < 5; i++) {
    const turnaround = moveByBearing(
      input.start.lat,
      input.start.lng,
      radius,
      bearing,
    );
    result = await fetchDirections([
      [input.start.lng, input.start.lat],
      turnaround,
      [input.start.lng, input.start.lat],
    ]);

    const diff = result.distance_m - targetMeters;
    const percentErr = Math.abs(diff) / targetMeters;
    if (percentErr < 0.02) break;
    radius *= targetMeters / result.distance_m;
  }

  if (!result) throw new Error("Out-and-back generation failed.");
  return result;
}

/** Point-to-point — single directions request. */
async function generatePointToPointCandidate(
  input: GenerateRouteInput,
): Promise<DirectionsResult> {
  if (!input.end) throw new Error("End point required for point-to-point.");
  return await fetchDirections([
    [input.start.lng, input.start.lat],
    [input.end.lng, input.end.lat],
  ]);
}

/**
 * Score a candidate — lower is better.
 * Factors:
 *   - Distance delta (weighted heaviest)
 *   - Terrain match penalty (flat preference dislikes elevation gain)
 */
function scoreCandidate(
  actual_miles: number,
  target_miles: number,
  gain_ft: number,
  terrain: GenerateRouteInput["terrain_preference"],
): number {
  let score = Math.abs(actual_miles - target_miles) / target_miles;
  const gainPerMile = gain_ft / Math.max(actual_miles, 0.1);

  if (terrain === "flat" && gainPerMile > 50) {
    score += (gainPerMile - 50) / 200;
  } else if (terrain === "hilly" && gainPerMile < 100) {
    score += (100 - gainPerMile) / 200;
  }

  return score;
}

/**
 * Enrich a raw directions result with an elevation profile and score.
 * Extracted so we can apply it uniformly across route types.
 */
async function enrichCandidate(
  result: DirectionsResult,
  input: GenerateRouteInput,
  title: string,
): Promise<RouteCandidate> {
  const coords = result.geometry.coordinates as Array<[number, number]>;
  const samples = downsampleCoords(coords, 50);
  const elevationsM = await sampleElevations(samples);
  const elevation = buildElevationProfile(samples, elevationsM);

  const actualMiles = result.distance_m / MILES_TO_METERS;
  return {
    title,
    actual_distance_miles: Math.round(actualMiles * 100) / 100,
    geometry: result.geometry,
    elevation,
    turn_by_turn: result.steps,
    score: scoreCandidate(
      actualMiles,
      input.target_distance_miles,
      elevation.gain_ft,
      input.terrain_preference,
    ),
  };
}

/**
 * Top-level entry: returns the 3 best candidates for the input.
 */
export async function generateRouteCandidates(
  input: GenerateRouteInput,
): Promise<RouteCandidate[]> {
  if (!hasMapboxToken()) {
    return generateMockCandidates(input);
  }

  const candidates: RouteCandidate[] = [];

  if (input.route_type === "loop") {
    // Try 3 starting bearings: N, E, S (W would mirror E so we skip it).
    const bearings = [0, 90, 180];
    const results = await Promise.allSettled(
      bearings.map((b) => generateLoopCandidate(input, b)),
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        const enriched = await enrichCandidate(
          r.value,
          input,
          `Option ${String.fromCharCode(65 + i)} — Loop`,
        );
        candidates.push(enriched);
      }
    }
  } else if (input.route_type === "out_and_back") {
    const bearings = [0, 90, 180];
    const results = await Promise.allSettled(
      bearings.map((b) => generateOutAndBackCandidate(input, b)),
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        const enriched = await enrichCandidate(
          r.value,
          input,
          `Option ${String.fromCharCode(65 + i)} — Out & Back`,
        );
        candidates.push(enriched);
      }
    }
  } else {
    const result = await generatePointToPointCandidate(input);
    const enriched = await enrichCandidate(result, input, "Direct route");
    candidates.push(enriched);
  }

  // Sort by score ascending and take top 3.
  candidates.sort((a, b) => a.score - b.score);
  return candidates.slice(0, 3);
}

/**
 * Fallback when there's no Mapbox token — generate synthetic loops
 * so the UI still demonstrates the experience.
 */
function generateMockCandidates(input: GenerateRouteInput): RouteCandidate[] {
  const out: RouteCandidate[] = [];
  const variants = [
    { name: "Flat loop", gainPerMi: 20, distanceMult: 1.0 },
    { name: "Rolling loop", gainPerMi: 65, distanceMult: 1.02 },
    { name: "Hilly loop", gainPerMi: 140, distanceMult: 0.98 },
  ];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const targetMeters = input.target_distance_miles * MILES_TO_METERS * v.distanceMult;
    const radius = targetMeters * 0.2;

    // Build a 16-point synthetic circle.
    const coords: Array<[number, number]> = [];
    for (let j = 0; j <= 16; j++) {
      const angle = (j / 16) * 360 + i * 30;
      coords.push(
        moveByBearing(input.start.lat, input.start.lng, radius, angle),
      );
    }

    // Synthetic elevation profile with the target gain/mile.
    const points = coords.map((_, idx) => ({
      distance_mi: (idx / 16) * input.target_distance_miles * v.distanceMult,
      elevation_ft:
        Math.round(100 + Math.sin((idx / 16) * Math.PI * 2) * (v.gainPerMi / 2)),
    }));

    const gain = points.reduce((sum, p, idx) => {
      if (idx === 0) return sum;
      const delta = p.elevation_ft - points[idx - 1].elevation_ft;
      return sum + (delta > 0 ? delta : 0);
    }, 0);

    out.push({
      title: `${v.name}`,
      actual_distance_miles: Math.round(input.target_distance_miles * v.distanceMult * 100) / 100,
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      elevation: {
        points,
        gain_ft: Math.round(gain),
        loss_ft: Math.round(gain),
        max_ft: Math.max(...points.map((p) => p.elevation_ft)),
        min_ft: Math.min(...points.map((p) => p.elevation_ft)),
      },
      turn_by_turn: [],
      score: Math.abs(v.distanceMult - 1),
    });
  }

  return out;
}
