"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createProfile } from "@/app/(auth)/onboarding/actions";

export function OnboardingForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProfile(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Display name" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          required
          className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="How should we greet you?"
        />
      </Field>

      <Field label="Username" htmlFor="username">
        <div className="flex items-center rounded-lg border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <span className="pl-4 text-sm text-muted-foreground">@</span>
          <input
            id="username"
            name="username"
            required
            pattern="[a-z0-9_]{3,24}"
            className="h-11 flex-1 bg-transparent px-2 text-sm outline-none"
            placeholder="yourname"
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Los Angeles"
          />
        </Field>
        <Field label="State" htmlFor="state">
          <input
            id="state"
            name="state"
            className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="CA"
          />
        </Field>
      </div>

      <Field label="Preferred distance" htmlFor="preferred_distance">
        <select
          id="preferred_distance"
          name="preferred_distance"
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          defaultValue=""
        >
          <option value="" disabled>
            Pick one
          </option>
          <option value="5k">5K</option>
          <option value="10k">10K</option>
          <option value="half_marathon">Half marathon</option>
          <option value="marathon">Marathon</option>
          <option value="ultra">Ultra</option>
          <option value="sprints">Sprints / track</option>
        </select>
      </Field>

      <Field label="Weekly mileage goal" htmlFor="weekly">
        <input
          id="weekly"
          name="weekly"
          type="number"
          min={0}
          className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="30"
        />
      </Field>

      <Field label="Bio (280 chars)" htmlFor="bio">
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="What's your running story?"
        />
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={pending}
      >
        {pending ? "Saving…" : "Let's run"}
      </Button>
    </form>
  );
}

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
