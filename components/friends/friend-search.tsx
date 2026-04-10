"use client";

import { useEffect, useState } from "react";
import { FriendRow } from "./friend-row";
import type { Profile } from "@/lib/types";
import { Search } from "lucide-react";

/**
 * Username typeahead. Debounces to /friends/search and renders each
 * result as a <FriendRow variant="search"/> with an Add button.
 */
export function FriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/friends/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as { profiles: Profile[] };
        setResults(json.profiles);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-2">
          {loading && (
            <p className="px-1 text-xs text-muted-foreground">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-1 text-xs text-muted-foreground">
              No runners found.
            </p>
          )}
          {results.map((p) => (
            <FriendRow key={p.id} profile={p} variant="search" />
          ))}
        </div>
      )}
    </div>
  );
}
