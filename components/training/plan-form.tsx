"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createPlan } from "@/app/(app)/train/actions";

/**
 * Create-plan form. Submits to the `createPlan` server action which
 * redirects to the new plan detail page on success.
 */
export function PlanForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPlan(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Plan title" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          placeholder="Chicago Marathon 2026 Build"
          className={inputCls}
        />
      </Field>

      <Field label="Goal race" htmlFor="goal_race">
        <input
          id="goal_race"
          name="goal_race"
          placeholder="Chicago Marathon"
          className={inputCls}
        />
      </Field>

      <Field label="Goal race date" htmlFor="goal_race_date">
        <input
          id="goal_race_date"
          name="goal_race_date"
          type="date"
          className={inputCls}
        />
      </Field>

      <Field label="Visibility" htmlFor="visibility">
        <select
          id="visibility"
          name="visibility"
          defaultValue="friends_only"
          className={inputCls}
        >
          <option value="private">Private — only me</option>
          <option value="friends_only">Friends only — my crew can see</option>
          <option value="public">Public — anyone can see</option>
        </select>
      </Field>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Why this plan? Goal pace? Context?"
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create plan"}
      </Button>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

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
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
