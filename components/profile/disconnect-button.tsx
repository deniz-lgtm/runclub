"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { disconnectService } from "@/app/(app)/profile/settings/connections/actions";

export function DisconnectButton({ service }: { service: "strava" | "tp" | "fs" }) {
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      await disconnectService(service);
    });
  }

  return (
    <Button
      variant="outline"
      className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
      onClick={handle}
      disabled={pending}
    >
      {pending ? "…" : "Disconnect"}
    </Button>
  );
}
