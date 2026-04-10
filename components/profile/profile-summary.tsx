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
 * Profile header card. Avatar, display name, username, bio, and the
 * three quick-stat tiles (weekly goal, current shoe, distance focus).
 */
export function ProfileSummary({ profile }: { profile: Profile }) {
  const displayName = profile.display_name ?? profile.username;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="text-lg">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold">{displayName}</h2>
            {profile.is_coach && <Badge>Coach</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            @{profile.username}
            {profile.city && ` • ${profile.city}`}
            {profile.state && `, ${profile.state}`}
          </p>
          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Stat
          label="Weekly goal"
          value={
            profile.weekly_mileage_goal != null
              ? `${profile.weekly_mileage_goal} mi`
              : "—"
          }
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
