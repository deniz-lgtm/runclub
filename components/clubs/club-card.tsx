import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RunClubWithCount } from "@/lib/queries/clubs";
import { Users, MapPin, BadgeCheck } from "lucide-react";

/**
 * Club discovery card. Shows name, city, verification badge,
 * member count, and current membership state.
 */
export function ClubCard({ club }: { club: RunClubWithCount }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
        <Users className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold">{club.name}</h3>
          {club.is_verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
        </div>
        {club.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
            {club.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          {club.city && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {club.city}
              {club.state && `, ${club.state}`}
            </span>
          )}
          <span className="tabular-nums">
            {club.member_count} member{club.member_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {club.is_member && (
        <Badge variant="muted" className="shrink-0 capitalize">
          {club.my_role}
        </Badge>
      )}
    </Link>
  );
}
