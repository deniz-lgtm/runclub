import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventCard } from "@/components/clubs/event-card";
import { ClubMembershipButton } from "@/components/clubs/club-membership-button";
import { getClubBySlug } from "@/lib/queries/clubs";
import { requireProfile } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { BadgeCheck, ChevronLeft, MapPin, Plus } from "lucide-react";

export default async function ClubDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireProfile();
  const result = await getClubBySlug(params.slug);
  if (!result) notFound();

  const { club, members, events, myRole } = result;
  const isAdmin = myRole === "admin" || myRole === "organizer";

  return (
    <>
      <PageHeader title={club.name}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clubs">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Hero */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              {club.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
            </div>
            {club.city && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {club.city}
                {club.state && `, ${club.state}`}
              </div>
            )}
            {club.description && (
              <p className="mt-3 text-sm leading-relaxed">{club.description}</p>
            )}

            <div className="mt-4">
              <ClubMembershipButton
                clubId={club.id}
                slug={club.slug}
                isMember={myRole !== null}
                membershipType={club.membership_type}
              />
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming events
            </h2>
            {isAdmin && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/clubs/${club.slug}/events/new`}>
                  <Plus className="h-3 w-3" /> New
                </Link>
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-xs text-muted-foreground">
                No upcoming events.
                {isAdmin && " Create one to get the crew moving."}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((e) => (
                <EventCard key={e.id} slug={club.slug} event={e} />
              ))}
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Members ({members.length})
          </h2>
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                {members.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      {m.profile.avatar_url && (
                        <AvatarImage src={m.profile.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {initials(m.profile.display_name ?? m.profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">
                          {m.profile.display_name ?? m.profile.username}
                        </span>
                        {m.profile.is_coach && (
                          <Badge variant="secondary" className="text-[8px]">
                            Coach
                          </Badge>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        @{m.profile.username}
                      </div>
                    </div>
                    {m.role !== "member" && (
                      <Badge variant="muted" className="shrink-0 capitalize">
                        {m.role}
                      </Badge>
                    )}
                  </div>
                ))}
                {members.length > 10 && (
                  <p className="text-center text-[10px] text-muted-foreground">
                    +{members.length - 10} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
