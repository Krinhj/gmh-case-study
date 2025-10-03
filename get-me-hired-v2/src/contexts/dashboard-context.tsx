"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { authHelpers } from "@/lib/auth";

type Stats = {
  totalApplications: number;
  activeApplications: number;
  documentsGenerated: number;
  avgMatchScore: string;
};

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  date_applied: string;
};

type DashboardContextType = {
  stats: Stats | null;
  recentApplications: Application[];
  isLoading: boolean;
  refreshDashboard: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const user = await authHelpers.getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch stats with individual error handling
      const results = await Promise.allSettled([
        // Total applications
        supabase
          .from("job_applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Active applications
        supabase
          .from("job_applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["applied", "interviewing", "offer"]),

        // Documents generated
        supabase
          .from("generated_documents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Apps with scores for average
        supabase
          .from("job_applications")
          .select("match_score")
          .eq("user_id", user.id)
          .not("match_score", "is", null),

        // Recent applications
        supabase
          .from("job_applications")
          .select("id, company, role, status, date_applied")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Log any errors
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Dashboard query ${index} failed:`, result.reason);
        }
      });

      const totalCount = results[0].status === "fulfilled" ? results[0].value.count : 0;
      const activeCount = results[1].status === "fulfilled" ? results[1].value.count : 0;
      const docsCount = results[2].status === "fulfilled" ? results[2].value.count : 0;
      const appsWithScores = results[3].status === "fulfilled" ? results[3].value.data : [];
      const recentApps = results[4].status === "fulfilled" ? results[4].value.data : [];

      // Calculate average match score
      let avgScore = 0;
      if (appsWithScores && appsWithScores.length > 0) {
        const sum = appsWithScores.reduce((acc, app) => acc + (app.match_score || 0), 0);
        avgScore = Math.round(sum / appsWithScores.length);
      }

      setStats({
        totalApplications: totalCount || 0,
        activeApplications: activeCount || 0,
        documentsGenerated: docsCount || 0,
        avgMatchScore: `${avgScore}%`,
      });

      setRecentApplications(recentApps || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Set default values on error
      setStats({
        totalApplications: 0,
        activeApplications: 0,
        documentsGenerated: 0,
        avgMatchScore: "0%",
      });
      setRecentApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setIsLoading(true);
    await loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        stats,
        recentApplications,
        isLoading,
        refreshDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
