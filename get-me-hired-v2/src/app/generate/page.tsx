"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FileText, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface JobApplication {
  id: string;
  company: string;
  role: string;
  job_description: string;
  created_at: string;
}

export default function GeneratePage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>("");
  const [documentType, setDocumentType] = useState<"resume" | "cover_letter">("resume");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [generatedMetadata, setGeneratedMetadata] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .select("id, company, role, job_description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch job applications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedApplication) {
      toast.error("Please select a job application first");
      return;
    }

    setIsGenerating(true);
    setGeneratedHtml("");
    setGeneratedMetadata(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const functionName = documentType === "resume" ? "generate-resume" : "generate-cover-letter";

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
      setGeneratedMetadata(data.data.metadata);

      toast.success(`${documentType === "resume" ? "Resume" : "Cover Letter"} generated successfully`);

      // Auto-scroll to preview
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async (): Promise<Blob> => {
    if (!generatedHtml) throw new Error("No document to generate");

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
      // Clean up
      document.body.removeChild(container);
    }
  };

  const handleDownload = async () => {
    try {
      const pdfBlob = await generatePDF();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      const selectedApp = applications.find((app) => app.id === selectedApplication);
      const filename = `${documentType}_${selectedApp?.company}_${selectedApp?.role}.pdf`.replace(/\s+/g, "_");
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const pdfBlob = await generatePDF();
      const selectedApp = applications.find((app) => app.id === selectedApplication);
      const filename = `${user.id}/${selectedApplication}/${documentType}_${Date.now()}.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("generated-documents")
        .upload(filename, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("generated-documents")
        .getPublicUrl(filename);

      // Save to database
      const { error: dbError } = await supabase
        .from("generated_documents")
        .insert({
          user_id: user.id,
          job_application_id: selectedApplication,
          document_type: documentType,
          file_path: filename,
          file_url: publicUrl,
          generated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success("Document saved to your documents");
    } catch (error: any) {
      toast.error(error.message || "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedApp = applications.find((app) => app.id === selectedApplication);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-7xl py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Generate Documents</h1>
              <p className="text-muted-foreground mt-2">
                Create AI-tailored resumes and cover letters for your job applications
              </p>
            </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Generator</CardTitle>
            <CardDescription>
              Select a job application and choose the type of document to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Application Selector */}
            <div className="space-y-2">
              <Label htmlFor="application">Job Application</Label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading applications...</span>
                </div>
              ) : applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No job applications found. Create one first to generate documents.
                </p>
              ) : (
                <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                  <SelectTrigger id="application">
                    <SelectValue placeholder="Select a job application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.role} at {app.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Application Details */}
            {selectedApp && (
              <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                <h3 className="font-semibold">{selectedApp.role}</h3>
                <p className="text-sm text-muted-foreground">{selectedApp.company}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {selectedApp.job_description}
                </p>
              </div>
            )}

            {/* Document Type Selector */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <RadioGroup value={documentType} onValueChange={(value) => setDocumentType(value as "resume" | "cover_letter")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="resume" id="resume" />
                  <Label htmlFor="resume" className="font-normal cursor-pointer">
                    Resume
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cover_letter" id="cover_letter" />
                  <Label htmlFor="cover_letter" className="font-normal cursor-pointer">
                    Cover Letter
                  </Label>
                </div>
              </RadioGroup>
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
        {generatedHtml && (
          <Card ref={previewRef}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Preview</CardTitle>
                  <CardDescription>
                    Preview your generated {documentType === "resume" ? "resume" : "cover letter"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-8 bg-white"
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
