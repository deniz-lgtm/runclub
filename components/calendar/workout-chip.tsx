import { cn } from "@/lib/utils";
import { styleForWorkout } from "@/lib/workout-colors";
import type { WorkoutType } from "@/lib/types";

interface WorkoutChipProps {
  type: WorkoutType;
  label: string;
  size?: "sm" | "md";
  completed?: boolean;
}

/**
 * Workout-type stamp. Inline with monospace all-caps label — reads
 * like a race-bib category tag rather than a friendly pill.
 */
export function WorkoutChip({
  type,
  label,
  size = "sm",
  completed = false,
}: WorkoutChipProps) {
  const style = styleForWorkout(type);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border border-ink/15 bg-bone-soft font-mono uppercase tracking-bib",
        size === "sm"
          ? "px-1 py-0.5 text-[9px] font-bold"
          : "px-1.5 py-1 text-[10px] font-bold",
        completed && "line-through opacity-50",
      )}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-none"
        style={{ backgroundColor: style.dot }}
      />
      <span className="truncate text-ink">{label}</span>
    </div>
  );
}
