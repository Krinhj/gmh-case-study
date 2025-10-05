"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MatchInsights } from "@/components/applications/match-insights-dialog";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Building2,
  Calendar,
  Edit,
  Trash2,
  TrendingUp,
  Briefcase,
  Filter,
  RefreshCw
} from "lucide-react";

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

export default function ApplicationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
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
            const cachedData = JSON.parse(cached);
            setApplications(cachedData);
            setFilteredApplications(cachedData);
            setIsLoading(false);
          } catch (e) {
            console.error("Error parsing cached applications:", e);
          }
        }

        // Fetch fresh data from Supabase
        const { data, error } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("date_applied", { ascending: false });

        if (error) {
          console.error("Error loading applications:", error);
          toast.error("Failed to load applications");
          return;
        }

        // Update state and cache
        setApplications(data || []);
        setFilteredApplications(data || []);
        localStorage.setItem(cacheKey, JSON.stringify(data || []));
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [router]);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status === filterStatus)
      );
    }
  }, [filterStatus, applications]);

  const handleAddNew = () => {
    setDialogMode("add");
    setEditingApplication(null);
    setDialogOpen(true);
  };

  const handleEdit = (application: JobApplication) => {
    setDialogMode("edit");
    setEditingApplication(application);
    setDialogOpen(true);
  };

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
        const cachedData: JobApplication[] = JSON.parse(cached);
        const updatedCache = cachedData.map((app) =>
          app.id === applicationId ? { ...app, ...updatedApp } : app
        );
        localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
      } catch (cacheError) {
        console.error("Error updating cached insights:", cacheError);
      }
    }

    return { updatedApp: updatedApp as JobApplication, insights } as const;
  };

  const handleSave = async (data: JobApplication) => {
    if (!userId) return;

    const cacheKey = `job_applications_${userId}`;

    try {
      if (dialogMode === "add") {
        const { match_score: _matchScore, match_insights: _matchInsights, id: _ignoredId, ...rest } = data;
        void _matchScore;
        void _matchInsights;
        void _ignoredId;

        const { data: newApp, error } = await supabase
          .from("job_applications")
          .insert([{ ...rest, user_id: userId }])
          .select()
          .single();

        if (error) throw error;

        let finalApp = newApp as JobApplication;

        try {
          const { updatedApp, insights } = await analyzeAndStoreMatch(newApp.id);
          finalApp = updatedApp;
          toast.success(`Match score: ${insights.match_score}%`);
        } catch (analysisError) {
          console.error("Match analysis failed:", analysisError);
          toast.error("Saved, but match analysis failed. Try again later.");
        }

        const updatedApps = [finalApp, ...applications];
        setApplications(updatedApps);
        localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
        toast.success("Application added successfully");
      } else {
        if (!editingApplication) return;

        const { match_score: _matchScore, match_insights: _matchInsights, id: _ignoredId, ...rest } = data;
        void _matchScore;
        void _matchInsights;
        void _ignoredId;

        const { data: updatedApp, error } = await supabase
          .from("job_applications")
          .update(rest)
          .eq("id", editingApplication.id)
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

        const updatedApps = applications.map((app) =>
          app.id === finalApp.id ? finalApp : app
        );
        setApplications(updatedApps);
        localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
        toast.success("Application updated successfully");
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application");
      throw error;
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || !userId) return;

    const cacheKey = `job_applications_${userId}`;

    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      const updatedApps = applications.filter((app) => app.id !== deletingId);
      setApplications(updatedApps);
      localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyzeMatch = async (applicationId: string) => {
    if (!userId) return;

    setAnalyzingId(applicationId);
    toast.loading("Analyzing match score...", { id: `analyzing-${applicationId}` });

    try {
      const { updatedApp, insights } = await analyzeAndStoreMatch(applicationId);

      if (updatedApp) {
        const updatedApps = applications.map((app) =>
          app.id === applicationId ? updatedApp : app
        );
        setApplications(updatedApps);

        const cacheKey = `job_applications_${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
      }

      toast.success(`Match score: ${insights.match_score}%`, { id: `analyzing-${applicationId}` });
    } catch (error) {
      console.error("Error analyzing match:", error);
      const message = error instanceof Error ? error.message : "Failed to analyze match";
      toast.error(message, { id: `analyzing-${applicationId}` });
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-7xl py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Briefcase className="h-8 w-8" />
                Job Applications
              </h1>
              <p className="text-muted-foreground mt-2">
                Track and manage your job applications
              </p>
            </div>
            <Button size="lg" onClick={handleAddNew} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({applications.length})
              </Button>
              <Button
                variant={filterStatus === "applied" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("applied")}
              >
                Applied ({applications.filter(a => a.status === "applied").length})
              </Button>
              <Button
                variant={filterStatus === "interviewing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("interviewing")}
              >
                Interviewing ({applications.filter(a => a.status === "interviewing").length})
              </Button>
              <Button
                variant={filterStatus === "offer" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("offer")}
              >
                Offer ({applications.filter(a => a.status === "offer").length})
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected ({applications.filter(a => a.status === "rejected").length})
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredApplications.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {filterStatus === "all"
                    ? "No applications yet"
                    : `No ${filterStatus} applications`}
                </h3>
                <p className="text-muted-foreground">
                  {filterStatus === "all"
                    ? "Start tracking your job applications by clicking the button above"
                    : "Try changing the filter to see other applications"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Applications Grid */}
          {!isLoading && filteredApplications.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {application.company}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mb-1">
                          {application.role}
                        </p>
                        {/* Location and Work Mode directly below Role - always reserve space */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-h-[20px]">
                          {application.location && <span>{application.location}</span>}
                          {application.location && application.work_mode && <span>•</span>}
                          {application.work_mode && (
                            <span className="capitalize">{application.work_mode}</span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusConfig[application.status].color}
                      >
                        {statusConfig[application.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Date Applied */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Applied {formatDate(application.date_applied)}
                    </div>

                    {/* Match Score */}
                    {application.match_score !== null && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Match Score</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getMatchScoreBadgeColor(application.match_score)}
                              >
                                {application.match_score}%
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => handleAnalyzeMatch(application.id)}
                                disabled={analyzingId === application.id}
                                title="Re-calculate match score"
                              >
                                {analyzingId === application.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getMatchScoreColor(application.match_score)}`}
                              style={{ width: `${application.match_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/applications/${application.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(application)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(application.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Application Dialog */}
        <ApplicationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          application={editingApplication}
          mode={dialogMode}
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
      </main>
    </div>
  );
}
