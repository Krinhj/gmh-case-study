"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function TestParserPage() {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      // Upload to Supabase Storage
      const fileName = `test_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (error) throw error;

      const url = `${user.id}/${fileName}`;
      setFileUrl(url);

      toast.success("File uploaded successfully!");

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleParse = async () => {
    if (!fileUrl) {
      toast.error("Please upload a file first");
      return;
    }

    setParsing(true);
    setParsedData(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in first");
        setParsing(false);
        return;
      }

      console.log("Calling Edge Function directly...");
      console.log("File URL being sent:", fileUrl);
      console.log("User ID:", user.id);

      // Call Edge Function directly from client (bypasses API route auth issues)
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: {
          file_url: fileUrl,
          user_id: user.id,
        },
      });

      console.log("Edge Function response:", { data, error });

      if (error) {
        console.error("Edge Function error details:", error);
        throw new Error(`Edge Function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error("No data returned from Edge Function");
      }

      if (!data.success) {
        console.error("Parsing failed:", data.error);
        throw new Error(data.error || "Resume parsing failed");
      }

      setParsedData(data.data);
      toast.success("Resume parsed successfully!");

    } catch (error: any) {
      console.error("Parse error:", error);
      toast.error(error.message || "Failed to parse resume");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Parser Test</h1>
        <p className="text-muted-foreground mt-2">
          Upload your resume PDF to test the parser with anti-hallucination safeguards
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Resume</CardTitle>
          <CardDescription>Select a PDF file to upload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload">
              <Button disabled={uploading} asChild>
                <span className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF File
                    </>
                  )}
                </span>
              </Button>
            </label>
            {fileUrl && (
              <span className="text-sm text-muted-foreground">
                ✓ File uploaded: {fileUrl}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parse Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Parse Resume</CardTitle>
          <CardDescription>
            Extract structured data with anti-hallucination validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleParse}
            disabled={!fileUrl || parsing}
            size="lg"
          >
            {parsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing Resume...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Parse Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Data</CardTitle>
            <CardDescription>
              Review the extracted information (hallucinated data has been filtered out)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p><strong>Name:</strong> {parsedData.personal_info.name || "N/A"}</p>
                <p><strong>Email:</strong> {parsedData.personal_info.email || "N/A"}</p>
                <p><strong>Phone:</strong> {parsedData.personal_info.phone || "N/A"}</p>
                <p><strong>Location:</strong> {parsedData.personal_info.location || "N/A"}</p>
                {parsedData.personal_info.github && (
                  <p><strong>GitHub:</strong> {parsedData.personal_info.github}</p>
                )}
                {parsedData.personal_info.linkedin && (
                  <p><strong>LinkedIn:</strong> {parsedData.personal_info.linkedin}</p>
                )}
                {parsedData.personal_info.portfolio && (
                  <p><strong>Portfolio:</strong> {parsedData.personal_info.portfolio}</p>
                )}
              </div>
            </div>

            {/* Experience */}
            {parsedData.experience && parsedData.experience.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Experience ({parsedData.experience.length})
                </h3>
                {parsedData.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="bg-muted p-4 rounded-lg mb-2 text-sm">
                    <p className="font-medium">{exp.role} at {exp.company}</p>
                    <p className="text-muted-foreground text-xs">{exp.start_date} - {exp.end_date || "Present"}</p>
                    {exp.responsibilities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Responsibilities:</p>
                        <ul className="list-disc list-inside text-xs">
                          {exp.responsibilities.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exp.technologies.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Technologies:</p>
                        <p className="text-xs">{exp.technologies.join(", ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {parsedData.education && parsedData.education.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Education ({parsedData.education.length})
                </h3>
                {parsedData.education.map((edu: any, idx: number) => (
                  <div key={idx} className="bg-muted p-4 rounded-lg mb-2 text-sm">
                    <p className="font-medium">{edu.degree} in {edu.field_of_study}</p>
                    <p className="text-muted-foreground text-xs">{edu.institution}</p>
                    <p className="text-xs">{edu.start_date} - {edu.end_date || "Present"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {parsedData.projects && parsedData.projects.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Projects ({parsedData.projects.length})
                </h3>
                {parsedData.projects.map((proj: any, idx: number) => (
                  <div key={idx} className="bg-muted p-4 rounded-lg mb-2 text-sm">
                    <p className="font-medium">{proj.name}</p>
                    <p className="text-xs">{proj.description}</p>
                    {proj.technologies.length > 0 && (
                      <p className="text-xs mt-1">
                        <strong>Technologies:</strong> {proj.technologies.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {parsedData.skills && parsedData.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Skills ({parsedData.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill: any, idx: number) => (
                    <span
                      key={idx}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-sm">
                View Raw JSON
              </summary>
              <pre className="mt-2 p-4 bg-black text-white rounded-lg overflow-auto text-xs">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
