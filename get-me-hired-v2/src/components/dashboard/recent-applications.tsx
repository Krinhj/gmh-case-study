"use client";

import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/contexts/dashboard-context";

const statusColors: Record<string, string> = {
  saved: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  interviewing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  accepted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function RecentApplications() {
  const { recentApplications, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <Card className="recent-app-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 sm:items-center">
            <div className="min-w-0">
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your latest job applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href="/applications">
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="recent-app-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 sm:items-center">
          <div className="min-w-0">
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link href="/applications">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentApplications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No applications yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/applications">Add your first application</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="recent-app-item flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold leading-tight break-words">{app.role}</h3>
                    <Badge className={statusColors[app.status] || statusColors.applied} variant="secondary">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{app.company}</span>
                    {app.date_applied && (
                      <>
                        <span>•</span>
                        <span>{new Date(app.date_applied).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/applications/${app.id}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
