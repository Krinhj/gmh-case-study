"use client";

import { Briefcase, Clock, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/contexts/dashboard-context";

export function StatsCards() {
  const { stats, isLoading } = useDashboard();

  const statCards = [
    {
      title: "Total Applications",
      value: stats?.totalApplications.toString() || "0",
      icon: Briefcase,
      color: "text-blue-500",
    },
    {
      title: "Active Applications",
      value: stats?.activeApplications.toString() || "0",
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: "Documents Generated",
      value: stats?.documentsGenerated.toString() || "0",
      icon: FileText,
      color: "text-green-500",
    },
    {
      title: "Avg Match Score",
      value: stats?.avgMatchScore || "0%",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
