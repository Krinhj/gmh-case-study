"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authHelpers } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen border-r bg-card flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer w-full"
        >
          <Image
            src="/getmehired.svg"
            alt="GetMeHired Logo"
            width={40}
            height={40}
            className="h-10 w-10 flex-shrink-0"
          />
          {!isCollapsed && <span className="text-xl font-bold">GetMeHired</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
