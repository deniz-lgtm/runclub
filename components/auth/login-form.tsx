"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signInWithPassword,
} from "@/app/(auth)/login/actions";

/**
 * Login form — editorial treatment with sharper inputs and ink buttons.
 * Signs in with email + password via Supabase Auth.
 */
export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSignIn(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  function handleGoogle() {
    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
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

      <form action={handleSignIn} className="flex flex-col gap-2">
        <label className="sr-only" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="h-12 rounded-xs border border-ink/20 bg-surface px-4 font-mono text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="h-12 rounded-xs border border-ink/20 bg-surface px-4 font-mono text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <Button
          variant="flash"
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {error}
        </p>
      )}
    </div>
  );
}
