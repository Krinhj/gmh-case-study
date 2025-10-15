import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  User,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
