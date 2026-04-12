import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FriendsFeedView } from "@/components/feed/friends-feed-view";
import { requireProfile } from "@/lib/auth";
import { MOCK_FRIEND_RUNS } from "@/lib/mock-data";

/**
 * Feed tab — friends calendar feed.
 *
 * The first thing you see: a monthly calendar showing which friends
 * are running on which days (as little colored avatars), then a
 * scrollable list of upcoming friend workouts with enough detail
 * to decide "can I join?". Tap any workout to see the full
 * breakdown — warm up, intervals, paces, rest, cool down.
 */
export default async function FeedPage() {
  const profile = await requireProfile();
  const first = (profile.display_name ?? profile.username).split(" ")[0];

  // Phase 2 will wire this to real friend data via run_invites + friendships.
  // For now, use the enriched mock data that includes full workout segments.
  const friendRuns = MOCK_FRIEND_RUNS;

  return (
    <>
      <PageHeader
        eyebrow="Feed"
        title={`Your crew, ${first}.`}
        description="See what your friends are running — tap any workout for the full breakdown."
      />

      <div className="column space-y-4">
        {friendRuns.length === 0 ? (
          <div className="mx-4 rounded-sm border border-dashed border-ink/20 bg-surface p-5 text-center">
            <div className="label-bib mb-2">No friends yet</div>
            <p className="text-sm leading-snug text-ink">
              Add friends to see their training on your calendar.
              You&apos;ll be able to see their full workout breakdowns
              and decide when to join.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild>
                <Link href="/friends">Add friends</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/clubs">Browse clubs</Link>
              </Button>
            </div>
          </div>
        ) : (
          <FriendsFeedView friendRuns={friendRuns} />
        )}

        <p className="pt-4 pb-2 text-center font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          Friends Who Run · FWR
        </p>
      </div>
    </>
  );
}
