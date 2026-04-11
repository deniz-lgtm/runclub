"use client";

import { useEffect, useRef } from "react";

interface RouteMapProps {
  geometry: GeoJSON.LineString;
  startLat: number;
  startLng: number;
  mapboxToken: string | null;
}

/**
 * Mapbox GL JS map wrapper.
 *
 * Lazy-loads mapbox-gl on mount (it's ~200KB gzipped and only needed
 * on this page), renders the route as an orange line layer, drops
 * a start marker, and auto-fits the viewport to the route bounds.
 *
 * If no Mapbox token is available we fall back to a static SVG
 * preview of the LineString so the UI still shows *something*.
 */
export function RouteMap({
  geometry,
  startLat,
  startLng,
  mapboxToken,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      // Dynamic import so the Mapbox GL bundle stays off the initial
      // page load.
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = mapboxToken;

      // Compute bounds from the route.
      const coords = geometry.coordinates as Array<[number, number]>;
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      );

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        bounds,
        fitBoundsOptions: { padding: 30 },
      });
      mapRef.current = map;

      map.on("load", () => {
        // Route line
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry,
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#FF6B35",
            "line-width": 4,
          },
        });

        // Start marker
        new mapboxgl.Marker({ color: "#FF6B35" })
          .setLngLat([startLng, startLat])
          .addTo(map);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current && typeof mapRef.current === "object") {
        (mapRef.current as { remove?: () => void }).remove?.();
      }
    };
  }, [geometry, startLat, startLng, mapboxToken]);

  // No token fallback: render a static SVG preview of the polyline.
  if (!mapboxToken) {
    return <StaticRoutePreview geometry={geometry} />;
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-lg border border-border bg-muted"
    />
  );
}

/**
 * Static SVG fallback for the no-Mapbox-token case. Renders the
 * LineString in its own coordinate space so the runner can still
 * see the shape of their route.
 */
function StaticRoutePreview({ geometry }: { geometry: GeoJSON.LineString }) {
  const coords = geometry.coordinates as Array<[number, number]>;
  if (coords.length === 0) return null;

  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const W = 320;
  const H = 240;
  const PAD = 20;

  const lngRange = Math.max(0.0001, maxLng - minLng);
  const latRange = Math.max(0.0001, maxLat - minLat);

  const path = coords
    .map(([lng, lat]) => {
      const x = PAD + ((lng - minLng) / lngRange) * (W - PAD * 2);
      // SVG y is inverted relative to lat
      const y = PAD + (1 - (lat - minLat) / latRange) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L ");

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted to-background">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
        <path
          d={`M ${path}`}
          stroke="#FF6B35"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start point marker */}
        {coords[0] && (
          <circle
            cx={
              PAD + ((coords[0][0] - minLng) / lngRange) * (W - PAD * 2)
            }
            cy={
              PAD + (1 - (coords[0][1] - minLat) / latRange) * (H - PAD * 2)
            }
            r={6}
            fill="#FF6B35"
            stroke="#fff"
            strokeWidth={2}
          />
        )}
      </svg>
      <div className="absolute bottom-2 right-2 rounded bg-background/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        Preview — add Mapbox token for live map
      </div>
    </div>
  );
}
