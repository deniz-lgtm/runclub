"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClub } from "@/app/(app)/clubs/actions";

export function ClubForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClub(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Club name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          placeholder="Griffith Park Runners"
          className={inputCls}
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What's this club about?"
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City" htmlFor="city">
          <input id="city" name="city" placeholder="Los Angeles" className={inputCls} />
        </Field>
        <Field label="State" htmlFor="state">
          <input id="state" name="state" placeholder="CA" className={inputCls} />
        </Field>
      </div>

      <Field label="Website" htmlFor="website_url">
        <input
          id="website_url"
          name="website_url"
          type="url"
          placeholder="https://your-club.com"
          className={inputCls}
        />
      </Field>

      <Field label="Membership" htmlFor="membership_type">
        <select
          id="membership_type"
          name="membership_type"
          defaultValue="open"
          className={inputCls}
        >
          <option value="open">Open — anyone can join</option>
          <option value="request_to_join">Request to join</option>
          <option value="invite_only">Invite only</option>
        </select>
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create club"}
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
