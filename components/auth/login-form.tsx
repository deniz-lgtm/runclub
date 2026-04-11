"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signInWithMagicLink,
} from "@/app/(auth)/login/actions";

/**
 * Login form — editorial treatment with sharper inputs, ink buttons,
 * and mono "magic link sent" confirmation.
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
      <div className="rounded-xs border border-flash bg-flash/10 p-4">
        <div className="label-bib text-flash">Check your inbox</div>
        <p className="mt-2 font-display text-base font-extrabold leading-tight tracking-tight text-ink">
          Magic link sent
        </p>
        <p className="mt-1 font-mono text-[10px] text-ink-muted">
          {state.email}
        </p>
        <p className="mt-3 text-xs leading-snug text-ink-muted">
          Click the link in the email to sign in — no password required.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
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

      <div className="my-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink/15" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          Or email
        </span>
        <div className="h-px flex-1 bg-ink/15" />
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
          placeholder="you@email.com"
          className="h-12 rounded-xs border border-ink/20 bg-surface px-4 font-mono text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <Button
          variant="flash"
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Sending…" : "Send magic link"}
        </Button>
      </form>

      {state.kind === "error" && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {state.message}
        </p>
      )}
    </div>
  );
}
