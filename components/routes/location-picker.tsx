"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickedLocation {
  lat: number;
  lng: number;
  label: string; // human-readable, e.g. "Central Park, New York"
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation | null) => void;
  placeholder?: string;
}

/**
 * Reusable location picker — search box with debounced Mapbox
 * geocoding + "use my location" button.
 *
 * Used by the route generator and the route builder. Both want the
 * same affordance: "start my route from HERE, where HERE can be
 * anywhere."
 *
 * UI states:
 *   - Empty: show search input + "Use my location" button
 *   - Typing: debounced results dropdown under the input
 *   - Selected: show the picked location as a summary pill with an X
 *     to clear it back to empty
 */
export function LocationPicker({
  value,
  onChange,
  placeholder = "Search a city, address, or place",
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/routes/geocode?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Geocode failed");
        const json = (await res.json()) as {
          results?: Array<{
            name: string;
            place_name: string;
            lat: number;
            lng: number;
          }>;
          error?: string;
        };
        if (json.error) throw new Error(json.error);
        setResults(
          (json.results ?? []).map((r) => ({
            lat: r.lat,
            lng: r.lng,
            label: r.place_name,
          })),
        );
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function handlePick(loc: PickedLocation) {
    onChange(loc);
    setQuery("");
    setResults([]);
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setError(null);
  }

  function detectGeolocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Try to reverse-geocode for a nice label. If it fails, fall
        // back to the coordinate string.
        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(
            `/api/routes/geocode?q=${encodeURIComponent(`${lng},${lat}`)}`,
          );
          if (res.ok) {
            const json = (await res.json()) as {
              results?: Array<{ place_name: string }>;
            };
            if (json.results?.[0]?.place_name) {
              label = json.results[0].place_name;
            }
          }
        } catch {
          // ignore, use coord label
        }
        onChange({ lat, lng, label });
        setGeoLoading(false);
      },
      () => {
        setError("Couldn't get your location. Try search instead.");
        setGeoLoading(false);
      },
    );
  }

  // Selected state
  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-bib text-ink-muted">
          Start location
        </label>
        <div className="flex items-center gap-2 rounded-xs border border-ink bg-bone-soft px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-flash" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xs font-extrabold text-ink">
              {value.label}
            </div>
            <div className="mt-0.5 font-mono text-[9px] font-bold tabular-nums text-ink-muted">
              {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-ink-muted hover:bg-ink/10 hover:text-ink"
            aria-label="Change location"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Empty / searching state
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-bib text-ink-muted">
        Start location
      </label>

      <div className="relative">
        <div className="flex items-center gap-2 rounded-xs border border-ink/20 bg-surface focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
          <Search className="ml-3 h-4 w-4 shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={placeholder}
            className="h-11 flex-1 bg-transparent pr-3 text-sm outline-none"
          />
        </div>

        {/* Results dropdown */}
        {focused && (query.trim().length >= 2 || loading) && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xs border border-ink bg-surface shadow-raise">
            {loading && results.length === 0 && (
              <div className="px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
                Searching…
              </div>
            )}
            {!loading && results.length === 0 && query.trim().length >= 2 && (
              <div className="px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
                No matches
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lng}-${i}`}
                type="button"
                onMouseDown={() => handlePick(r)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-ink/5",
                  i < results.length - 1 && "border-b border-ink/10",
                )}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">
                    {r.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* OR divider + geolocation button */}
      <div className="mt-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-ink/15" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          Or
        </span>
        <div className="h-px flex-1 bg-ink/15" />
      </div>

      <button
        type="button"
        onClick={detectGeolocation}
        disabled={geoLoading}
        className="inline-flex items-center justify-center gap-2 rounded-xs border border-ink/20 bg-surface px-3 py-2.5 text-[11px] font-bold uppercase tracking-bib text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white disabled:opacity-50"
      >
        <Crosshair className="h-3.5 w-3.5" />
        {geoLoading ? "Getting location…" : "Use my location"}
      </button>

      {error && (
        <p className="font-mono text-[9px] font-bold uppercase tracking-bib text-siren">
          {error}
        </p>
      )}
    </div>
  );
}
