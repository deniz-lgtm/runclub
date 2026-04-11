import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventRsvpButtons } from "@/components/clubs/event-rsvp-buttons";
import { getClubEventById } from "@/lib/queries/clubs";
import { requireProfile } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { ChevronLeft, Clock, MapPin, Calendar } from "lucide-react";

export default async function ClubEventDetailPage({
  params,
}: {
  params: { slug: string; eventId: string };
}) {
  const profile = await requireProfile();
  const result = await getClubEventById(params.eventId);
  if (!result) notFound();

  const { event, rsvps } = result as unknown as {
    event: {
      id: string;
      title: string;
      description: string | null;
      event_date: string;
      start_time: string | null;
      meetup_location: string | null;
      distance_miles: number | null;
      pace_description: string | null;
      event_type: string;
      run_clubs: { id: string; name: string; slug: string };
    };
    rsvps: Array<{
      user_id: string;
      status: "going" | "maybe" | "not_going";
      profile: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      };
    }>;
  };

  const myRsvp =
    rsvps.find((r) => r.user_id === profile.id)?.status ?? null;
  const going = rsvps.filter((r) => r.status === "going");
  const maybe = rsvps.filter((r) => r.status === "maybe");

  return (
    <>
      <PageHeader title={event.title}>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clubs/${params.slug}`}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Badge variant="muted" className="capitalize">
                {event.event_type.replace("_", " ")}
              </Badge>
              <Link
                href={`/clubs/${event.run_clubs.slug}`}
                className="text-[11px] text-muted-foreground hover:text-primary"
              >
                {event.run_clubs.name}
              </Link>
            </div>

            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Row icon={<Calendar className="h-3.5 w-3.5" />}>
                {formatEventDate(event.event_date)}
              </Row>
              {event.start_time && (
                <Row icon={<Clock className="h-3.5 w-3.5" />}>
                  {event.start_time.slice(0, 5)}
                </Row>
              )}
              {event.meetup_location && (
                <Row icon={<MapPin className="h-3.5 w-3.5" />}>
                  {event.meetup_location}
                </Row>
              )}
              {event.distance_miles != null && (
                <Row>{event.distance_miles} mi</Row>
              )}
              {event.pace_description && <Row>Pace: {event.pace_description}</Row>}
            </div>

            {event.description && (
              <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed">
                {event.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* RSVP */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your RSVP
            </div>
            <EventRsvpButtons
              eventId={event.id}
              slug={params.slug}
              initialStatus={myRsvp}
            />
          </CardContent>
        </Card>

        {/* Going list */}
        {going.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Going ({going.length})
            </h3>
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-3">
                {going.map((r) => (
                  <div
                    key={r.user_id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3"
                  >
                    <Avatar className="h-6 w-6">
                      {r.profile.avatar_url && (
                        <AvatarImage src={r.profile.avatar_url} />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {initials(r.profile.display_name ?? r.profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-semibold">
                      {r.profile.display_name ?? r.profile.username}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {maybe.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Maybe ({maybe.length})
            </h3>
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-3">
                {maybe.map((r) => (
                  <div
                    key={r.user_id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3"
                  >
                    <Avatar className="h-6 w-6">
                      {r.profile.avatar_url && (
                        <AvatarImage src={r.profile.avatar_url} />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {initials(r.profile.display_name ?? r.profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {r.profile.display_name ?? r.profile.username}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}

function Row({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
