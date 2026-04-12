"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { acceptGeneratedPlan } from "@/app/(app)/train/new/ai/actions";
import { cn } from "@/lib/utils";
import type { GeneratedPlan, PlanInput } from "@/lib/ai-plan";
import type { PlanVisibility } from "@/lib/types";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

interface GeneratedPlanPreviewProps {
  plan: GeneratedPlan;
  input: PlanInput;
  startDate: string | null; // computed plan start (ISO), null if unavailable
  onRegenerate: () => void;
  remaining: number;
  limit: number;
}

/**
 * Preview of a plan Claude just generated. Shows the summary, big
 * stat tiles, and every week collapsed by default so the runner can
 * drill into any specific week.
 *
 * Two CTAs at the bottom:
 *   - Accept & add to calendar → server action writes the plan
 *   - Regenerate (costs one of the daily attempts) → back to form
 *
 * The "Ask coach to adjust" flow is a follow-up — for now the
 * runner can accept and then open the coach from the plan detail
 * page.
 */
export function GeneratedPlanPreview({
  plan,
  input,
  startDate,
  onRegenerate,
  remaining,
  limit,
}: GeneratedPlanPreviewProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const [visibility, setVisibility] = useState<PlanVisibility>("friends_only");

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptGeneratedPlan({ plan, input, visibility });
      if (result?.error) setError(result.error);
      // on success the action redirects to /train/[planId]
    });
  }

  const totalWorkouts = plan.weeks.reduce(
    (sum, w) => sum + w.workouts.filter((x) => x.type !== "rest").length,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header with sparkle */}
      <div className="overflow-hidden rounded-sm border border-ink bg-ink text-white">
        <div className="h-1 w-full bg-flash" />
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-flash" />
            <span className="label-bib text-flash">AI plan · Preview</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-black leading-[0.95] tracking-tightest">
            {plan.title}
          </h2>
          <p className="mt-2 text-sm leading-snug text-white/70">
            {plan.summary}
          </p>

          {/* Start → Race date strip */}
          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-[10px] font-bold uppercase tracking-bib">
            <span className="text-flash">
              {startDate ? formatPreviewDate(startDate) : "TBD"}
            </span>
            <span className="text-white/30">→</span>
            <span className="text-white">
              {formatPreviewDate(input.goal_race_date)}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-white/60">
              {plan.total_weeks} weeks
            </span>
          </div>

          {/* Big stats */}
          <div className="mt-3 grid grid-cols-4 gap-3 border-t border-white/10 pt-3">
            <Stat label="Weeks" value={String(plan.total_weeks)} />
            <Stat label="Sessions" value={String(totalWorkouts)} />
            <Stat
              label="Peak"
              value={String(plan.peak_weekly_miles)}
              unit="MI"
            />
            <Stat label="Method" value={shortMethodology(plan.methodology)} small />
          </div>
        </div>
      </div>

      {/* Week-by-week */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-ink/20" />
          <div className="label-bib">Schedule</div>
          <div className="h-px flex-1 bg-ink/20" />
        </div>
        <div className="flex flex-col gap-2">
          {plan.weeks.map((week) => {
            const open = openWeek === week.week_number;
            return (
              <div
                key={week.week_number}
                className="overflow-hidden rounded-sm border border-ink/15 bg-surface"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenWeek(open ? null : week.week_number)
                  }
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink/5"
                >
                  <span className="bib">
                    {String(week.week_number).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-extrabold tracking-tight text-ink">
                        Week {week.week_number}
                      </span>
                      <PhaseBadge phase={week.phase} />
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
                      {week.focus} · {week.target_miles}MI
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-ink-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
                  )}
                </button>

                {open && (
                  <div className="border-t border-ink/10">
                    {week.workouts
                      .sort((a, b) => a.day_offset - b.day_offset)
                      .map((w, idx) => {
                        const style = styleForWorkout(w.type);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "relative flex items-start gap-3 p-3",
                              idx < week.workouts.length - 1 &&
                                "border-b border-ink/10",
                            )}
                          >
                            <div
                              className="absolute inset-y-0 left-0 w-[3px]"
                              style={{ backgroundColor: style.dot }}
                            />
                            <div className="w-9 shrink-0 pl-1 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                              {DAY_LABELS[w.day_offset]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-display text-xs font-extrabold tracking-tight text-ink">
                                  {w.title}
                                </span>
                                <WorkoutChip type={w.type} label={style.label} />
                              </div>
                              <p className="mt-1 text-xs leading-snug text-ink-muted">
                                {w.description}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                                {w.target_distance_miles != null && (
                                  <span className="tabular-nums text-ink">
                                    {w.target_distance_miles}MI
                                  </span>
                                )}
                                {w.target_duration_minutes != null && (
                                  <span className="tabular-nums">
                                    {w.target_duration_minutes}MIN
                                  </span>
                                )}
                                {w.target_pace && <span>{w.target_pace}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visibility picker */}
      <div className="rounded-sm border border-ink/15 bg-surface p-4">
        <div className="label-bib mb-2">Visibility</div>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as PlanVisibility)}
          className="h-11 w-full rounded-xs border border-ink/20 bg-surface px-4 text-sm outline-none focus:border-ink"
        >
          <option value="private">Private — only me</option>
          <option value="friends_only">
            Friends only — my crew can see
          </option>
          <option value="public">Public — anyone can see</option>
        </select>
      </div>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-bib text-siren">
          {error}
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <Button
          variant="flash"
          size="lg"
          onClick={handleAccept}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving plan…
            </>
          ) : (
            "Accept & add to calendar"
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onRegenerate}
          disabled={pending || remaining <= 0}
        >
          {remaining > 0
            ? `Regenerate (${remaining}/${limit} left)`
            : "Daily limit reached"}
        </Button>
      </div>

      <p className="text-center font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
        After accepting, open the Coach to tweak specific weeks or workouts.
      </p>
    </div>
  );
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function shortMethodology(m: string): string {
  if (m.length <= 10) return m.toUpperCase();
  return m.slice(0, 9).toUpperCase() + "…";
}

function Stat({
  label,
  value,
  unit,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-bib text-white/40">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1 truncate">
        <span
          className={cn(
            "font-display font-black leading-none tracking-tightest tabular-nums text-white",
            small ? "text-sm" : "text-xl",
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9px] font-bold uppercase text-white/50">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function formatPreviewDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PhaseBadge({ phase }: { phase: string }) {
  const label = phase.replace("_", " ");
  const variant =
    phase === "race_week" || phase === "peak"
      ? "flash"
      : phase === "taper"
        ? "solid"
        : "muted";
  return <Badge variant={variant as "flash" | "solid" | "muted"}>{label}</Badge>;
}
