"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Loader2,
  FileText,
  Download,
  Save,
  PenLine,
  Building2,
  MapPin,
  Briefcase,
  Gauge,
  AlertTriangle,
  Check,
  Search,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface JobApplication {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
  created_at: string;
  location: string | null;
  work_mode: "remote" | "onsite" | "hybrid" | null;
  match_score: number | null;
}

interface PersonalInfo {
  full_name: string | null;
}

type ExportFormat = "pdf" | "docx";

const NAME_SUFFIXES = new Set([
  "jr",
  "sr",
  "ii",
  "iii",
  "iv",
  "v",
]);

const DOCUMENT_TYPE_OPTIONS = [
  {
    value: "resume" as const,
    title: "Resume",
    description: "ATS-friendly resume tailored to the role you selected.",
    icon: FileText,
  },
  {
    value: "cover_letter" as const,
    title: "Cover Letter",
    description: "Personalized letter that speaks directly to the job description.",
    icon: PenLine,
  },
];

const getWorkModeLabel = (mode: "remote" | "onsite" | "hybrid" | null) => {
  switch (mode) {
    case "remote":
      return "Remote";
    case "onsite":
      return "On-site";
    case "hybrid":
      return "Hybrid";
    default:
      return null;
  }
};

const getMatchScoreBadgeClass = (score: number) => {
  if (score >= 80) return "border-green-500/30 bg-green-500/10 text-green-500";
  if (score >= 50) return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600";
  return "border-red-500/30 bg-red-500/10 text-red-500";
};

const formatMatchScore = (score: number | null) => {
  if (score === null || Number.isNaN(score)) {
    return null;
  }
  return `${Math.round(score)}%`;
};

