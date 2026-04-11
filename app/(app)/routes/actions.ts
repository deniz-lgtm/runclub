"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RouteCandidate } from "@/lib/routes";

interface SaveRouteInput {
  title: string;
  candidate: RouteCandidate;
  start: { lat: number; lng: number; address?: string | null };
  target_distance_miles: number;
  route_type: "loop" | "out_and_back" | "point_to_point";
  surface_type: "road" | "trail" | "mixed" | "track";
  terrain_preference: "flat" | "rolling" | "hilly" | "no_preference";
  avoidances: string[];
  linked_workout_id?: string | null;
  is_public?: boolean;
}

/**
 * Persist a generated route to the generated_routes table.
 *
 * RLS ensures the row is keyed to the current user. The geometry is
 * stored as both PostGIS (for spatial queries) and GeoJSON (for easy
 * client-side rendering).
 */
export async function saveRoute(input: SaveRouteInput) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { candidate } = input;

  const { data, error } = await supabase
    .from("generated_routes")
    .insert({
      user_id: user.id,
      title: input.title,
      start_latitude: input.start.lat,
      start_longitude: input.start.lng,
      start_address: input.start.address ?? null,
      target_distance_miles: input.target_distance_miles,
      actual_distance_miles: candidate.actual_distance_miles,
      elevation_gain_ft: candidate.elevation.gain_ft,
      elevation_loss_ft: candidate.elevation.loss_ft,
      elevation_profile: candidate.elevation.points,
      // PostGIS literal — built from the LineString coordinates.
      // Note: ST_GeomFromGeoJSON is also valid; the text form is simpler.
      route_geojson: candidate.geometry,
      turn_by_turn: candidate.turn_by_turn,
      surface_type: input.surface_type,
      route_type: input.route_type,
      terrain_preference: input.terrain_preference,
      avoidances: input.avoidances,
      is_saved: true,
      is_public: input.is_public ?? false,
      linked_workout_id: input.linked_workout_id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/routes");
  if (input.linked_workout_id) {
    revalidatePath(`/workout/${input.linked_workout_id}`);
  }

  return { ok: true, id: data.id };
}

/** Delete a saved route. */
export async function deleteRoute(routeId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("generated_routes")
    .delete()
    .eq("id", routeId);
  if (error) return { error: error.message };
  revalidatePath("/routes");
  return { ok: true };
}

/** Rate a public route. */
export async function rateRoute(routeId: string, rating: number, notes?: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("route_ratings").upsert(
    {
      route_id: routeId,
      user_id: user.id,
      rating,
      notes: notes ?? null,
    },
    { onConflict: "route_id,user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}
