import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FeedItem } from "@/components/social/feed-item";
import { requireProfile } from "@/lib/auth";
import { getFeed } from "@/lib/queries/feed";

/**
 * Home feed — editorial front page.
 *
 * Big editorial greeting, a hero "index" block with quick jump
 * actions, then the crew feed itself.
 */
export default async function FeedPage() {
  const profile = await requireProfile();
  const feed = await getFeed();
  const first = (profile.display_name ?? profile.username).split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow="Front page"
        title={`Morning, ${first}.`}
        description="Your crew. Your miles. Your race."
      />

      <div className="column space-y-4">
        {/* Hero index block */}
        <div className="overflow-hidden rounded-sm border border-ink bg-ink text-white">
          <div className="h-1 w-full bg-flash" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="bib border-white/30 bg-transparent text-white">
                01
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-white/50">
                Today · {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-black leading-tight tracking-tightest text-white">
              Ready to run?
            </h2>
            <p className="mt-2 text-sm leading-snug text-white/70">
              Your plan for the week is on the calendar. Open a workout
              to your crew and turn solo miles into a session.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="flash" size="sm" className="flex-1" asChild>
                <Link href="/calendar">Calendar</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-white/40 text-white hover:bg-white hover:text-ink"
                asChild
              >
                <Link href="/coach">Coach</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick links strip */}
        <div className="grid grid-cols-3 gap-2">
          <QuickLink href="/routes" index="02" label="Routes" />
          <QuickLink href="/train" index="03" label="Train" />
          <QuickLink href="/clubs" index="04" label="Clubs" />
        </div>

        {/* Feed */}
        {feed.length === 0 ? (
          <div className="rounded-sm border border-dashed border-ink/20 bg-surface p-5 text-center">
            <div className="label-bib mb-2">Quiet here</div>
            <p className="text-sm leading-snug text-ink">
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
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pt-2">
              <div className="h-px flex-1 bg-ink/20" />
              <div className="label-bib">Crew · Latest</div>
              <div className="h-px flex-1 bg-ink/20" />
            </div>
            <div className="flex flex-col gap-2">
              {feed.map((item) => (
                <FeedItem key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        )}

        <p className="pt-4 pb-2 text-center font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          Friends Who Run · FWR
        </p>
      </div>
    </>
  );
}

function QuickLink({
  href,
  index,
  label,
}: {
  href: string;
  index: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-start justify-between rounded-sm border border-ink/15 bg-surface p-3 transition-colors hover:border-ink hover:bg-ink hover:text-white"
    >
      <span className="font-mono text-[9px] font-bold tabular-nums text-ink-muted group-hover:text-white/60">
        {index}
      </span>
      <span className="mt-6 font-display text-sm font-extrabold uppercase tracking-bib text-ink group-hover:text-white">
        {label}
      </span>
    </Link>
  );
}
