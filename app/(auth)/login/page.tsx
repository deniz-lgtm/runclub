import { LoginForm } from "@/components/auth/login-form";

/**
 * Sign-in page — editorial / race-bib treatment.
 *
 * Full-screen ink field with a bone-colored content panel. Big
 * display wordmark, tagline in uppercase, form below. Feels like
 * the front of a race program.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="mx-auto flex w-full max-w-md flex-col">
        {/* Ink page framing — top bib */}
        <div className="mb-1 flex items-center justify-between text-white/50">
          <span className="font-mono text-[9px] font-bold uppercase tracking-bib">
            SESSION 01
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-bib">
            FWR · SIGN IN
          </span>
        </div>
        <div className="h-px bg-white/20" />

        {/* Hero wordmark on ink */}
        <div className="mt-10 mb-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xs bg-flash">
            <span className="font-display text-3xl font-black text-ink">F</span>
          </div>
          <h1 className="font-display text-5xl font-black leading-[0.85] tracking-tightest text-white">
            FRIENDS
            <br />
            WHO RUN
          </h1>
          <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-bib text-flash">
            Your crew · Your miles · Your race
          </p>
        </div>

        {/* Form card on bone */}
        <div className="rounded-sm bg-bone p-6">
          <LoginForm />
        </div>

        {/* Legal */}
        <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-bib text-white/40">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
