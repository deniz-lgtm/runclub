import { NextResponse } from "next/server";
import { fetchDirections } from "@/lib/mapbox";

/**
 * Incremental walking-profile segment routing.
 *
 * Used by the interactive route builder: the client sends
 * { from: [lng, lat], to: [lng, lat] } each time the user clicks a
 * new waypoint on the map, and we return the walking route between
 * those two points (the actual path that follows roads / trails).
 *
 * The client then appends the returned segment to the growing route
 * in local state. This is intentionally simpler than
 * /api/routes/generate — no candidate ranking, no elevation (we
 * sample that at save time on the merged route), just the segment.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      from: [number, number];
      to: [number, number];
    };

    if (
      !Array.isArray(body.from) ||
      body.from.length !== 2 ||
      !Array.isArray(body.to) ||
      body.to.length !== 2
    ) {
      return NextResponse.json(
        { error: "Expected { from: [lng, lat], to: [lng, lat] }" },
        { status: 400 },
      );
    }

    const result = await fetchDirections([body.from, body.to]);

    return NextResponse.json({
      distance_m: result.distance_m,
      duration_s: result.duration_s,
      geometry: result.geometry,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
