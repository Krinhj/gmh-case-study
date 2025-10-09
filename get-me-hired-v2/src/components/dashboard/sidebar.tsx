"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, Sparkles, User, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authHelpers } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const logoSrc = resolvedTheme === "light" ? "/getmehired-dark.svg" : "/getmehired-light.svg";

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = async () => {
    await authHelpers.logout();
    router.push("/auth/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const baseClasses = "fixed left-0 top-0 h-screen border-r bg-card flex flex-col transition-transform duration-300 z-40";
  const transformClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full";
  const widthClasses = isCollapsed ? "md:w-20" : "md:w-64";

  return (
    <aside className={`${baseClasses} w-64 md:translate-x-0 ${transformClasses} ${widthClasses}`}>
      {/* Logo */}
      <div className="p-6 border-b relative">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer w-full"
        >
          <Image
            src={logoSrc}
            alt="GetMeHired Logo"
            width={40}
            height={40}
            className="h-10 w-10 flex-shrink-0"
          />
          {!isCollapsed && <span className="text-xl font-bold">GetMeHired</span>}
        </button>
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 md:hidden"
          onClick={onMobileClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const linkClasses = cn(
            "group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            isActive
              ? "sidebar-active text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isCollapsed && "justify-center"
          );
          const iconClasses = cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          );
          const labelClasses = cn(
            "font-medium transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClasses}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={iconClasses} />
              {!isCollapsed && <span className={labelClasses}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className={`w-full gap-3 text-muted-foreground hover:text-foreground cursor-pointer ${
            isCollapsed ? "justify-center px-2" : "justify-start"
          }`}
          onClick={handleLogoutClick}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={handleLogoutConfirm}
        title="Logout"
        description="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="default"
      />
    </aside>
  );
}















