"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { rsvpToEvent } from "@/app/(app)/clubs/[slug]/events/actions";
import { cn } from "@/lib/utils";

interface EventRsvpButtonsProps {
  eventId: string;
  slug: string;
  initialStatus: "going" | "maybe" | "not_going" | null;
}

export function EventRsvpButtons({
  eventId,
  slug,
  initialStatus,
}: EventRsvpButtonsProps) {
  const [current, setCurrent] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  function handle(status: "going" | "maybe" | "not_going") {
    startTransition(async () => {
      const result = await rsvpToEvent(eventId, slug, status);
      if (!result?.error) setCurrent(status);
    });
  }

  return (
    <div className="flex gap-2">
      <RsvpButton
        label="Going"
        active={current === "going"}
        disabled={pending}
        onClick={() => handle("going")}
      />
      <RsvpButton
        label="Maybe"
        active={current === "maybe"}
        disabled={pending}
        onClick={() => handle("maybe")}
      />
      <RsvpButton
        label="Can't make it"
        active={current === "not_going"}
        disabled={pending}
        onClick={() => handle("not_going")}
      />
    </div>
  );
}

function RsvpButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={disabled}
      onClick={onClick}
      className={cn("flex-1", !active && "text-muted-foreground")}
    >
      {label}
    </Button>
  );
}
