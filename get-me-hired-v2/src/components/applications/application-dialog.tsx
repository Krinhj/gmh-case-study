"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { MatchInsights } from "@/components/applications/match-insights-dialog";

export type ApplicationFormData = {
  id?: string;
  company: string;
  role: string;
  job_posting_url: string | null;
  job_description: string | null;
  status: "applied" | "interviewing" | "offer" | "rejected";
  match_score: number | null;
  match_insights: MatchInsights | null;
  notes: string | null;
  date_applied: string;
  location: string | null;
  work_mode: "remote" | "onsite" | "hybrid" | null;
  job_requirements: string | null;
  job_responsibilities: string | null;
  benefits: string | null;
  industry: string | null;
};

type ApplicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ApplicationFormData) => Promise<void>;
  application?: ApplicationFormData | null;
  mode: "add" | "edit";
};

export function ApplicationDialog({
  open,
  onOpenChange,
  onSave,
  application,
  mode,
}: ApplicationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    company: "",
    role: "",
    job_posting_url: null,
    job_description: "",
    status: "applied",
    match_score: null,
    match_insights: null,
    notes: null,
    date_applied: new Date().toISOString().split("T")[0],
    location: null,
    work_mode: null,
    job_requirements: null,
    job_responsibilities: null,
    benefits: null,
    industry: null,
  });

  useEffect(() => {
    if (application && mode === "edit") {
      setFormData({
        ...application,
        job_posting_url: application.job_posting_url || "",
        job_description: application.job_description || "",
        notes: application.notes || "",
        location: application.location || "",
        job_requirements: application.job_requirements || "",
        job_responsibilities: application.job_responsibilities || "",
        benefits: application.benefits || "",
        industry: application.industry || "",
        date_applied: application.date_applied.split("T")[0],
      });
    } else if (mode === "add") {
      setFormData({
        company: "",
        role: "",
        job_posting_url: null,
        job_description: "",
        status: "applied",
        match_score: null,
        match_insights: null,
        notes: null,
        date_applied: new Date().toISOString().split("T")[0],
        location: null,
        work_mode: null,
        job_requirements: null,
        job_responsibilities: null,
        benefits: null,
        industry: null,
      });
    }
  }, [application, mode, open]);

  const isSaveDisabled =
    isLoading ||
    !formData.company.trim() ||
    !formData.role.trim() ||
    !formData.date_applied ||
    !formData.job_description?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        ...formData,
        job_description: formData.job_description?.trim() ?? "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving application:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Application" : "Edit Application"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details of your job application"
              : "Update the details of your application"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company and Role */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role/Position *</Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer"
                value={formData.role}
                onChange={(e) => updateField("role", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Status and Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField("status", value as ApplicationFormData["status"])}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_applied">Date Applied *</Label>
              <Input
                id="date_applied"
                type="date"
                value={formData.date_applied}
                onChange={(e) => updateField("date_applied", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Job Posting URL */}
          <div className="space-y-2">
            <Label htmlFor="job_posting_url">Job Posting URL</Label>
            <Input
              id="job_posting_url"
              type="text"
              placeholder="https://..."
              value={formData.job_posting_url || ""}
              onChange={(e) => updateField("job_posting_url", e.target.value || null)}
            />
          </div>

          {/* Location, Work Mode, Industry */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={formData.location || ""}
                onChange={(e) => updateField("location", e.target.value || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_mode">Work Mode</Label>
              <Select
                value={formData.work_mode || ""}
                onValueChange={(value) => updateField("work_mode", (value || null) as ApplicationFormData["work_mode"])}
              >
                <SelectTrigger id="work_mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Finance"
                value={formData.industry || ""}
                onChange={(e) => updateField("industry", e.target.value || null)}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="job_description">
              Job Description
              <span className="text-xs text-muted-foreground ml-2">
                Paste full job posting for AI match analysis
              </span>
            </Label>
            <Textarea
              id="job_description"
              placeholder="Paste the job description here..."
              value={formData.job_description ?? ""}
              onChange={(e) => updateField("job_description", e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Job Requirements */}
          <div className="space-y-2">
            <Label htmlFor="job_requirements">Requirements/Qualifications</Label>
            <Textarea
              id="job_requirements"
              placeholder="Required qualifications, skills, and experience..."
              value={formData.job_requirements || ""}
              onChange={(e) => updateField("job_requirements", e.target.value || null)}
              className="min-h-[100px]"
            />
          </div>

          {/* Job Responsibilities */}
          <div className="space-y-2">
            <Label htmlFor="job_responsibilities">Responsibilities</Label>
            <Textarea
              id="job_responsibilities"
              placeholder="Key responsibilities and duties..."
              value={formData.job_responsibilities || ""}
              onChange={(e) => updateField("job_responsibilities", e.target.value || null)}
              className="min-h-[100px]"
            />
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <Label htmlFor="benefits">Benefits & Perks</Label>
            <Textarea
              id="benefits"
              placeholder="Benefits, perks, and compensation details..."
              value={formData.benefits || ""}
              onChange={(e) => updateField("benefits", e.target.value || null)}
              className="min-h-[80px]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this application..."
              value={formData.notes || ""}
              onChange={(e) => updateField("notes", e.target.value || null)}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === "add" ? (
                "Add Application"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}














