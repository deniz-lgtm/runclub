"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signInWithMagicLink,
} from "@/app/(auth)/login/actions";

/**
 * Client-side login form. Handles the transitions + inline feedback
 * so the server actions can stay pure.
 */
export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sent"; email: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function handleMagicLink(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (result?.error) {
        setState({ kind: "error", message: result.error });
      } else {
        setState({ kind: "sent", email });
      }
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setState({ kind: "error", message: result.error });
      }
    });
  }

  if (state.kind === "sent") {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold">Check your inbox</p>
        <p className="mt-1 text-muted-foreground">
          We sent a magic link to <span className="font-medium">{state.email}</span>.
          Click it to sign in — no password required.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending}
      >
        Continue with Google
      </Button>
      <Button variant="outline" size="lg" className="w-full" disabled>
        Continue with Apple
      </Button>

      <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={handleMagicLink} className="flex flex-col gap-2">
        <label className="sr-only" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-11 rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send magic link"}
        </Button>
      </form>

      {state.kind === "error" && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
    </div>
  );
}
