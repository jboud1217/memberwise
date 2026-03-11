"use client";

import { useState, useRef, useCallback } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  siteUrl: string;
}

const VIEWPORTS = [
  { name: "Desktop", icon: Monitor, width: "100%", cssWidth: "100%" },
  { name: "Tablet", icon: Tablet, width: "768px", cssWidth: "768px" },
  { name: "Mobile", icon: Smartphone, width: "375px", cssWidth: "375px" },
] as const;

export function LivePreview({ siteUrl }: LivePreviewProps) {
  const [viewport, setViewport] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const refresh = useCallback(() => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]">
        {/* Toolbar */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)] p-1">
              {VIEWPORTS.map((vp, i) => (
                <button
                  key={vp.name}
                  onClick={() => setViewport(i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    viewport === i
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  <vp.icon className="h-3.5 w-3.5" />
                  {vp.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{siteUrl}</span>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={refresh}
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex flex-1 items-start justify-center overflow-auto bg-[var(--muted)] p-4">
          <div
            className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)] transition-all duration-300"
            style={{ width: VIEWPORTS[viewport].cssWidth, maxWidth: "100%", height: "calc(100vh - 88px)" }}
          >
            <iframe
              ref={iframeRef}
              src={siteUrl}
              className="h-full w-full"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)] p-1">
          {VIEWPORTS.map((vp, i) => (
            <button
              key={vp.name}
              onClick={() => setViewport(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                viewport === i
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <vp.icon className="h-3.5 w-3.5" />
              {vp.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refresh}
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Refresh preview"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
        <div
          className="relative bg-white transition-all duration-300"
          style={{ width: VIEWPORTS[viewport].cssWidth, maxWidth: "100%", height: "500px" }}
        >
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--muted)]">
              <RefreshCw className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={siteUrl}
            className="h-full w-full"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
