"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RouteGenerator } from "./route-generator";
import { RouteBuilder } from "./route-builder";

type Mode = "generate" | "build";

interface RoutesWorkbenchProps {
  mapboxPublicToken: string | null;
  defaultDistance: number;
  linkedWorkoutId: string | null;
}

/**
 * The top of the /routes page — lets the runner pick between the
 * auto route generator ("I want 5 miles, surprise me") and the
 * interactive manual builder ("I'll tap the map myself").
 *
 * The tab is client-side so flipping between the two doesn't reload
 * the page. Both tabs ultimately save to the same generated_routes
 * table via the shared `saveRoute` action.
 */
export function RoutesWorkbench({
  mapboxPublicToken,
  defaultDistance,
  linkedWorkoutId,
}: RoutesWorkbenchProps) {
  const [mode, setMode] = useState<Mode>("generate");

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="inline-flex w-full overflow-hidden rounded-sm border border-ink">
        <ToggleButton
          active={mode === "generate"}
          onClick={() => setMode("generate")}
          index="01"
          label="Generate"
          hint="Auto"
        />
        <ToggleButton
          active={mode === "build"}
          onClick={() => setMode("build")}
          index="02"
          label="Build"
          hint="Tap to map"
        />
      </div>

      {/* Active panel */}
      {mode === "generate" ? (
        <RouteGenerator
          mapboxPublicToken={mapboxPublicToken}
          defaultDistance={defaultDistance}
          linkedWorkoutId={linkedWorkoutId}
        />
      ) : (
        <RouteBuilder mapboxPublicToken={mapboxPublicToken} />
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  index,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  index: string;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-3 border-ink px-4 py-3 text-left transition-colors",
        "[&:not(:last-child)]:border-r",
        active
          ? "bg-ink text-white"
          : "bg-surface text-ink hover:bg-ink/5",
      )}
    >
      <span
        className={cn(
          "font-mono text-[10px] font-bold tabular-nums",
          active ? "text-flash" : "text-ink-muted",
        )}
      >
        {index}
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-sm font-extrabold uppercase tracking-bib">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 font-mono text-[9px] font-bold uppercase tracking-bib",
            active ? "text-white/50" : "text-ink-muted",
          )}
        >
          {hint}
        </span>
      </div>
    </button>
  );
}
