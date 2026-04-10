import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Profile setup flow — Phase 1B brings this to life.
 *
 * This stub renders the step-1 form (username, city, preferred distance,
 * weekly mileage, bio) so the shape of the flow is visible. The form
 * doesn't submit yet; Phase 1B wires it to the profiles table.
 */
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-12 pb-12">
      <Card className="w-full max-w-xl border-border/80 shadow-lg">
        <CardHeader>
          <span className="inline-flex items-center self-start rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Step 1 of 1
          </span>
          <CardTitle className="text-2xl">Set up your profile</CardTitle>
          <CardDescription>
            A few quick details so your friends can find you and your
            calendar can feel useful from day one.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-5" action="#">
            <Field label="Display name" htmlFor="displayName">
              <input
                id="displayName"
                className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="How should we greet you?"
              />
            </Field>

            <Field label="Username" htmlFor="username">
              <div className="flex items-center rounded-lg border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                <span className="pl-4 text-sm text-muted-foreground">@</span>
                <input
                  id="username"
                  className="h-11 flex-1 bg-transparent px-2 text-sm outline-none"
                  placeholder="yourname"
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="City" htmlFor="city">
                <input
                  id="city"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  placeholder="Los Angeles"
                />
              </Field>
              <Field label="State" htmlFor="state">
                <input
                  id="state"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  placeholder="CA"
                />
              </Field>
            </div>

            <Field label="Preferred distance" htmlFor="preferred_distance">
              <select
                id="preferred_distance"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                defaultValue=""
              >
                <option value="" disabled>
                  Pick one
                </option>
                <option value="5k">5K</option>
                <option value="10k">10K</option>
                <option value="half_marathon">Half marathon</option>
                <option value="marathon">Marathon</option>
                <option value="ultra">Ultra</option>
                <option value="sprints">Sprints / track</option>
              </select>
            </Field>

            <Field label="Weekly mileage goal" htmlFor="weekly">
              <input
                id="weekly"
                type="number"
                min={0}
                className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="30"
              />
            </Field>

            <Field label="Bio (280 chars)" htmlFor="bio">
              <textarea
                id="bio"
                rows={3}
                maxLength={280}
                className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="What's your running story?"
              />
            </Field>

            <Button type="submit" size="lg" className="mt-2 w-full">
              Let&apos;s run
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
