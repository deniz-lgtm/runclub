import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClubCard } from "@/components/clubs/club-card";
import { getAllClubsWithMembership } from "@/lib/queries/clubs";
import { requireProfile } from "@/lib/auth";
import { Plus } from "lucide-react";

/**
 * Clubs tab — discovery + "my clubs" split.
 *
 * Server component: fetches all clubs joined with my membership state
 * so we can show a "Your clubs" section at the top and "Discover"
 * below.
 */
export default async function ClubsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireProfile();
  const allClubs = await getAllClubsWithMembership(searchParams.q);

  const myClubs = allClubs.filter((c) => c.is_member);
  const otherClubs = allClubs.filter((c) => !c.is_member);

  return (
    <>
      <PageHeader title="Clubs" description="Find your crew.">
        <Button size="sm" asChild>
          <Link href="/clubs/new">
            <Plus className="h-4 w-4" /> New
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Search */}
        <form action="/clubs" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search clubs"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        {/* My clubs */}
        {myClubs.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your clubs ({myClubs.length})
            </h2>
            <div className="flex flex-col gap-2">
              {myClubs.map((c) => (
                <ClubCard key={c.id} club={c} />
              ))}
            </div>
          </section>
        )}

        {/* Discover */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {myClubs.length > 0 ? "Discover" : "All clubs"}
          </h2>

          {otherClubs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm font-semibold">
                  {searchParams.q
                    ? "No clubs match that search."
                    : "No clubs yet."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start one for your city.
                </p>
                <Button className="mt-3" asChild>
                  <Link href="/clubs/new">Create a club</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {otherClubs.map((c) => (
                <ClubCard key={c.id} club={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
