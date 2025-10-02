"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type JobApplication = {
  id?: string;
  company: string;
  role: string;
  job_posting_url: string | null;
  job_description: string | null;
  status: "applied" | "interviewing" | "offer" | "rejected";
  match_score: number | null;
  notes: string | null;
  date_applied: string;
};

type ApplicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: JobApplication) => Promise<void>;
  application?: JobApplication | null;
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
  const [formData, setFormData] = useState<JobApplication>({
    company: "",
    role: "",
    job_posting_url: null,
    job_description: null,
    status: "applied",
    match_score: null,
    notes: null,
    date_applied: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (application && mode === "edit") {
      setFormData({
        ...application,
        job_posting_url: application.job_posting_url || "",
        job_description: application.job_description || "",
        notes: application.notes || "",
        date_applied: application.date_applied.split("T")[0],
      });
    } else if (mode === "add") {
      setFormData({
        company: "",
        role: "",
        job_posting_url: null,
        job_description: null,
        status: "applied",
        match_score: null,
        notes: null,
        date_applied: new Date().toISOString().split("T")[0],
      });
    }
  }, [application, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving application:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof JobApplication, value: any) => {
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
                onValueChange={(value) => updateField("status", value)}
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

          {/* Match Score */}
          <div className="space-y-2">
            <Label htmlFor="match_score">
              Match Score (0-100)
              <span className="text-xs text-muted-foreground ml-2">
                Optional - How well do you match this role?
              </span>
            </Label>
            <Input
              id="match_score"
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 85"
              value={formData.match_score ?? ""}
              onChange={(e) =>
                updateField(
                  "match_score",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
            />
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              placeholder="Paste the job description here..."
              value={formData.job_description || ""}
              onChange={(e) => updateField("job_description", e.target.value || null)}
              className="min-h-[100px]"
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
            <Button type="submit" disabled={isLoading}>
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