export default function GeneratePage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>("");
  const [documentType, setDocumentType] = useState<"resume" | "cover_letter">("resume");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [generatedDocumentType, setGeneratedDocumentType] = useState<"resume" | "cover_letter" | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [savingFormat, setSavingFormat] = useState<ExportFormat | null>(null);
  const [isPreviewStale, setIsPreviewStale] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [applicationsResponse, personalInfoResponse] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id, company, role, job_description, created_at, location, work_mode, match_score")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("personal_info")
          .select("full_name")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (applicationsResponse.error) throw applicationsResponse.error;
      const fetchedApplications = applicationsResponse.data || [];
      setApplications(fetchedApplications);

      if (fetchedApplications.length > 0) {
        const sortedByCreatedAt = [...fetchedApplications].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setSelectedApplication((currentSelected) => {
          if (currentSelected && sortedByCreatedAt.some((app) => app.id === currentSelected)) {
            return currentSelected;
          }

          setGeneratedHtml("");
          setGeneratedDocumentType(null);
          setIsPreviewStale(false);
          return sortedByCreatedAt[0].id;
        });
      } else {
        setSelectedApplication((currentSelected) => {
          if (currentSelected !== "") {
            setGeneratedHtml("");
            setGeneratedDocumentType(null);
            setIsPreviewStale(false);
          }
          return "";
        });
      }

      if (!personalInfoResponse.error && personalInfoResponse.data) {
        setPersonalInfo(personalInfoResponse.data as PersonalInfo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch job applications";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const sortedApplications = useMemo(() => {
    return [...applications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return sortedApplications;
    }

    return sortedApplications.filter((app) => {
      const haystack = [
        app.role,
        app.company,
        app.location ?? "",
        getWorkModeLabel(app.work_mode) ?? "",
        formatMatchScore(app.match_score) ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [sortedApplications, searchTerm]);

  const handleDocumentTypeChange = (value: "resume" | "cover_letter") => {
    setDocumentType(value);

    if (!generatedDocumentType) {
      setIsPreviewStale(false);
      return;
    }

    setIsPreviewStale(generatedDocumentType !== value);
  };

  const handleSelectApplication = (applicationId: string) => {
    if (applicationId === selectedApplication) {
      return;
    }

    setSelectedApplication(applicationId);
    setGeneratedHtml("");
    setGeneratedDocumentType(null);
    setIsPreviewStale(false);
  };

  const handleGenerate = async () => {
    if (!selectedApplication) {
      toast.error("Please select a job application first");
      return;
    }

    setIsGenerating(true);
    setGeneratedHtml("");
    setGeneratedDocumentType(null);
    setIsPreviewStale(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const requestedDocumentType = documentType;
      const functionName = requestedDocumentType === "resume" ? "generate-resume" : "generate-cover-letter";

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          user_id: user.id,
          job_application_id: selectedApplication,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate document");
      }

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedHtml(data.data.html);
      setGeneratedDocumentType(requestedDocumentType);
      setIsPreviewStale(false);

      toast.success(`${requestedDocumentType === "resume" ? "Resume" : "Cover Letter"} generated successfully`);

      // Auto-scroll to preview
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate document";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const ensureDocumentAvailable = () => {
    if (!generatedHtml) throw new Error("No document to generate");
  };

  const generatePDF = async (): Promise<Blob> => {
    ensureDocumentAvailable();

    const root = document.documentElement;
    const previousColorMode = root.getAttribute("data-color-mode");
    const previousTransition = root.style.transition;
    const shouldOverrideColorMode = previousColorMode !== "basic";

    root.style.transition = "none";
    if (shouldOverrideColorMode) {
      root.setAttribute("data-color-mode", "basic");
    }

    // Create a temporary container
    const container = document.createElement("div");
    container.innerHTML = generatedHtml;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "8.5in";
    container.style.background = "white";
    document.body.appendChild(container);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: "letter",
      });

      const imgWidth = 8.5;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Return as blob
      return pdf.output("blob");
    } finally {
      if (shouldOverrideColorMode) {
        if (previousColorMode) {
          root.setAttribute("data-color-mode", previousColorMode);
        } else {
          root.removeAttribute("data-color-mode");
        }
      }
      root.style.transition = previousTransition;
      // Clean up
      document.body.removeChild(container);
    }
  };

  const generateDOCX = async (): Promise<Blob> => {
    ensureDocumentAvailable();

    const htmlDocument = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${generatedHtml}</body></html>`;

    const response = await fetch("/api/convert-docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: htmlDocument }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate DOCX");
    }

    const arrayBuffer = await response.arrayBuffer();

    return new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  const getDocumentTypeLabel = (type: "resume" | "cover_letter") =>
    type === "resume" ? "Resume" : "CoverLetter";

  const lastName = useMemo(() => {
    const fullName = personalInfo?.full_name?.trim();
    if (!fullName) return "Document";

    const parts = fullName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "Document";

    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const candidate = parts[i];
      const normalized = candidate.replace(/[^a-z0-9]/gi, "").toLowerCase();

      if (normalized && !NAME_SUFFIXES.has(normalized)) {
        return candidate;
      }
    }

    return parts[parts.length - 1];
  }, [personalInfo?.full_name]);

  const sanitizeSegment = (value: string | undefined | null) => {
    if (!value) return "";
    return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  };

  const buildBaseFilename = () => {
    const typeForFilename = generatedDocumentType ?? documentType;
    const documentLabel = getDocumentTypeLabel(typeForFilename);
    const lastNameSegment = sanitizeSegment(lastName);
    const companySegment = sanitizeSegment(selectedApp?.company);

    return [lastNameSegment || "Document", documentLabel, companySegment]
      .filter(Boolean)
      .join("_");
  };

  const createBlobForFormat = async (format: ExportFormat) => {
    return format === "pdf" ? generatePDF() : generateDOCX();
  };

  const handleDownload = async (format: ExportFormat) => {
    if (!selectedApplication) {
      toast.error("Please select a job application first");
      return;
    }
    if (!generatedDocumentType) {
      toast.error("Please generate a document before downloading");
      return;
    }
    if (isPreviewStale) {
      toast.error("Preview is outdated. Regenerate to download the latest version.");
      return;
    }
    try {
      const blob = await createBlobForFormat(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "pdf" ? "pdf" : "docx";
      const filename = `${buildBaseFilename()}.${extension}`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${extension.toUpperCase()} downloaded successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download document";
      toast.error(message);
    }
  };

  const handleSave = async (format: ExportFormat) => {
    if (!selectedApplication) {
      toast.error("Please select a job application first");
      return;
    }
    if (!generatedDocumentType) {
      toast.error("Please generate a document before saving");
      return;
    }
    if (isPreviewStale) {
      toast.error("Preview is outdated. Regenerate to save the latest version.");
      return;
    }
    setSavingFormat(format);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const blob = await createBlobForFormat(format);
      const selectedApp = applications.find((app) => app.id === selectedApplication);
      const extension = format === "pdf" ? "pdf" : "docx";
      const typeForStorage = generatedDocumentType ?? documentType;
      const baseFilename = buildBaseFilename() || `${typeForStorage}_${selectedApp?.company || "Document"}`;
      const storageKey = `${user.id}/${selectedApplication}/${typeForStorage}/${baseFilename}_${Date.now()}.${extension}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("generated-documents")
        .upload(storageKey, blob, {
          contentType:
            format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("generated-documents")
        .getPublicUrl(storageKey);

      // Save to database
      const { error: dbError } = await supabase
        .from("generated_documents")
        .insert({
          user_id: user.id,
          job_application_id: selectedApplication,
          document_type: typeForStorage,
          file_path: storageKey,
          file_url: publicUrl,
          generated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success(`${extension.toUpperCase()} saved to your documents`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save document";
      toast.error(message);
    } finally {
      setSavingFormat(null);
    }
  };

  const totalApplications = applications.length;
  const visibleApplications = filteredApplications.length;
  const selectedApp = applications.find((app) => app.id === selectedApplication);
  const isSaving = savingFormat !== null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />
      <main
        className={`ml-0 flex-1 overflow-x-hidden transition-all duration-300 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 sm:p-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-center text-2xl font-bold sm:text-3xl">Generate Documents</h1>
            <div className="flex items-center justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <p className="text-center text-sm text-muted-foreground sm:text-left sm:text-base">
              Create AI-tailored resumes and cover letters for your job applications
            </p>

            <Card>
          <CardHeader>
            <CardTitle>Document Generator</CardTitle>
            <CardDescription>
              Select a job application and choose the type of document to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Application Selector */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="application-search">Job Application</Label>
                <span className="text-xs text-muted-foreground">
                  Showing {visibleApplications} of {totalApplications} applications
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="application-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by role, company, location, or work mode..."
                  className="pl-9"
                />
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading applications...</span>
                </div>
              ) : totalApplications === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <p>You haven&apos;t added any job applications yet.</p>
                  <p className="mt-1">Create one to start generating tailored documents.</p>
                </div>
              ) : visibleApplications === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <p>
                    No job applications match{" "}
                    <span className="font-medium">{searchTerm}</span>.
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                  {filteredApplications.map((app) => {
                    const isActive = app.id === selectedApplication;
                    const workModeLabel = getWorkModeLabel(app.work_mode);
                    const matchLabel = formatMatchScore(app.match_score);

                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleSelectApplication(app.id)}
                        className={cn(
                          "flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition",
                          isActive
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/60 hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-tight">{app.role}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {app.company}
                              </span>
                              {app.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {app.location}
                                </span>
                              )}
                              {workModeLabel && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  {workModeLabel}
                                </span>
                              )}
                            </div>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        {matchLabel && app.match_score !== null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              getMatchScoreBadgeClass(app.match_score)
                            )}
                          >
                            <Gauge className="h-3 w-3" />
                            Match {matchLabel}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Application Details */}
            {selectedApp && (
              <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-tight">{selectedApp.role}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {selectedApp.company}
                      </span>
                      {selectedApp.location && (
                        <>
                          <span className="text-muted-foreground/50">{"\u2022"}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {selectedApp.location}
                          </span>
                        </>
                      )}
                      {getWorkModeLabel(selectedApp.work_mode) && (
                        <>
                          <span className="text-muted-foreground/50">{"\u2022"}</span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {getWorkModeLabel(selectedApp.work_mode)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedApp.match_score !== null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                        getMatchScoreBadgeClass(selectedApp.match_score)
                      )}
                    >
                      <Gauge className="h-3.5 w-3.5" />
                      Match {formatMatchScore(selectedApp.match_score)}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Document Type Selector */}
            <div className="space-y-3">
              <Label>Document Type</Label>
              <div role="radiogroup" className="grid gap-3 md:grid-cols-2">
                {DOCUMENT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = documentType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => handleDocumentTypeChange(option.value)}
                      onKeyDown={(event) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          handleDocumentTypeChange(option.value);
                        }
                      }}
                      className={cn(
                        "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/60"
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full text-primary transition",
                              isActive ? "bg-primary/10" : "bg-muted/50"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="space-y-1">
                            <p className="text-base font-semibold">{option.title}</p>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1 grid h-4 w-4 place-items-center rounded-full border-2 transition",
                            isActive ? "border-primary bg-primary" : "border-border"
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full transition",
                              isActive ? "bg-primary-foreground" : "bg-transparent"
                            )}
                          />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedApplication || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate {documentType === "resume" ? "Resume" : "Cover Letter"}
                </>
              )}
            </Button>
          </CardContent>
            </Card>

            {/* Preview Section */}
            {generatedHtml && generatedDocumentType && (
              <Card ref={previewRef}>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Document Preview</CardTitle>
                      <CardDescription>
                        Preview your generated {generatedDocumentType === "resume" ? "resume" : "cover letter"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDownload("pdf")}
                        disabled={isPreviewStale}
                        className="flex items-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload("docx")}
                        disabled={isPreviewStale}
                        className="flex items-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download DOCX
                      </Button>
                      <Button
                        onClick={() => handleSave("pdf")}
                        disabled={isSaving || isPreviewStale}
                        className="flex items-center"
                      >
                        {savingFormat === "pdf" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving PDF...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save PDF
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSave("docx")}
                        disabled={isSaving || isPreviewStale}
                        className="flex items-center"
                      >
                        {savingFormat === "docx" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving DOCX...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save DOCX
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {isPreviewStale && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        You generated a {generatedDocumentType === "resume" ? "resume" : "cover letter"}. Regenerate to create a new {documentType === "resume" ? "resume" : "cover letter"} before downloading or saving.
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div
                    className="min-w-full rounded-lg border bg-white p-6 sm:p-8"
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}








