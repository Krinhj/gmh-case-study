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
  Filter
} from "lucide-react";

type JobApplication = {
  id: string;
  company: string;
  role: string;
  job_posting_url: string | null;
  job_description: string | null;
  status: "applied" | "interviewing" | "offer" | "rejected";
  match_score: number | null;
  notes: string | null;
  date_applied: string;
  created_at: string;
};

const statusConfig = {
  applied: { label: "Applied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  interviewing: { label: "Interviewing", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  offer: { label: "Offer", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
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

  const handleSave = async (data: any) => {
    if (!userId) return;

    const cacheKey = `job_applications_${userId}`;

    try {
      if (dialogMode === "add") {
        const { data: newApp, error } = await supabase
          .from("job_applications")
          .insert([{ ...data, user_id: userId }])
          .select()
          .single();

        if (error) throw error;

        const updatedApps = [newApp, ...applications];
        setApplications(updatedApps);
        localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
        toast.success("Application added successfully");
      } else {
        const { data: updatedApp, error } = await supabase
          .from("job_applications")
          .update(data)
          .eq("id", editingApplication?.id)
          .select()
          .single();

        if (error) throw error;

        const updatedApps = applications.map((app) =>
          app.id === updatedApp.id ? updatedApp : app
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {application.company}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {application.role}
                        </p>
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
                            <span className="font-semibold">{application.match_score}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${application.match_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes Preview */}
                    {application.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {application.notes}
                      </p>
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
