import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import Link from "next/link";

/**
 * Feed (home) — Phase 1A placeholder.
 *
 * Phase 5 fleshes this out with real activity items driven by Supabase
 * Realtime. For now we render a welcoming hero + a preview of the pieces
 * that will eventually live on the feed, driven by hard-coded fixtures
 * that match the seed users in supabase/seed.sql.
 */
export default function FeedPage() {
  return (
    <>
      <PageHeader
        title="Welcome to Friends Who Run"
        description="Your crew. Your miles. Your race."
      />

      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 space-y-4">
        {/* Hero card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-xl">You made it. 🎉</CardTitle>
            <CardDescription>
              Phase 1A foundation is live — auth, schema, the app shell, and
              stubs for every tab. The calendar, training plans, route
              generator, and AI coach land next.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/calendar">Open your calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/clubs">Find a run club</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Feed placeholder items */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Coming up
          </h2>
          <Badge variant="muted">Preview</Badge>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>{initials("Sarah K")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">Sarah K.</span> is doing an
                  8-mile long run <span className="font-semibold">Saturday at 7:00 AM</span>{" "}
                  from Griffith Park.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Marathon build • easy conversational pace
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled>
                    I&apos;m in
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    Maybe
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>{initials("Westside Track")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">Westside Track Club</span>{" "}
                  posted a new event: Tuesday Track Workout — 6×800m.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Santa Monica HS • 6:00 PM • all paces welcome
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="py-6 text-center text-xs text-muted-foreground">
          More activity will appear here as friends schedule runs.
        </p>
      </div>
    </>
  );
}
