import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FriendRow } from "@/components/friends/friend-row";
import { FriendSearch } from "@/components/friends/friend-search";
import { getFriendshipsForCurrentUser } from "@/lib/queries/friendships";
import { requireProfile } from "@/lib/auth";

/**
 * Friends tab.
 *
 * Sections:
 *   1. Username search (add new friends)
 *   2. Incoming requests (accept / decline)
 *   3. Accepted friends
 *   4. Outgoing pending requests
 */
export default async function FriendsPage() {
  await requireProfile();
  const { accepted, incoming, outgoing } = await getFriendshipsForCurrentUser();

  return (
    <>
      <PageHeader
        title="Friends"
        description="Your crew. The whole point of FWR."
      />

      <div className="w-full px-4 space-y-5">
        {/* Search */}
        <section>
          <SectionHeader title="Add friends" />
          <Card>
            <CardContent className="p-4">
              <FriendSearch />
            </CardContent>
          </Card>
        </section>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section>
            <SectionHeader title="Requests" count={incoming.length} />
            <div className="flex flex-col gap-2">
              {incoming.map((f) => (
                <FriendRow
                  key={f.friendship_id}
                  profile={f.profile}
                  friendshipId={f.friendship_id}
                  variant="incoming"
                />
              ))}
            </div>
          </section>
        )}

        {/* Accepted */}
        <section>
          <SectionHeader
            title={`Friends${accepted.length ? ` (${accepted.length})` : ""}`}
          />
          {accepted.length === 0 ? (
            <EmptyState
              title="No friends yet"
              description="Search by username above and send a request. Once they accept, you'll see each other's scheduled runs on the calendar."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {accepted.map((f) => (
                <FriendRow
                  key={f.friendship_id}
                  profile={f.profile}
                  friendshipId={f.friendship_id}
                  variant="accepted"
                />
              ))}
            </div>
          )}
        </section>

        {/* Outgoing */}
        {outgoing.length > 0 && (
          <section>
            <SectionHeader title="Pending" count={outgoing.length} />
            <div className="flex flex-col gap-2">
              {outgoing.map((f) => (
                <FriendRow
                  key={f.friendship_id}
                  profile={f.profile}
                  friendshipId={f.friendship_id}
                  variant="outgoing"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {count != null && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
