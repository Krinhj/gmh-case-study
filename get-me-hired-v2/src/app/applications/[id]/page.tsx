"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNavDrawer } from "@/components/dashboard/mobile-nav-drawer";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import type { ApplicationFormData } from "@/components/applications/application-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Building2,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  TrendingUp,
  Briefcase,
  ArrowLeft,
  FileText,
  StickyNote,
  Info,
} from "lucide-react";
import { MatchInsightsDialog, type MatchInsights } from "@/components/applications/match-insights-dialog";

type JobApplication = Omit<ApplicationFormData, "id"> & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
};

const statusConfig = {
  applied: { label: "Applied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  interviewing: { label: "Interviewing", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  offer: { label: "Offer", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const getMatchScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const getMatchScoreBadgeColor = (score: number) => {
  if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  return "bg-red-500/10 text-red-600 border-red-500/20";
};

export default function ApplicationViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const user = await authHelpers.getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);

        // Try to load from cache first
        const cacheKey = `job_applications_${user.id}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const cachedApps = JSON.parse(cached) as JobApplication[];
            const cachedApp = cachedApps.find((app: JobApplication) => app.id === id);

            if (cachedApp) {
              setApplication(cachedApp);
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Error parsing cached applications:", e);
          }
        }

        // Fetch fresh data from Supabase in background
        const { data, error } = await supabase
          .from("job_applications")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error loading application:", error);
          toast.error("Failed to load application");
          router.push("/applications");
          return;
        }

        setApplication(data as JobApplication);
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
        router.push("/applications");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadApplication();
    }
  }, [id, router]);

  const analyzeAndStoreMatch = async (applicationId: string) => {
    if (!userId) {
      throw new Error("User not found");
    }

    const cacheKey = `job_applications_${userId}`;

    const { data, error } = await supabase.functions.invoke('analyze-job-match', {
      body: {
        user_id: userId,
        job_application_id: applicationId,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to analyze match");
    }

    if (!data.success) {
      throw new Error(data.error || "Match analysis failed");
    }

    const insights: MatchInsights = data.data;

    const { data: updatedApp, error: updateError } = await supabase
      .from("job_applications")
      .update({
        match_score: insights.match_score ?? null,
        match_insights: insights,
      })
      .eq("id", applicationId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    sessionStorage.setItem(
      `match_insights_${applicationId}`,
      JSON.stringify(insights)
    );

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedApps: JobApplication[] = JSON.parse(cached);
        const updatedCache = cachedApps.map((app) =>
          app.id === applicationId ? { ...app, ...updatedApp } : app
        );
        localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
      } catch (cacheError) {
        console.error("Error updating cached applications:", cacheError);
      }
    }

    return { updatedApp: updatedApp as JobApplication, insights } as const;
  };

  const handleSave = async (data: ApplicationFormData) => {
    if (!userId || !application) return;

    try {
      const targetApplicationId = data.id ?? application.id;

      const updatePayload = {
        company: data.company,
        role: data.role,
        job_posting_url: data.job_posting_url?.trim() || null,
        job_description: data.job_description ?? null,
        status: data.status,
        notes: data.notes?.trim() || null,
        date_applied: data.date_applied,
        location: data.location?.trim() || null,
        work_mode: data.work_mode ?? null,
        job_requirements: data.job_requirements?.trim() || null,
        job_responsibilities: data.job_responsibilities?.trim() || null,
        benefits: data.benefits?.trim() || null,
        industry: data.industry?.trim() || null,
      };

      const { data: updatedApp, error } = await supabase
        .from("job_applications")
        .update(updatePayload)
        .eq("id", targetApplicationId)
        .select()
        .single();

      if (error) throw error;
      if (!updatedApp) throw new Error("Application update returned no data");

      let finalApp = updatedApp as JobApplication;

      try {
        const { updatedApp: analyzedApp, insights } = await analyzeAndStoreMatch(targetApplicationId);
        finalApp = analyzedApp;
        toast.success(`Match score: ${insights.match_score}%`);
      } catch (analysisError) {
        console.error("Match analysis failed:", analysisError);
        toast.error("Updated, but match analysis failed. Try again later.");
      }

      setApplication(finalApp);

      const cacheKey = `job_applications_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedApps = JSON.parse(cached) as JobApplication[];
          const updatedApps = cachedApps.map((app) =>
            app.id === finalApp.id ? finalApp : app
          );
          localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
        } catch (cacheError) {
          console.error("Error updating cached applications:", cacheError);
        }
      }

      toast.success("Application updated successfully");
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application");
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!application || !userId) return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", application.id);

      if (error) throw error;

      // Update cache
      const cacheKey = `job_applications_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedApps = JSON.parse(cached) as JobApplication[];
        const updatedApps = cachedApps.filter((app: JobApplication) => app.id !== application.id);
        localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
      }

      toast.success("Application deleted successfully");
      router.push("/applications");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 ml-0",
            isCollapsed ? "md:ml-20" : "md:ml-64"
          )}
        >
          <div className="border-b bg-background sticky top-0 z-10">
            <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 sm:p-6">
              <MobileNavDrawer />
              <h1 className="text-center text-2xl font-bold sm:text-3xl">Application Details</h1>
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="flex min-h-[50vh] items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 ml-0",
            isCollapsed ? "md:ml-20" : "md:ml-64"
          )}
        >
          <div className="border-b bg-background sticky top-0 z-10">
            <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 sm:p-6">
              <MobileNavDrawer />
              <h1 className="text-center text-2xl font-bold sm:text-3xl">Application Details</h1>
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="flex min-h-[50vh] items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Application not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ml-0",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 sm:p-6">
            <MobileNavDrawer />
            <h1 className="text-center text-2xl font-bold sm:text-3xl">Application Details</h1>
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/applications")}
              className="w-full justify-center sm:w-fit sm:justify-start"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>

            <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold sm:text-3xl">{application.role}</h2>
                    <Badge
                      variant="outline"
                      className={statusConfig[application.status].color}
                    >
                      {statusConfig[application.status].label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:text-base">
                    <Building2 className="h-4 w-4" />
                    <span>{application.company}</span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-center sm:w-auto sm:justify-start"
                  >
                    <Link href={`/applications/${application.id}/documents`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="w-full justify-center sm:w-auto sm:justify-start"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="w-full justify-center sm:w-auto sm:justify-start text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Date Applied
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">{formatDate(application.date_applied)}</p>
                      </div>
                    </div>

                    {application.match_score !== null && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Match Score
                        </label>
                        <div className="mt-1 flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={getMatchScoreBadgeColor(application.match_score)}
                              >
                                {application.match_score}%
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInsightsDialogOpen(true)}
                              >
                                <Info className="mr-2 h-3 w-3" />
                                View Insights
                              </Button>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full transition-all ${getMatchScoreColor(application.match_score)}`}
                                style={{ width: `${application.match_score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Details Grid */}
                  <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
                    {application.location && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Location
                        </label>
                        <p className="mt-1 text-base">{application.location}</p>
                      </div>
                    )}

                    {application.work_mode && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Work Mode
                        </label>
                        <p className="mt-1 text-base capitalize">{application.work_mode}</p>
                      </div>
                    )}

                    {application.industry && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Industry
                        </label>
                        <p className="mt-1 text-base">{application.industry}</p>
                      </div>
                    )}
                  </div>

                  {application.job_posting_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Job Posting
                      </label>
                      <div className="mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={application.job_posting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Original Posting
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description */}
              {application.job_description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Job Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {application.job_description}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {application.job_requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Requirements & Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {application.job_requirements}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities */}
              {application.job_responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Responsibilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {application.job_responsibilities}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {application.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Benefits & Perks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {application.benefits}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {application.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {application.notes}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <ApplicationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          application={application}
          mode="edit"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Application"
          description="Are you sure you want to delete this application? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />

        {/* Match Insights Dialog */}
        {userId && application && (
          <MatchInsightsDialog
            open={insightsDialogOpen}
            onOpenChange={setInsightsDialogOpen}
            applicationId={application.id}
            userId={userId}
            currentMatchScore={application.match_score || 0}
            initialInsights={application.match_insights}
            onInsightsUpdate={(latest) => {
              setApplication((prev) =>
                prev
                  ? {
                      ...prev,
                      match_insights: latest,
                      match_score: latest.match_score,
                    }
                  : prev
              );
            }}
          />
        )}
      </main>
    </div>
  );
}
