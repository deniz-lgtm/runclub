"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClubEvent } from "@/app/(app)/clubs/[slug]/events/actions";

interface EventFormProps {
  clubId: string;
  slug: string;
}

export function EventForm({ clubId, slug }: EventFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClubEvent(clubId, slug, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Title">
        <input
          name="title"
          required
          placeholder="Tuesday Track Workout"
          className={inputCls}
        />
      </Field>

      <Field label="Event type">
        <select
          name="event_type"
          defaultValue="group_run"
          className={inputCls}
        >
          <option value="group_run">Group run</option>
          <option value="workout">Workout</option>
          <option value="race">Race</option>
          <option value="social">Social</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            name="event_date"
            type="date"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Start time">
          <input name="start_time" type="time" className={inputCls} />
        </Field>
      </div>

      <Field label="Meetup location">
        <input
          name="meetup_location"
          placeholder="Santa Monica HS track"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Distance (mi)">
          <input
            name="distance_miles"
            type="number"
            min={0}
            step={0.1}
            className={`${inputCls} tabular-nums`}
          />
        </Field>
        <Field label="Pace">
          <input
            name="pace_description"
            placeholder="8:00–9:00, all welcome"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          placeholder="What should runners know before they show up?"
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      {/* Recurring */}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="is_recurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary"
        />
        <span>
          <span className="font-semibold">Recurring event</span>
          <span className="block text-xs text-muted-foreground">
            e.g., every Tuesday at 6 PM
          </span>
        </span>
      </label>

      {recurring && (
        <Field label="Recurrence (iCal RRULE)">
          <input
            name="recurrence_rule"
            placeholder="FREQ=WEEKLY;BYDAY=TU"
            className={`${inputCls} font-mono text-[11px]`}
          />
        </Field>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create event"}
      </Button>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
