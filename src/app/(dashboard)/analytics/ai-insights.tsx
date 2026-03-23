"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { aiInsights } from "@/actions/ai";

export function AIInsightsCard() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const { insights: result } = await aiInsights();
      setInsights(result);
    } catch {
      setError("Failed to generate insights. Check your ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="lg:col-span-2 border-violet-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Insights
          </CardTitle>
          {insights && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading && !error && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 rounded-full bg-violet-50 p-3">
              <Sparkles className="h-6 w-6 text-violet-500" />
            </div>
            <p className="mb-1 text-sm font-medium">Get AI-powered insights</p>
            <p className="mb-4 max-w-sm text-xs text-[var(--muted-foreground)]">
              Our AI will analyze your membership data and provide actionable recommendations for growth and retention.
            </p>
            <Button
              onClick={handleGenerate}
              className="bg-violet-600 hover:bg-violet-700"
              size="sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate Insights
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-500" />
            <span className="text-sm text-[var(--muted-foreground)]">Analyzing your data...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {insights && !loading && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: insights
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
                .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$2</li>")
                .replace(/\n\n/g, "</p><p class='mt-2'>")
                .replace(/\n/g, "<br/>")
                .replace(/^/, "<p>")
                .replace(/$/, "</p>"),
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
