"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function TryOutSection() {
  const [dataSource, setDataSource] = useState<"demo" | "own">("demo");
  const [jobPosting, setJobPosting] = useState("");

  const handleGenerate = () => {
    // TODO: Implement generation logic
    console.log("Generating with:", { dataSource, jobPosting });
  };

  return (
    <section id="try-out" className="container py-12 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold sm:text-4xl">See It In Action</h2>
          <p className="text-muted-foreground text-lg">
            Paste a job posting and generate a sample résumé instantly
          </p>
        </div>

        {/* Two Column Layout */}
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {/* Left: Job Posting Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-posting" className="text-base font-semibold">
                  Job Posting
                </Label>
                <Textarea
                  id="job-posting"
                  placeholder="Paste the job description here..."
                  className="min-h-[220px] sm:min-h-[300px] resize-none"
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                />
              </div>
            </div>

            {/* Right: Data Source Selection */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Choose Your Data Source</Label>
              </div>

              {/* Radio Options */}
              <div className="space-y-3">
                {/* Demo Data Option */}
                <label
                  className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    dataSource === "demo"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dataSource"
                    value="demo"
                    checked={dataSource === "demo"}
                    onChange={(e) => setDataSource(e.target.value as "demo")}
                    className="mt-1 h-4 w-4 text-primary"
                  />
                  <div className="space-y-1">
                    <div className="font-semibold">Use Demo Data</div>
                    <div className="text-sm text-muted-foreground">
                      Quick preview with sample profile
                    </div>
                  </div>
                </label>

                {/* Own Information Option */}
                <label
                  className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    dataSource === "own"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dataSource"
                    value="own"
                    checked={dataSource === "own"}
                    onChange={(e) => setDataSource(e.target.value as "own")}
                    className="mt-1 h-4 w-4 text-primary"
                  />
                  <div className="space-y-1">
                    <div className="font-semibold">Use My Information</div>
                    <div className="text-sm text-muted-foreground">
                      Fill in your details below
                    </div>
                  </div>
                </label>
              </div>

              {/* Conditional Form for Own Information */}
              {dataSource === "own" && (
                <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Quick info form will appear here (to be implemented)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg" className="w-full sm:w-auto gap-2"
              onClick={handleGenerate}
              disabled={!jobPosting.trim()}
              
            >
              <Sparkles className="h-5 w-5" />
              Generate Sample Documents
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}


