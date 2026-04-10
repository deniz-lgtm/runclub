import {
  Home,
  Calendar,
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
 * The six core tabs of Friends Who Run.
 * Order matters — this is the order in both the mobile bottom nav and
 * the desktop sidebar.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Feed",     icon: Home,       emoji: "🏠" },
  { href: "/calendar", label: "Calendar", icon: Calendar,   emoji: "📅" },
  { href: "/routes",   label: "Routes",   icon: Map,        emoji: "🗺️" },
  { href: "/train",    label: "Train",    icon: Footprints, emoji: "👟" },
  { href: "/clubs",    label: "Clubs",    icon: Users,      emoji: "🏃" },
  { href: "/profile",  label: "Profile",  icon: User,       emoji: "👤" },
];
