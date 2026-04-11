import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const DISTANCE_LABELS: Record<string, string> = {
  sprints: "Sprints",
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half Marathon",
  marathon: "Marathon",
  ultra: "Ultra",
};

/**
 * Profile summary — editorial bio card with display-type name,
 * mono location/handle, and a hairline-separated stats row.
 */
export function ProfileSummary({ profile }: { profile: Profile }) {
  const displayName = profile.display_name ?? profile.username;

  return (
    <div className="rounded-sm border border-ink/15 bg-surface p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-xs">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="rounded-xs bg-ink text-lg text-white">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-2xl font-black leading-none tracking-tightest text-ink">
              {displayName}
            </h2>
            {profile.is_coach && <Badge variant="flash">Coach</Badge>}
          </div>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
            @{profile.username}
            {profile.city && ` · ${profile.city}`}
            {profile.state && `, ${profile.state}`}
          </p>
          {profile.bio && (
            <p className="mt-3 text-sm leading-snug text-ink">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink/10 pt-4">
        <Stat
          label="Weekly"
          value={
            profile.weekly_mileage_goal != null
              ? `${profile.weekly_mileage_goal}`
              : "—"
          }
          unit="MI"
        />
        <Stat
          label="Focus"
          value={
            profile.preferred_distance
              ? DISTANCE_LABELS[profile.preferred_distance] ?? "—"
              : "—"
          }
        />
        <Stat label="Shoe" value={profile.current_shoe ?? "—"} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-bib text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1 truncate">
        <span className="font-display text-base font-black tracking-tight tabular-nums text-ink">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9px] font-bold uppercase text-ink-muted">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
