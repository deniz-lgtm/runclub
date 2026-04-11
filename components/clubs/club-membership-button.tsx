"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinClub, leaveClub } from "@/app/(app)/clubs/actions";

interface ClubMembershipButtonProps {
  clubId: string;
  slug: string;
  isMember: boolean;
  membershipType: "open" | "request_to_join" | "invite_only";
}

export function ClubMembershipButton({
  clubId,
  slug,
  isMember,
  membershipType,
}: ClubMembershipButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isMember) {
        await leaveClub(clubId, slug);
      } else {
        await joinClub(clubId, slug);
      }
    });
  }

  if (membershipType === "invite_only" && !isMember) {
    return (
      <Button disabled variant="outline" className="w-full">
        Invite-only
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      variant={isMember ? "outline" : "default"}
      className="w-full"
    >
      {pending
        ? "…"
        : isMember
          ? "Leave club"
          : membershipType === "request_to_join"
            ? "Request to join"
            : "Join club"}
    </Button>
  );
}
