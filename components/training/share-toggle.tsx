"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareToggleProps {
  workoutId: string;
  initialShared?: boolean;
}

/**
 * Toggle to share/unshare a workout with friends.
 * When shared, the workout appears on your profile and in
 * friends' feed calendars.
 */
export function ShareToggle({
  workoutId,
  initialShared = false,
}: ShareToggleProps) {
  const [shared, setShared] = useState(initialShared);

  function toggle() {
    setShared((prev) => !prev);
    // Phase 2: call server action to persist the share state
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide transition-colors",
        shared
          ? "bg-flash/15 text-flash"
          : "bg-ink/5 text-ink-muted hover:bg-ink/10",
      )}
      title={shared ? "Visible to friends" : "Private — not shared"}
    >
      {shared ? (
        <>
          <Eye className="h-2.5 w-2.5" />
          Shared
        </>
      ) : (
        <>
          <EyeOff className="h-2.5 w-2.5" />
          Private
        </>
      )}
    </button>
  );
}
