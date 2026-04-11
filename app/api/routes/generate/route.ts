import { NextResponse } from "next/server";
import { generateRouteCandidates, type GenerateRouteInput } from "@/lib/routes";

/**
 * Route generation endpoint. POST { start, target_distance_miles, ... }
 * → { candidates: RouteCandidate[] }.
 *
 * Called by the client-side route generator form. Wraps
 * `generateRouteCandidates`, which handles the Mapbox-or-mock fallback.
 *
 * TODO(phase 2D+): rate-limit to 10 generations per user per day to
 * keep Mapbox API costs predictable.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRouteInput;

    if (!body.start || typeof body.target_distance_miles !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: start and target_distance_miles." },
        { status: 400 },
      );
    }
    if (body.target_distance_miles < 0.5 || body.target_distance_miles > 50) {
      return NextResponse.json(
        { error: "Target distance must be between 0.5 and 50 miles." },
        { status: 400 },
      );
    }

    const candidates = await generateRouteCandidates(body);
    return NextResponse.json({ candidates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
