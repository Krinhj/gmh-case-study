"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHelpers } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardProvider } from "@/contexts/dashboard-context";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const isAuth = await authHelpers.isAuthenticated();
        if (!isAuth) {
          router.push("/auth/login");
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // If auth check fails, redirect to login
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content */}
        <main
          className={
            cn(
              "flex-1 transition-all duration-300 ml-0 overflow-x-hidden",
              isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
            )
          }
        >
          {/* Top Bar */}
          <div className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Welcome back! Here&apos;s your application overview.
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Stats Cards */}
            <StatsCards />

            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Applications */}
            <RecentApplications />
          </div>
        </main>
        {/* Mobile overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden
          />
        )}
      </div>
    </DashboardProvider>
  );
}





