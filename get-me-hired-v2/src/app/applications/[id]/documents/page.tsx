"use client";

import { useState, useEffect, useMemo } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";

type GeneratedDocument = {
  id: string;
  document_type: "resume" | "cover_letter";
  file_path: string;
  file_url: string | null;
  generated_at: string;
  job_application_id: string;
};

type ApplicationSummary = {
  id: string;
  role: string;
  company: string;
};

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getFileName = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
};

export default function ApplicationDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [application, setApplication] = useState<ApplicationSummary | null>(null);

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    let isCancelled = false;

    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const user = await authHelpers.getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const [{ data: applicationData, error: applicationError }, { data: documentsData, error: documentsError }] = await Promise.all([
          supabase
            .from("job_applications")
            .select("id, role, company")
            .eq("id", applicationId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("generated_documents")
            .select("id, document_type, file_path, file_url, generated_at, job_application_id")
            .eq("user_id", user.id)
            .eq("job_application_id", applicationId)
            .order("generated_at", { ascending: false }),
        ]);

        if (applicationError) {
          throw applicationError;
        }

        if (!isCancelled) {
          setApplication(applicationData as ApplicationSummary);
        }

        if (documentsError) {
          throw documentsError;
        }

        if (!isCancelled) {
          setDocuments(documentsData ?? []);
        }
      } catch (error) {
        console.error("Failed to load documents", error);
        toast.error("Unable to load generated documents");
        router.push("/applications");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [applicationId, router]);

  const resumes = useMemo(
    () => documents.filter((doc) => doc.document_type === "resume"),
    [documents]
  );

  const coverLetters = useMemo(
    () => documents.filter((doc) => doc.document_type === "cover_letter"),
    [documents]
  );

  const handleDownload = async (doc: GeneratedDocument) => {
    try {
      const bucket = supabase.storage.from("generated-documents");
      const { data: signedData, error: signedError } = await bucket.createSignedUrl(doc.file_path, 60);

      const downloadUrl = signedData?.signedUrl ?? doc.file_url ?? "";

      if (signedError && !downloadUrl) {
        throw signedError;
      }

      if (!downloadUrl) {
        throw new Error("Download link unavailable");
      }

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();

      toast.success("Download started");
    } catch (error) {
      console.error("Failed to download document", error);
      toast.error(error instanceof Error ? error.message : "Failed to download document");
    }
  };

  const renderDocumentSection = (
    title: string,
    description: string,
    items: GeneratedDocument[],
    icon: ElementType,
    emptyCtaLabel: string
  ) => {
    const Icon = icon;

    return (
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="mt-1 w-fit md:mt-0">
            {items.length} saved
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
              <p>No documents available yet.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/generate">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {emptyCtaLabel}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
                >
                  <div>
                    <p className="font-medium leading-tight">{formatDateTime(doc.generated_at)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{getFileName(doc.file_path)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="flex h-full items-center justify-center">
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
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Application not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-5xl py-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/applications/${application.id}`)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Application
              </Button>
              <h1 className="text-3xl font-bold leading-tight">Generated Documents</h1>
              <p className="text-muted-foreground mt-2">
                Saved resumes and cover letters created for {application.role} at {application.company}.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-1">
              <Link href="/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New Document
              </Link>
            </Button>
          </div>

          {renderDocumentSection(
            "Resumes",
            "AI-tailored resumes you've generated for this application.",
            resumes,
            FileText,
            "Generate a Resume"
          )}

          {renderDocumentSection(
            "Cover Letters",
            "Personalized cover letters saved for this role.",
            coverLetters,
            PenLine,
            "Generate a Cover Letter"
          )}
        </div>
      </main>
    </div>
  );
}
