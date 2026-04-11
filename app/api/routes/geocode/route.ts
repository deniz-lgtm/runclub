import { NextResponse } from "next/server";
import { forwardGeocode } from "@/lib/mapbox";

/**
 * Forward-geocode endpoint for the route generator + builder
 * location picker. Accepts ?q=<query> and returns up to 5 Mapbox
 * search results.
 *
 * We proxy server-side so the Mapbox token stays off the client
 * and so we can layer rate limiting later without touching the UI.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await forwardGeocode(query);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocode failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
