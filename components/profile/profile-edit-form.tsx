"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/(app)/profile/settings/actions";
import type { Profile } from "@/lib/types";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  function handleSubmit(formData: FormData) {
    setState({ kind: "idle" });
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setState({ kind: "error", message: result.error });
      } else {
        setState({ kind: "ok" });
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Display name" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name ?? ""}
          required
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            defaultValue={profile.city ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="State" htmlFor="state">
          <input
            id="state"
            name="state"
            defaultValue={profile.state ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Preferred distance" htmlFor="preferred_distance">
        <select
          id="preferred_distance"
          name="preferred_distance"
          defaultValue={profile.preferred_distance ?? ""}
          className={inputCls}
        >
          <option value="">—</option>
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
          defaultValue={profile.weekly_mileage_goal ?? ""}
          className={`${inputCls} tabular-nums`}
        />
      </Field>

      <Field label="Current shoe" htmlFor="current_shoe">
        <input
          id="current_shoe"
          name="current_shoe"
          defaultValue={profile.current_shoe ?? ""}
          className={inputCls}
          placeholder="What's on your feet?"
        />
      </Field>

      <Field label="Bio (280 chars)" htmlFor="bio">
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={profile.bio ?? ""}
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={profile.is_public}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary"
        />
        <span>
          <span className="font-semibold">Public profile</span>
          <span className="block text-xs text-muted-foreground">
            Let other runners find you by username and see your bio.
          </span>
        </span>
      </label>

      {state.kind === "error" && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
      {state.kind === "ok" && (
        <p className="text-xs text-secondary">Saved.</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
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
