"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createWorkout } from "@/app/(app)/train/actions";
import { Plus } from "lucide-react";

/**
 * Inline "add workout" form on the plan detail page. Starts collapsed
 * to keep the plan page clean; expands on Plus tap.
 */
export function WorkoutBuilder({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createWorkout(planId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" /> Add workout
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date" htmlFor="scheduled_date">
          <input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Type" htmlFor="workout_type">
          <select
            id="workout_type"
            name="workout_type"
            defaultValue="easy"
            className={inputCls}
          >
            <option value="easy">Easy</option>
            <option value="long_run">Long run</option>
            <option value="tempo">Tempo</option>
            <option value="intervals">Intervals</option>
            <option value="hills">Hills</option>
            <option value="recovery">Recovery</option>
            <option value="race">Race</option>
            <option value="cross_training">Cross training</option>
            <option value="rest">Rest</option>
          </select>
        </Field>
      </div>

      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          placeholder="e.g., 6×800m @ 5K pace"
          className={inputCls}
        />
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="1mi warm, 6×800m w/ 400m recovery, 1mi cool"
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Distance (mi)" htmlFor="target_distance_miles">
          <input
            id="target_distance_miles"
            name="target_distance_miles"
            type="number"
            min={0}
            step={0.1}
            placeholder="7"
            className={`${inputCls} tabular-nums`}
          />
        </Field>
        <Field label="Time" htmlFor="scheduled_time">
          <input
            id="scheduled_time"
            name="scheduled_time"
            type="time"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Location" htmlFor="location">
        <input
          id="location"
          name="location"
          placeholder="e.g., Santa Monica HS Track"
          className={inputCls}
        />
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Adding…" : "Add workout"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
