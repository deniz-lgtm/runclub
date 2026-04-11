import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedItem } from "@/components/social/feed-item";
import { requireProfile } from "@/lib/auth";
import { getFeed } from "@/lib/queries/feed";

/**
 * Home feed.
 *
 * Server component: pulls the real feed (open friend invites →
 * club events → friends' completed workouts). New accounts with no
 * friends yet see an empty-state hero that nudges them toward the
 * Friends tab and the Clubs tab.
 */
export default async function FeedPage() {
  const profile = await requireProfile();
  const feed = await getFeed();

  return (
    <>
      <PageHeader
        title={`Hey, ${profile.display_name ?? profile.username} 👋`}
        description="Here's what your crew is up to."
      />

      <div className="w-full px-4 space-y-4">
        {/* Hero card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Ready to run?</CardTitle>
            <CardDescription>
              Your calendar has your plan for the week. Open a workout to
              friends and turn a solo run into a social one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/calendar">Open calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach">Ask your coach</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/friends">Find friends</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Feed */}
        {feed.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-center">
              <h2 className="text-sm font-semibold">Your feed is quiet</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Add friends and join a club — then you&apos;ll see their
                upcoming runs and completed workouts here.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild>
                  <Link href="/friends">Add friends</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/clubs">Browse clubs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coming up from your crew
            </h2>
            <div className="flex flex-col gap-2">
              {feed.map((item) => (
                <FeedItem key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        )}

        <p className="py-6 text-center text-[11px] text-muted-foreground">
          Friends Who Run • Phase 1 complete
        </p>
      </div>
    </>
  );
}
