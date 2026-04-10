import type { WorkoutType } from "@/lib/types";

/**
 * Workout-type visual language.
 *
 * Each type gets a bold color (for dots + chip backgrounds) and a soft
 * background (for the day cell highlight). Colors match tailwind.config.ts
 * theme.extend.colors.workout.*, but we inline them here as hex because
 * Tailwind can't build class names from dynamic strings.
 */

export interface WorkoutStyle {
  label: string;
  emoji: string;
  dot: string; // hex for chart/dot use
  bg: string; // tailwind utility for chip background
  text: string; // tailwind utility for chip text
  border: string; // tailwind utility for chip border
}

export const WORKOUT_STYLES: Record<WorkoutType, WorkoutStyle> = {
  easy: {
    label: "Easy",
    emoji: "🟢",
    dot: "#4ADE80",
    bg: "bg-workout-easy/15",
    text: "text-green-700",
    border: "border-workout-easy/40",
  },
  long_run: {
    label: "Long run",
    emoji: "🔵",
    dot: "#3B82F6",
    bg: "bg-workout-long/15",
    text: "text-blue-700",
    border: "border-workout-long/40",
  },
  intervals: {
    label: "Intervals",
    emoji: "🔴",
    dot: "#EF4444",
    bg: "bg-workout-intervals/15",
    text: "text-red-700",
    border: "border-workout-intervals/40",
  },
  tempo: {
    label: "Tempo",
    emoji: "🟠",
    dot: "#F59E0B",
    bg: "bg-workout-tempo/15",
    text: "text-amber-700",
    border: "border-workout-tempo/40",
  },
  hills: {
    label: "Hills",
    emoji: "⛰️",
    dot: "#DC2626",
    bg: "bg-workout-hills/15",
    text: "text-red-800",
    border: "border-workout-hills/40",
  },
  recovery: {
    label: "Recovery",
    emoji: "🟣",
    dot: "#A78BFA",
    bg: "bg-workout-recovery/15",
    text: "text-purple-700",
    border: "border-workout-recovery/40",
  },
  cross_training: {
    label: "Cross",
    emoji: "🚴",
    dot: "#14B8A6",
    bg: "bg-workout-cross/15",
    text: "text-teal-700",
    border: "border-workout-cross/40",
  },
  race: {
    label: "Race",
    emoji: "🏁",
    dot: "#FF6B35",
    bg: "bg-primary/15",
    text: "text-primary",
    border: "border-primary/40",
  },
  rest: {
    label: "Rest",
    emoji: "😴",
    dot: "#D1D5DB",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

export function styleForWorkout(type: WorkoutType): WorkoutStyle {
  return WORKOUT_STYLES[type];
}
