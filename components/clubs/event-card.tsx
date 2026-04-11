import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventCardProps {
  slug: string;
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
  };
}

/**
 * Compact club event card used on the club detail page and the
 * calendar tab (when events are folded in).
 */
export function EventCard({ slug, event }: EventCardProps) {
  return (
    <Link
      href={`/clubs/${slug}/events/${event.id}`}
      className="group relative overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div
        className={
          "absolute inset-y-0 left-0 w-1 " +
          (event.event_type === "race"
            ? "bg-primary"
            : event.event_type === "workout"
              ? "bg-workout-intervals"
              : "bg-secondary")
        }
      />
      <div className="pl-2">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{event.title}</h3>
          <Badge variant="muted" className="text-[9px] capitalize">
            {event.event_type.replace("_", " ")}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-2.5 w-2.5" />
            {formatEventDate(event.event_date)}
          </span>
          {event.start_time && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {event.start_time.slice(0, 5)}
            </span>
          )}
          {event.meetup_location && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {event.meetup_location}
            </span>
          )}
          {event.distance_miles != null && (
            <span className="tabular-nums">{event.distance_miles} mi</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
