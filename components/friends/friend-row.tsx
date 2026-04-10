"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from "@/app/(app)/friends/actions";

interface FriendRowProps {
  profile: Profile;
  friendshipId?: string;
  variant: "accepted" | "incoming" | "outgoing" | "search";
}

/**
 * One row in the Friends tab lists. Renders the right action buttons
 * for each state: accept/decline for incoming, cancel for outgoing,
 * unfriend for accepted, add for search results.
 */
export function FriendRow({ profile, friendshipId, variant }: FriendRowProps) {
  const [pending, startTransition] = useTransition();
  const displayName = profile.display_name ?? profile.username;

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <Avatar className="h-11 w-11">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
        <AvatarFallback>{initials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          {profile.is_coach && (
            <Badge variant="secondary" className="text-[9px]">
              Coach
            </Badge>
          )}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          @{profile.username}
          {profile.city && ` • ${profile.city}`}
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5">
        {variant === "accepted" && friendshipId && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => removeFriendship(friendshipId))}
          >
            Unfriend
          </Button>
        )}
        {variant === "incoming" && friendshipId && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => acceptFriendRequest(friendshipId))}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => removeFriendship(friendshipId))}
            >
              Decline
            </Button>
          </>
        )}
        {variant === "outgoing" && friendshipId && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => removeFriendship(friendshipId))}
          >
            Cancel
          </Button>
        )}
        {variant === "search" && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => sendFriendRequest(profile.id))}
          >
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
