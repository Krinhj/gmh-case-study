"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ParsedResumeData } from "@/app/onboarding/page";
import { supabase } from "@/lib/supabase";
import { ResumeParsingLoader } from "@/components/ui/resume-parsing-loader";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

type ResumeParseResponse = {
  success: boolean;
  data: ParsedResumeData;
  error?: string;
};

interface ResumeUploadStepProps {
  onResumeDataLoaded: (parsedData: ParsedResumeData) => void;
  onSkip: () => void;
}

export function ResumeUploadStep({
  onResumeDataLoaded,
  onSkip,
}: ResumeUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsingStage, setParsingStage] = useState<"uploading" | "extracting" | "parsing" | "validating" | "complete">("uploading");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Immediately start processing
    await handleUploadAndParse(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndProcessFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndParse = async (file: File) => {
    setUploading(true);
    setParsing(true);
    setParsingStage("uploading");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      // Upload to Supabase Storage
      const fileName = `onboarding_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      setParsingStage("uploading");
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploading(false);

      // Call Edge Function to parse resume
      setParsingStage("extracting");

      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

      setParsingStage("parsing");

      const { data, error } = await supabase.functions.invoke<ResumeParseResponse>('parse-resume', {
        body: {
          file_url: filePath,
          user_id: user.id,
        },
      });

      if (error) {
        console.error("Edge Function error:", error);
        throw new Error(`Resume parsing failed: ${error.message || JSON.stringify(error)}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Resume parsing failed");
      }

      setParsingStage("validating");
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

      setParsingStage("complete");
      await new Promise(resolve => setTimeout(resolve, 800)); // Show success state

      // Pass parsed data to parent
      onResumeDataLoaded(data.data);

    } catch (error: unknown) {
      console.error("Resume upload error:", error);
      const message = getErrorMessage(error, "Failed to parse resume");
      toast.error(message);
      setParsing(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {parsing ? (
        <ResumeParsingLoader stage={parsingStage} />
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Quick Start with Your Resume</h2>
            <p className="text-muted-foreground">
              Upload your resume and we&apos;ll auto-fill your profile with AI
            </p>
          </div>

          {/* File Upload Area with Drag & Drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4 pointer-events-none">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">
                  Drag and drop your resume here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports PDF files up to 5MB • Auto-processes immediately
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Skip Button (Centered) */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={uploading || parsing}
              className="gap-2"
            >
              Skip and fill manually
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">How it works:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Upload your PDF resume (drag & drop or click)</li>
              <li>AI automatically extracts your experience, education, projects & skills</li>
              <li>Review and edit the auto-filled information</li>
              <li>Save time and get started faster!</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
