import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SavedRoute {
  id: string;
  user_id: string;
  title: string | null;
  start_latitude: number;
  start_longitude: number;
  start_address: string | null;
  target_distance_miles: number;
  actual_distance_miles: number | null;
  elevation_gain_ft: number | null;
  elevation_loss_ft: number | null;
  elevation_profile: Array<{ distance_mi: number; elevation_ft: number }> | null;
  route_geojson: GeoJSON.LineString | null;
  turn_by_turn: Array<{ instruction: string; distance_m: number }> | null;
  surface_type: string;
  route_type: string;
  is_public: boolean;
  avg_rating: number | null;
  times_used: number;
}

/** Saved routes belonging to the current user. */
export async function getMySavedRoutes(): Promise<SavedRoute[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("generated_routes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_saved", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as SavedRoute[];
}

/** A single saved route by id. RLS handles visibility. */
export async function getSavedRouteById(id: string): Promise<SavedRoute | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("generated_routes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as SavedRoute | null) ?? null;
}

/**
 * Public routes the current user might be interested in. No spatial
 * filter yet — Phase 2D+ can add PostGIS ST_DWithin around the user's
 * home city.
 */
export async function getPublicRoutes(limit = 20): Promise<SavedRoute[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("generated_routes")
    .select("*")
    .eq("is_public", true)
    .order("times_used", { ascending: false })
    .limit(limit);

  return (data ?? []) as SavedRoute[];
}
