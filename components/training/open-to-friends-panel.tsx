"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openToFriends, closeInvite } from "@/app/(app)/workout/[workoutId]/actions";
import { Users, X } from "lucide-react";

interface OpenToFriendsPanelProps {
  workoutId: string;
  currentlyOpen: boolean;
  initialMeetup: string | null;
  initialMaxJoiners: number | null;
  initialNotes: string | null;
  goingCount: number;
}

/**
 * The "Open to Friends" toggle + meetup details editor.
 *
 * When not open, shows a single "Open to Friends" button. When open,
 * shows the meetup location, note, and count of friends going. Can be
 * re-edited at any time.
 */
export function OpenToFriendsPanel({
  workoutId,
  currentlyOpen,
  initialMeetup,
  initialMaxJoiners,
  initialNotes,
  goingCount,
}: OpenToFriendsPanelProps) {
  const [editing, setEditing] = useState(!currentlyOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(currentlyOpen);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await openToFriends(workoutId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(true);
        setEditing(false);
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeInvite(workoutId);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    });
  }

  // Not open + not editing → empty CTA.
  if (!isOpen && !editing) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Run with friends</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Open this workout to your crew. They&apos;ll see it on their feed
          and can tap to join.
        </p>
        <Button className="mt-3" onClick={() => setEditing(true)}>
          Open to friends
        </Button>
      </div>
    );
  }

  // Open (read-only) → show status summary.
  if (isOpen && !editing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge>Open to friends</Badge>
            <span className="text-xs text-muted-foreground">
              {goingCount} going
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={pending}
          >
            Edit
          </Button>
        </div>
        {initialMeetup && (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Meet:</span> {initialMeetup}
          </p>
        )}
        {initialNotes && (
          <p className="mt-1 text-sm text-muted-foreground">{initialNotes}</p>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="mt-3 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={handleClose}
          disabled={pending}
        >
          <X className="h-3 w-3" /> Close invite
        </Button>
      </div>
    );
  }

  // Editing.
  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Open to friends</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>

      <Field label="Meetup location">
        <input
          name="meetup_location"
          defaultValue={initialMeetup ?? ""}
          placeholder="Griffith Park, east gate"
          className={inputCls}
        />
      </Field>

      <Field label="Max joiners (optional)">
        <input
          name="max_joiners"
          type="number"
          min={1}
          defaultValue={initialMaxJoiners ?? ""}
          placeholder="Leave empty for unlimited"
          className={`${inputCls} tabular-nums`}
        />
      </Field>

      <Field label="Note">
        <textarea
          name="notes"
          rows={2}
          defaultValue={initialNotes ?? ""}
          placeholder="Conversational pace, all welcome"
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : isOpen ? "Update invite" : "Open to friends"}
      </Button>
    </form>
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
