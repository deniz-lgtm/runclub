"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  generateTrainingPlan,
  type GenerateResult,
} from "@/app/(app)/train/new/ai/actions";
import { GeneratedPlanPreview } from "./generated-plan-preview";
import { METHODOLOGY_PRESETS } from "@/lib/ai-plan";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

/**
 * AI training plan wizard.
 *
 * Three states:
 *   1. Form — runner fills in their goal + fitness + preferences
 *   2. Generating — loading state while Claude builds the plan
 *   3. Preview — GeneratedPlanPreview component, with accept / ask-coach / regenerate
 *
 * The server action returns the structured plan but doesn't persist
 * it — we only write to the DB when the user hits Accept on the
 * preview.
 */

const METHODOLOGY_OPTIONS = [
  { value: "generalist", label: "Generalist" },
  { value: "pfitzinger", label: "Pfitzinger" },
  { value: "hansons", label: "Hansons" },
  { value: "daniels", label: "Daniels" },
  { value: "couch_to_race", label: "Couch-to-Race" },
  { value: "minimalist", label: "Minimalist" },
] as const;

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface AiPlanFormProps {
  initialRemaining: number;
  limit: number;
}

export function AiPlanForm({ initialRemaining, limit }: AiPlanFormProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [methodology, setMethodology] = useState<string>("generalist");
  const remaining = result?.remaining ?? initialRemaining;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await generateTrainingPlan(formData);
      if (r.error) {
        setError(r.error);
      } else if (r.ok && r.plan && r.input) {
        setResult(r);
      }
    });
  }

  function handleRegenerate() {
    // Reset to form view. Runner can tweak inputs and try again.
    setResult(null);
  }

  // Preview state
  if (result?.plan && result?.input) {
    return (
      <GeneratedPlanPreview
        plan={result.plan}
        input={result.input}
        onRegenerate={handleRegenerate}
        remaining={remaining}
        limit={limit}
      />
    );
  }

  // Form state
  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {/* Rate limit banner */}
      <div className="flex items-center justify-between rounded-sm border border-ink/15 bg-surface p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-flash" />
          <span className="label-bib">AI plan builder</span>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted tabular-nums">
          {remaining}/{limit} LEFT TODAY
        </span>
      </div>

      <Section eyebrow="Your goal" title="What are you training for?">
        <Field label="Race name">
          <input
            name="goal_race"
            required
            placeholder="Chicago Marathon 2026"
            className={inputCls}
          />
        </Field>
        <Field label="Distance">
          <select name="goal_distance" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Pick one
            </option>
            <option value="5k">5K</option>
            <option value="10k">10K</option>
            <option value="half_marathon">Half marathon</option>
            <option value="marathon">Marathon</option>
            <option value="ultra">Ultra</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Race date">
            <input
              name="goal_race_date"
              type="date"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Goal time (optional)">
            <input
              name="goal_time"
              placeholder="3:45:00"
              className={`${inputCls} font-mono tabular-nums`}
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Your fitness" title="Where are you starting from?">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weekly miles">
            <input
              name="current_weekly_miles"
              type="number"
              min={0}
              step={1}
              required
              placeholder="20"
              className={`${inputCls} tabular-nums`}
            />
          </Field>
          <Field label="Longest run (mi)">
            <input
              name="longest_recent_run_miles"
              type="number"
              min={0}
              step={1}
              required
              placeholder="8"
              className={`${inputCls} tabular-nums`}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recent race distance">
            <input
              name="recent_race_distance"
              placeholder="5K (optional)"
              className={inputCls}
            />
          </Field>
          <Field label="Recent race time">
            <input
              name="recent_race_time"
              placeholder="22:30"
              className={`${inputCls} font-mono tabular-nums`}
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Your schedule" title="When can you run?">
        <Field label={`Days per week · ${daysPerWeek}`}>
          <input
            type="range"
            name="days_per_week"
            min={3}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-xs bg-ink/10 accent-flash"
          />
        </Field>
        <Field label="Protected rest days">
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <label
                key={d.value}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xs border border-ink/20 bg-surface px-2 py-1 text-[11px] font-bold uppercase tracking-bib text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  name="protected_rest_days"
                  value={d.value}
                  className="sr-only"
                />
                {d.label}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section eyebrow="Coaching style" title="How do you want your plan?">
        <Field label="Methodology">
          <div className="grid grid-cols-2 gap-2">
            {METHODOLOGY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "relative cursor-pointer rounded-sm border p-3 transition-colors",
                  methodology === opt.value
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 bg-surface text-ink hover:border-ink/40",
                )}
              >
                <input
                  type="radio"
                  name="methodology"
                  value={opt.value}
                  checked={methodology === opt.value}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="sr-only"
                />
                <div className="font-display text-xs font-extrabold uppercase tracking-bib">
                  {opt.label}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[10px] leading-snug",
                    methodology === opt.value
                      ? "text-white/70"
                      : "text-ink-muted",
                  )}
                >
                  {
                    METHODOLOGY_PRESETS[
                      opt.value as keyof typeof METHODOLOGY_PRESETS
                    ].blurb
                  }
                </div>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Pace style">
          <select
            name="pace_style"
            defaultValue="both"
            className={inputCls}
          >
            <option value="both">Both — effort words + specific paces</option>
            <option value="conversational">Conversational — effort words only</option>
            <option value="specific">Specific — numeric pace targets</option>
          </select>
        </Field>
      </Section>

      <Section eyebrow="Heads up" title="Anything the coach should know?">
        <Field label="Injuries or notes (optional)">
          <textarea
            name="injuries_or_notes"
            rows={3}
            placeholder="Old IT band issues; long runs need to be on trails"
            className="w-full resize-none rounded-xs border border-ink/20 bg-surface px-4 py-3 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
          />
        </Field>
      </Section>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="flash"
        size="lg"
        disabled={pending || remaining <= 0}
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Building your plan…
          </>
        ) : remaining <= 0 ? (
          "Daily limit reached"
        ) : (
          "Generate plan"
        )}
      </Button>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-xs border border-ink/20 bg-surface px-4 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-ink/10 bg-surface p-4">
      <div className="label-bib">{eyebrow}</div>
      <h2 className="mt-1 font-display text-lg font-extrabold leading-tight tracking-tightest text-ink">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-bib text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
