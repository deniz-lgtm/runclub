"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  logWorkoutCompletion,
  toggleWorkoutComplete,
} from "@/app/(app)/train/actions";
import { Check } from "lucide-react";

interface WorkoutCompletionFormProps {
  workoutId: string;
  isCompleted: boolean;
  actualDistance: number | null;
  actualDuration: number | null;
  effortRating: number | null;
  existingNotes: string | null;
}

/**
 * Post-run logging form. Appears on the workout detail page for any
 * non-rest workout. Either "Mark complete" (quick) or fill out the
 * actuals + effort + notes form (complete).
 */
export function WorkoutCompletionForm({
  workoutId,
  isCompleted,
  actualDistance,
  actualDuration,
  effortRating,
  existingNotes,
}: WorkoutCompletionFormProps) {
  const [expanded, setExpanded] = useState(isCompleted);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleQuickComplete() {
    startTransition(async () => {
      const result = await toggleWorkoutComplete(workoutId, !isCompleted);
      if (result?.error) setError(result.error);
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await logWorkoutCompletion(workoutId, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {isCompleted ? "Log completed" : "Did this run?"}
        </h3>
        {!expanded && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded(true)}
            >
              Log details
            </Button>
            <Button size="sm" onClick={handleQuickComplete} disabled={pending}>
              <Check className="h-3 w-3" /> Mark done
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <form action={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Actual distance (mi)">
              <input
                name="actual_distance_miles"
                type="number"
                min={0}
                step={0.01}
                defaultValue={actualDistance ?? ""}
                className={`${inputCls} tabular-nums`}
              />
            </Field>
            <Field label="Duration (min)">
              <input
                name="actual_duration_minutes"
                type="number"
                min={0}
                defaultValue={actualDuration ?? ""}
                className={`${inputCls} tabular-nums`}
              />
            </Field>
          </div>

          <Field label="Effort (1 easy – 10 max)">
            <input
              name="effort_rating"
              type="number"
              min={1}
              max={10}
              defaultValue={effortRating ?? ""}
              className={`${inputCls} tabular-nums`}
            />
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              rows={2}
              defaultValue={existingNotes ?? ""}
              placeholder="How did it feel?"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setExpanded(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
