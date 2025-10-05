"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
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

type JobApplication = {
  id: string;
  company: string;
  role: string;
  job_posting_url: string | null;
  job_description: string | null;
  status: "applied" | "interviewing" | "offer" | "rejected";
  match_score: number | null;
  match_insights: MatchInsights | null;
  notes: string | null;
  date_applied: string;
  created_at: string;
  location: string | null;
  work_mode: "remote" | "onsite" | "hybrid" | null;
  job_requirements: string | null;
  job_responsibilities: string | null;
  benefits: string | null;
  industry: string | null;
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
            const cachedApps = JSON.parse(cached);
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

        setApplication(data);
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

  const handleSave = async (data: JobApplication) => {
    if (!userId || !application) return;

    try {
      const { match_score: _matchScore, match_insights: _matchInsights, id: _ignoredId, ...rest } = data;
      void _matchScore;
      void _matchInsights;
      void _ignoredId;

      const { data: updatedApp, error } = await supabase
        .from("job_applications")
        .update(rest)
        .eq("id", application.id)
        .select()
        .single();

      if (error) throw error;

      let finalApp = updatedApp as JobApplication;

      try {
        const { updatedApp: analyzedApp, insights } = await analyzeAndStoreMatch(updatedApp.id);
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
        const cachedApps = JSON.parse(cached);
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
      <div className="flex h-screen bg-background">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="flex items-center justify-center h-full">
            <p>Application not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-5xl py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/applications")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{application.role}</h1>
                  <Badge
                    variant="outline"
                    className={statusConfig[application.status].color}
                  >
                    {statusConfig[application.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-lg">{application.company}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
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
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{formatDate(application.date_applied)}</p>
                    </div>
                  </div>

                  {application.match_score !== null && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Match Score
                      </label>
                      <div className="flex items-center gap-3 mt-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
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
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                  {application.location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Location
                      </label>
                      <p className="text-base mt-1">{application.location}</p>
                    </div>
                  )}

                  {application.work_mode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Work Mode
                      </label>
                      <p className="text-base mt-1 capitalize">{application.work_mode}</p>
                    </div>
                  )}

                  {application.industry && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Industry
                      </label>
                      <p className="text-base mt-1">{application.industry}</p>
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
                          <ExternalLink className="h-4 w-4 mr-2" />
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
            onInsightsUpdate={(latest) =>
              setApplication((prev) =>
                prev
                  ? {
                      ...prev,
                      match_insights: latest,
                      match_score: latest.match_score,
                    }
                  : prev
              )
            }
          />
        )}
      </main>
    </div>
  );
}
