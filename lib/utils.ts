import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine Tailwind classes, dedupe + merge conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a decimal mile count as "6.25 mi". */
export function formatMiles(miles: number | null | undefined): string {
  if (miles == null) return "—";
  return `${miles.toFixed(miles % 1 === 0 ? 0 : 2)} mi`;
}

/** Format seconds/mile as "7:45/mi". */
export function formatPace(secondsPerMile: number | null | undefined): string {
  if (secondsPerMile == null) return "—";
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${s.toString().padStart(2, "0")}/mi`;
}

/** Initials for avatar fallback. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
