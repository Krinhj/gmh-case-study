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
      } catch (e) {
        console.error("Error parsing cached insights:", e);
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

  // Re-analyze match score
  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    toast.loading("Re-analyzing match score...", { id: "reanalyze" });

    try {
    const { data, error } = await supabase.functions.invoke('analyze-job-match', {
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

    const insights: MatchInsights = data.data;

    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        match_score: insights.match_score ?? null,
        match_insights: insights,
      })
      .eq("id", applicationId);

    if (updateError) {
      throw updateError;
    }

    sessionStorage.setItem(
      `match_insights_${applicationId}`,
      JSON.stringify(insights)
    );

    const cacheKey = `job_applications_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached) as Array<Record<string, unknown>>;
        const updatedCache = cachedData.map((app) =>
          app.id === applicationId
            ? { ...app, match_score: insights.match_score ?? null, match_insights: insights }
            : app
        );
        localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
      } catch (cacheError) {
        console.error("Error updating cached applications:", cacheError);
      }
    }

    setInsights(insights);
    onInsightsUpdate?.(insights);
    toast.success(`Match score updated: ${insights.match_score}%`, { id: "reanalyze" });
  } catch (error) {
    console.error("Error re-analyzing match:", error);
    const message = error instanceof Error ? error.message : "Failed to re-analyze match";
    toast.error(message, { id: "reanalyze" });
  } finally {
    setIsAnalyzing(false);
  }
  };

  // Calculate staleness
  const getStaleness = () => {
    if (!insights?.analyzed_at) return null;

    const analyzedDate = new Date(insights.analyzed_at);
    const now = new Date();
    const diffMs = now.getTime() - analyzedDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return { text: "Just now", color: "text-green-500", isStale: false };
    if (diffHours < 24) return { text: `${Math.floor(diffHours)} hour${Math.floor(diffHours) > 1 ? 's' : ''} ago`, color: "text-green-500", isStale: false };
    if (diffHours < 168) return { text: `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`, color: "text-yellow-500", isStale: true };
    return { text: `${Math.floor(diffHours / 168)} week${Math.floor(diffHours / 168) > 1 ? 's' : ''} ago`, color: "text-red-500", isStale: true };
  };

  const staleness = getStaleness();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] sm:!max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Match Analysis - {currentMatchScore}%
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of how well your profile matches this role
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !insights ? (
          <div className="py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No match analysis available yet.
            </p>
            <Button onClick={handleReanalyze} disabled={isAnalyzing}>
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
          <div className="space-y-4">
            {/* Staleness Indicator + Re-analyze Button */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {staleness && (
                  <>
                    <span className="text-sm text-muted-foreground">Last analyzed:</span>
                    <span className={`text-sm font-medium ${staleness.color}`}>
                      {staleness.text}
                    </span>
                    {staleness.isStale && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        May be outdated
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReanalyze}
                disabled={isAnalyzing}
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

            {/* Reasoning - Full Width */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Analysis
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insights.reasoning}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Recommendation:</span>
                <Badge variant={insights.should_apply ? "default" : "destructive"}>
                  {insights.should_apply ? "Apply" : "Reconsider"}
                </Badge>
              </div>
            </div>

            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Matching Skills */}
                {insights.matching_skills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600">
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

                {/* Strong Points */}
                {insights.strong_points.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">💪 Strong Points</h3>
                    <ul className="space-y-1.5">
                      {insights.strong_points.map((point, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Missing Skills */}
                {insights.missing_skills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-red-600">
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

                {/* Weak Points */}
                {insights.weak_points.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">⚠️ Areas to Address</h3>
                    <ul className="space-y-1.5">
                      {insights.weak_points.map((point, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">!</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations - Highlighted Container */}
            {insights.recommendations.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 border border-muted">
                <h3 className="text-sm font-semibold mb-3">⚡ Recommendations</h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
