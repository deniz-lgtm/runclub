import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RunClubWithCount } from "@/lib/queries/clubs";
import { MapPin, BadgeCheck } from "lucide-react";

/**
 * Club card — editorial listing with monogram stamp, display title,
 * and mono meta row.
 */
export function ClubCard({ club }: { club: RunClubWithCount }) {
  // First letter of the first two words (e.g., "Griffith Park" → GP).
  const monogram = club.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex items-start gap-3 rounded-sm border border-ink/15 bg-surface p-4 transition-colors hover:border-ink"
    >
      {/* Monogram stamp */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xs bg-ink text-white">
        <span className="font-display text-sm font-black leading-none tracking-tightest">
          {monogram}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-ink">
            {club.name}
          </h3>
          {club.is_verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-flash" />
          )}
        </div>
        {club.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">
            {club.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          {club.city && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {club.city}
              {club.state && `, ${club.state}`}
            </span>
          )}
          <span className="tabular-nums">
            {club.member_count} MEMBER{club.member_count === 1 ? "" : "S"}
          </span>
        </div>
      </div>

      {club.is_member && (
        <Badge variant="flash" className="shrink-0">
          {club.my_role}
        </Badge>
      )}
    </Link>
  );
}
