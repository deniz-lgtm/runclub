"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  logRaceResult,
  type RaceResult,
} from "@/app/(app)/profile/race-actions";
import { Plus, Trophy } from "lucide-react";

interface RaceLogProps {
  races: RaceResult[];
}

/**
 * Race results log on the profile page. Shows past races + a form
 * to log new ones. Every runner tracks their PRs and race history.
 */
export function RaceLog({ races }: RaceLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await logRaceResult(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setShowForm(false);
      }
    });
  }

  return (
    <div className="rounded-sm border border-ink/15 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-flash" />
          <span className="label-bib">Race results</span>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3" />
            Log race
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          ref={formRef}
          action={handleSubmit}
          className="mb-4 flex flex-col gap-3 border-b border-ink/10 pb-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="Race name">
              <input
                name="race_name"
                required
                placeholder="LA Marathon"
                className={inputCls}
              />
            </Field>
            <Field label="Distance">
              <select name="distance" required defaultValue="" className={inputCls}>
                <option value="" disabled>Pick</option>
                <option value="5K">5K</option>
                <option value="10K">10K</option>
                <option value="Half Marathon">Half Marathon</option>
                <option value="Marathon">Marathon</option>
                <option value="Ultra">Ultra</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date">
              <input name="race_date" type="date" required className={inputCls} />
            </Field>
            <Field label="Finish time">
              <input
                name="finish_time"
                placeholder="1:45:32"
                className={`${inputCls} font-mono tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <input
              name="notes"
              placeholder="New PR! Felt strong at mile 10."
              className={inputCls}
            />
          </Field>
          {error && (
            <p className="font-mono text-[9px] uppercase tracking-bib text-siren">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="flash" size="sm" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : "Save race"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Race list */}
      {races.length === 0 ? (
        <p className="text-center text-xs text-ink-muted">
          No races logged yet. Tap &ldquo;Log race&rdquo; to add your first.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {races.map((race) => (
            <div
              key={race.id}
              className="flex items-center gap-3 rounded-xs border border-ink/10 bg-bone-soft/50 p-3"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xs border border-ink bg-bone">
                <span className="font-display text-sm font-black leading-none tracking-tightest text-ink">
                  {race.distance === "Marathon"
                    ? "26.2"
                    : race.distance === "Half Marathon"
                      ? "13.1"
                      : race.distance}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-xs font-extrabold text-ink">
                    {race.race_name}
                  </span>
                  <Badge variant="muted">{race.distance}</Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                  <span>{formatRaceDate(race.race_date)}</span>
                  {race.finish_time && (
                    <>
                      <span className="text-ink/20">·</span>
                      <span className="tabular-nums text-ink">
                        {race.finish_time}
                      </span>
                    </>
                  )}
                </div>
                {race.notes && (
                  <p className="mt-1 text-[10px] italic text-ink-muted">
                    {race.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xs border border-ink/20 bg-surface px-3 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-bold uppercase tracking-bib text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function formatRaceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
