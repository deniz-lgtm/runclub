/**
 * TrainingPeaks OAuth2 + workout sync helpers.
 *
 * TP's API is more enterprise-flavored than Strava's; the endpoints
 * here are the public documented surface as of writing. Swap them
 * out if the spec changes.
 *
 * The sync pattern (Phase 2E):
 *   1. OAuth2 handshake (authorize → callback → exchange code)
 *   2. Persist tokens on the profile row
 *   3. On connect and daily, pull the athlete's workouts for the
 *      next 14 days, upsert into training_plan_workouts with
 *      sync_source='trainingpeaks' and external_workout_id
 *   4. Flag locally-modified workouts so subsequent syncs don't
 *      overwrite them
 */

const TP_AUTH_URL = "https://oauth.trainingpeaks.com/OAuth/Authorize";
const TP_TOKEN_URL = "https://oauth.trainingpeaks.com/oauth/token";
const TP_API_BASE = "https://api.trainingpeaks.com/v2";

export function hasTPCredentials(): boolean {
  return Boolean(
    process.env.TRAININGPEAKS_CLIENT_ID && process.env.TRAININGPEAKS_CLIENT_SECRET,
  );
}

export function buildTPAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TRAININGPEAKS_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "athlete:profile workouts:read",
    state,
  });
  return `${TP_AUTH_URL}?${params.toString()}`;
}

export interface TPTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope: string;
}

export async function exchangeTPCode(
  code: string,
  redirectUri: string,
): Promise<TPTokens> {
  const res = await fetch(TP_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TRAININGPEAKS_CLIENT_ID ?? "",
      client_secret: process.env.TRAININGPEAKS_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`TrainingPeaks token exchange failed: ${res.status}`);
  }
  return (await res.json()) as TPTokens;
}

export async function refreshTPToken(refreshToken: string): Promise<TPTokens> {
  const res = await fetch(TP_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TRAININGPEAKS_CLIENT_ID ?? "",
      client_secret: process.env.TRAININGPEAKS_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`TrainingPeaks token refresh failed: ${res.status}`);
  }
  return (await res.json()) as TPTokens;
}

export interface TPWorkout {
  Id: string;
  WorkoutDay: string; // ISO date
  Title: string;
  Description?: string;
  WorkoutType: string; // "Run", "Bike", etc.
  PlannedDistance?: number; // meters
  PlannedDuration?: number; // seconds
  Structure?: unknown;
}

/** Pull the athlete's upcoming workouts from TP. */
export async function fetchTPWorkouts(
  accessToken: string,
  athleteId: string,
  fromDate: string,
  toDate: string,
): Promise<TPWorkout[]> {
  const url =
    `${TP_API_BASE}/workouts/${athleteId}/${fromDate}/${toDate}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`TrainingPeaks workouts fetch failed: ${res.status}`);
  }
  return (await res.json()) as TPWorkout[];
}

/**
 * Map a TP workout type string to our internal WorkoutType enum.
 * TP uses "Run" for everything; the fine-grained type has to be
 * parsed out of the Title or Description (e.g., "Tempo 6mi",
 * "Intervals 6x800m", "Easy 4mi").
 */
export function mapTPWorkoutType(
  workoutType: string,
  title: string,
): "easy" | "long_run" | "tempo" | "intervals" | "hills" | "recovery" | "race" | "cross_training" | "rest" {
  const type = workoutType.toLowerCase();
  if (type === "rest" || type === "day off") return "rest";
  if (type !== "run") return "cross_training";

  const t = title.toLowerCase();
  if (/race/.test(t)) return "race";
  if (/long\s?run|long/i.test(t)) return "long_run";
  if (/tempo|threshold/.test(t)) return "tempo";
  if (/interval|repeat|x\s?(?:\d+)/.test(t)) return "intervals";
  if (/hill|incline/.test(t)) return "hills";
  if (/recovery|shake/.test(t)) return "recovery";
  return "easy";
}
