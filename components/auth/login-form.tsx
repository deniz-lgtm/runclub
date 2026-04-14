"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/(auth)/login/actions";

type Mode = "signin" | "signup";

/**
 * Login form — editorial treatment with sharper inputs and ink buttons.
 * Supports both sign in and sign up via Supabase email + password auth.
 */
export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      if (mode === "signin") {
        const result = await signInWithPassword(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        router.push("/");
        router.refresh();
      } else {
        const result = await signUpWithPassword(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.needsConfirmation) {
          setInfo(
            "Account created — check your inbox to confirm, then sign in.",
          );
          setMode("signin");
          return;
        }
        // Signed in immediately — go finish the profile.
        router.push("/onboarding");
        router.refresh();
      }
    });
  }

  function handleGoogle() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  const isSignup = mode === "signup";

  return (
    <div className="flex flex-col gap-3">
      {/* Sign in / sign up toggle */}
      <div className="flex rounded-xs border border-ink/15 p-0.5">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
          className={`flex-1 rounded-xs px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-bib transition ${
            !isSignup ? "bg-ink text-white" : "text-ink-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
          className={`flex-1 rounded-xs px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-bib transition ${
            isSignup ? "bg-ink text-white" : "text-ink-muted"
          }`}
        >
          Sign up
        </button>
      </div>

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

      <form action={handleSubmit} className="flex flex-col gap-2">
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
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "Password (8+ characters)" : "Password"}
          className="h-12 rounded-xs border border-ink/20 bg-surface px-4 font-mono text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <Button
          variant="flash"
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {error}
        </p>
      )}
      {info && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-ink-muted">
          {info}
        </p>
      )}
    </div>
  );
}
