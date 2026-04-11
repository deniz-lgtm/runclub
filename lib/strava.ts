/**
 * Strava OAuth2 + activity sync helpers.
 *
 * OAuth flow:
 *   1. User clicks "Connect Strava" → we redirect to STRAVA_AUTH_URL
 *      with client_id, redirect_uri, scope, approval_prompt, state
 *   2. Strava redirects back to /api/strava/callback with ?code=...
 *   3. We exchange the code for access_token + refresh_token +
 *      expires_at + athlete and store them on the profile row
 *   4. On subsequent sync, refresh the token if expired
 *
 * Webhook flow (for real-time activity sync):
 *   1. Register a webhook subscription with Strava pointing at
 *      /api/strava/webhook
 *   2. Verify the subscription with GET (hub.challenge handshake)
 *   3. On new activity POST, fetch the full activity and match it
 *      to a scheduled workout by date + distance
 */

const STRAVA_BASE = "https://www.strava.com/api/v3";

export const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export const STRAVA_SCOPES = "read,activity:read_all,profile:read_all";

export function hasStravaCredentials(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET,
  );
}

/**
 * Build the authorization URL the user gets redirected to.
 * `state` should be a random nonce stored in a cookie to prevent CSRF.
 */
export function buildStravaAuthUrl(
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES,
    state,
  });
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

/** Exchange the ?code= from the callback for a full token bundle. */
export async function exchangeCode(code: string): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status}`);
  }
  return (await res.json()) as StravaTokens;
}

/** Refresh an access token that has expired. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }
  return (await res.json()) as StravaTokens;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // "Run", "Ride", etc.
  start_date: string; // ISO
  start_date_local: string;
  average_heartrate?: number;
  average_speed: number; // m/s
  map?: { summary_polyline?: string };
}

/** Fetch activities for the current user, after a given timestamp. */
export async function fetchRecentActivities(
  accessToken: string,
  sinceEpochSeconds: number,
): Promise<StravaActivity[]> {
  const url = `${STRAVA_BASE}/athlete/activities?after=${sinceEpochSeconds}&per_page=50`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strava activities fetch failed: ${res.status}`);
  }
  return (await res.json()) as StravaActivity[];
}

/** Fetch a single activity by id (used by the webhook handler). */
export async function fetchActivity(
  accessToken: string,
  activityId: number | string,
): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_BASE}/activities/${activityId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strava activity fetch failed: ${res.status}`);
  }
  return (await res.json()) as StravaActivity;
}

/**
 * Match a Strava activity to the closest scheduled workout on the
 * same date. Used when pulling activities into FWR — the sync process
 * looks for a workout whose scheduled_date matches the activity's
 * local date, then updates its actual_* columns.
 */
export function matchesWorkout(
  activity: StravaActivity,
  workoutDate: string,
  workoutDistanceMiles: number | null,
): boolean {
  // Same day match first.
  const activityDate = activity.start_date_local.slice(0, 10);
  if (activityDate !== workoutDate) return false;
  // Optional distance tolerance (within 20%).
  if (workoutDistanceMiles != null) {
    const activityMiles = activity.distance / 1609.344;
    const delta = Math.abs(activityMiles - workoutDistanceMiles);
    if (delta / workoutDistanceMiles > 0.2) return false;
  }
  return true;
}
