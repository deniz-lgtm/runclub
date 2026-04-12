import {
  Home,
  Map,
  Footprints,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  emoji: string;
}

/**
 * The five core tabs of Friends Who Run.
 * Order matters — this is the order in both the mobile bottom nav and
 * the desktop sidebar.
 *
 * Calendar tab removed — its content has been redistributed:
 *  - Friends' schedules → Feed tab (friends calendar feed)
 *  - Today's workout + personal schedule → Train tab
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Feed",     icon: Home,       emoji: "🏠" },
  { href: "/routes",   label: "Routes",   icon: Map,        emoji: "🗺️" },
  { href: "/train",    label: "Train",    icon: Footprints, emoji: "👟" },
  { href: "/clubs",    label: "Clubs",    icon: Users,      emoji: "🏃" },
  { href: "/profile",  label: "Profile",  icon: User,       emoji: "👤" },
];
