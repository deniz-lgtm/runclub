/**
 * Final Surge OAuth2 + workout sync helpers.
 *
 * Final Surge's API is similar to TrainingPeaks — OAuth2 handshake
 * then REST workout endpoints. As of writing, FS publishes iCal feeds
 * as a reliable fallback if the API access is gated; in that case the
 * sync path becomes: user pastes iCal URL → we pull + parse server-side.
 */

const FS_AUTH_URL = "https://log.finalsurge.com/OAuth/Authorize";
const FS_TOKEN_URL = "https://log.finalsurge.com/oauth/token";
const FS_API_BASE = "https://api.finalsurge.com/v2";

export function hasFSCredentials(): boolean {
  return Boolean(
    process.env.FINALSURGE_CLIENT_ID && process.env.FINALSURGE_CLIENT_SECRET,
  );
}

export function buildFSAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FINALSURGE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "workouts:read athlete:read",
    state,
  });
  return `${FS_AUTH_URL}?${params.toString()}`;
}

export interface FSTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeFSCode(
  code: string,
  redirectUri: string,
): Promise<FSTokens> {
  const res = await fetch(FS_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.FINALSURGE_CLIENT_ID ?? "",
      client_secret: process.env.FINALSURGE_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Final Surge token exchange failed: ${res.status}`);
  }
  return (await res.json()) as FSTokens;
}

export async function refreshFSToken(refreshToken: string): Promise<FSTokens> {
  const res = await fetch(FS_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.FINALSURGE_CLIENT_ID ?? "",
      client_secret: process.env.FINALSURGE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Final Surge token refresh failed: ${res.status}`);
  }
  return (await res.json()) as FSTokens;
}

export interface FSWorkout {
  id: string;
  scheduled_date: string;
  name: string;
  description?: string;
  activity_type: string;
  planned_distance_km?: number;
  planned_duration_seconds?: number;
}

export async function fetchFSWorkouts(
  accessToken: string,
  fromDate: string,
  toDate: string,
): Promise<FSWorkout[]> {
  const url = `${FS_API_BASE}/workouts?from=${fromDate}&to=${toDate}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Final Surge workouts fetch failed: ${res.status}`);
  }
  return (await res.json()) as FSWorkout[];
}
