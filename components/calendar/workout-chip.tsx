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
 * Compact pill showing a workout type + label. Used inside calendar
 * day cells, the today card, and day-detail sheets.
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
        "inline-flex items-center gap-1.5 rounded-md border font-semibold",
        style.bg,
        style.text,
        style.border,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        completed && "line-through opacity-60",
      )}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
