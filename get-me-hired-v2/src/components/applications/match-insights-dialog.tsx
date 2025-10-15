"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Lightbulb, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type MatchInsights = {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strong_points: string[];
  weak_points: string[];
  recommendations: string[];
  should_apply: boolean;
  reasoning: string;
  analyzed_at: string;
};

type MatchInsightsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  userId: string;
  currentMatchScore: number;
  initialInsights?: MatchInsights | null;
  onInsightsUpdate?: (insights: MatchInsights) => void;
};

export function MatchInsightsDialog({
  open,
  onOpenChange,
  applicationId,
  userId,
  currentMatchScore,
  initialInsights,
  onInsightsUpdate,
}: MatchInsightsDialogProps) {
  const [insights, setInsights] = useState<MatchInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsLoading(true);

    const cached = sessionStorage.getItem(`match_insights_${applicationId}`);
    if (cached) {
      try {
        const parsedInsights: MatchInsights = JSON.parse(cached);
        setInsights(parsedInsights);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Error parsing cached insights:", error);
      }
    }

    if (initialInsights) {
      setInsights(initialInsights);
      sessionStorage.setItem(
        `match_insights_${applicationId}`,
        JSON.stringify(initialInsights)
      );
      setIsLoading(false);
      return;
    }

    setInsights(null);
    setIsLoading(false);
  }, [open, applicationId, initialInsights]);

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    toast.loading("Re-analyzing match score...", { id: "reanalyze" });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-job-match", {
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

      const newInsights: MatchInsights = data.data;

      const { error: updateError } = await supabase
        .from("job_applications")
        .update({
          match_score: newInsights.match_score ?? null,
          match_insights: newInsights,
        })
        .eq("id", applicationId);

      if (updateError) {
        throw updateError;
      }

      sessionStorage.setItem(
        `match_insights_${applicationId}`,
        JSON.stringify(newInsights)
      );

      const cacheKey = `job_applications_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached) as Array<Record<string, unknown>>;
          const updatedCache = cachedData.map((app) =>
            app.id === applicationId
              ? { ...app, match_score: newInsights.match_score ?? null, match_insights: newInsights }
              : app
          );
          localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
        } catch (cacheError) {
          console.error("Error updating cached applications:", cacheError);
        }
      }

      setInsights(newInsights);
      onInsightsUpdate?.(newInsights);
      toast.success(`Match score updated: ${newInsights.match_score}%`, { id: "reanalyze" });
    } catch (error) {
      console.error("Error re-analyzing match:", error);
      const message = error instanceof Error ? error.message : "Failed to re-analyze match";
      toast.error(message, { id: "reanalyze" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStaleness = () => {
    if (!insights?.analyzed_at) return null;

    const analyzedDate = new Date(insights.analyzed_at);
    const now = new Date();
    const diffMs = now.getTime() - analyzedDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      return { text: "Just now", color: "text-green-500", isStale: false };
    }

    if (diffHours < 24) {
      const value = Math.floor(diffHours);
      return { text: `${value} hour${value > 1 ? 's' : ''} ago`, color: "text-green-500", isStale: false };
    }

    if (diffHours < 168) {
      const value = Math.floor(diffHours / 24);
      return { text: `${value} day${value > 1 ? 's' : ''} ago`, color: "text-yellow-500", isStale: true };
    }

    const value = Math.floor(diffHours / 168);
    return { text: `${value} week${value > 1 ? 's' : ''} ago`, color: "text-red-500", isStale: true };
  };

  const staleness = getStaleness();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !w-full overflow-hidden p-0 sm:max-h-none sm:overflow-visible sm:!w-[90vw] sm:!max-w-[1200px]">
        <div className="flex max-h-[90vh] flex-col sm:block sm:max-h-none">
          <DialogHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-6">
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <TrendingUp className="h-5 w-5" />
              Match Analysis - {currentMatchScore}%
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              AI-powered review of how well your profile aligns with this role.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-6 sm:flex-none sm:overflow-visible sm:px-6 sm:pb-8">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !insights ? (
            <div className="space-y-4 py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No match analysis available yet.
              </p>
              <Button
                onClick={handleReanalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analyze Match
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Last analyzed:</span>
                  {staleness ? (
                    <>
                      <span className={`font-medium ${staleness.color}`}>{staleness.text}</span>
                      {staleness.isStale && (
                        <Badge variant="outline" className="border-yellow-500/60 text-yellow-600">
                          May be outdated
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span>Unknown</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReanalyze}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Re-analyze
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Analysis Overview
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {insights.reasoning}
                </p>
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Recommendation:</span>
                  <Badge variant={insights.should_apply ? "default" : "destructive"}>
                    {insights.should_apply ? "Apply" : "Reconsider"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {insights.matching_skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Matching Skills ({insights.matching_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {insights.matching_skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="border-green-500/50 text-green-600">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.strong_points.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Strengths</h3>
                      <ul className="space-y-1.5">
                        {insights.strong_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {insights.missing_skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <XCircle className="h-4 w-4" />
                        Missing Skills ({insights.missing_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {insights.missing_skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="border-red-500/50 text-red-600">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.weak_points.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Areas to Improve</h3>
                      <ul className="space-y-1.5">
                        {insights.weak_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {insights.recommendations.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Recommendations</h3>
                  <ul className="mt-3 space-y-2">
                    {insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
