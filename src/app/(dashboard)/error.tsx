"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100 mb-5">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1.5 text-sm text-[var(--muted-foreground)] text-center max-w-md">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)] font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} variant="outline" className="mt-5 gap-2 rounded-xl">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
