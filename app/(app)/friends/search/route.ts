import { NextResponse } from "next/server";
import { searchProfiles } from "@/lib/queries/friendships";

/**
 * Typeahead endpoint for the Friends tab search input.
 * Returns public profiles whose username starts with `q`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ profiles: [] });
  }

  const profiles = await searchProfiles(query);
  return NextResponse.json({ profiles });
}
