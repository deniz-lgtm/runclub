/**
 * Elevation profile helpers.
 *
 * Given a GeoJSON LineString and a list of sampled elevations (meters),
 * compute (a) a profile array for charting and (b) aggregate metrics
 * (total gain, loss, max, min).
 */

export interface ElevationPoint {
  distance_mi: number; // cumulative distance from start
  elevation_ft: number; // elevation at this point
}

export interface ElevationProfile {
  points: ElevationPoint[];
  gain_ft: number;
  loss_ft: number;
  max_ft: number;
  min_ft: number;
}

const METERS_TO_FT = 3.28084;
const METERS_TO_MI = 0.000621371;

/**
 * Compute cumulative distance (miles) between each pair of consecutive
 * coordinates using the haversine formula.
 */
function cumulativeMiles(coords: Array<[number, number]>): number[] {
  const out = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const meters = haversine(lat1, lng1, lat2, lng2);
    out.push(out[i - 1] + meters * METERS_TO_MI);
  }
  return out;
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Build the elevation profile for a route.
 * @param coords GeoJSON [lng, lat] pairs along the route
 * @param elevationsMeters elevation (in meters) sampled at each coord
 */
export function buildElevationProfile(
  coords: Array<[number, number]>,
  elevationsMeters: number[],
): ElevationProfile {
  const distances = cumulativeMiles(coords);
  const points: ElevationPoint[] = [];
  let gain = 0;
  let loss = 0;
  let max = -Infinity;
  let min = Infinity;

  for (let i = 0; i < coords.length; i++) {
    const ele_ft = (elevationsMeters[i] ?? 0) * METERS_TO_FT;
    points.push({
      distance_mi: distances[i],
      elevation_ft: Math.round(ele_ft),
    });
    if (ele_ft > max) max = ele_ft;
    if (ele_ft < min) min = ele_ft;
    if (i > 0) {
      const delta = ele_ft - (elevationsMeters[i - 1] ?? 0) * METERS_TO_FT;
      if (delta > 0) gain += delta;
      else loss -= delta;
    }
  }

  return {
    points,
    gain_ft: Math.round(gain),
    loss_ft: Math.round(loss),
    max_ft: Math.round(max === -Infinity ? 0 : max),
    min_ft: Math.round(min === Infinity ? 0 : min),
  };
}

/**
 * Downsample a long coordinate list to roughly N points evenly spaced,
 * so the elevation API calls stay cheap.
 */
export function downsampleCoords(
  coords: Array<[number, number]>,
  targetCount: number,
): Array<[number, number]> {
  if (coords.length <= targetCount) return coords;
  const step = (coords.length - 1) / (targetCount - 1);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < targetCount; i++) {
    out.push(coords[Math.round(i * step)]);
  }
  return out;
}
