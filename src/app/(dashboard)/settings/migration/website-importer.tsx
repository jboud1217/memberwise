"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, CheckCircle2, AlertCircle, Copy, ArrowRight } from "lucide-react";
import { scrapeWebsiteContent } from "@/actions/migration";
import Link from "next/link";

interface ExtractedPage {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
  links: string[];
}

export function WebsiteImporter() {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<ExtractedPage[] | null>(null);
  const [error, setError] = useState("");

  function handleScrape() {
    if (!url.trim()) return;
    setError("");
    setResults(null);
    startTransition(async () => {
      try {
        const res = await scrapeWebsiteContent(url.trim());
        if ("error" in res) {
          setError(res.error);
        } else {
          setResults(res.pages);
        }
      } catch {
        setError("Failed to fetch website content. Make sure the URL is correct and publicly accessible.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScrape();
              }
            }}
            placeholder="https://yourorg.com"
            className="pl-9 text-sm"
            disabled={pending}
          />
        </div>
        <Button onClick={handleScrape} disabled={pending || !url.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan Site"}
        </Button>
      </div>

      <p className="text-[10px] text-[var(--muted-foreground)]">
        We&apos;ll scan your current website and extract text content, headings, and images so you can quickly populate your new Memberwise site.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-medium">
              Found {results.length} page{results.length !== 1 ? "s" : ""} of content
            </p>
          </div>

          {results.map((page, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{page.title || "Untitled Page"}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{page.url}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {page.headings.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {page.headings.length} heading{page.headings.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {page.paragraphs.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {page.paragraphs.length} text block{page.paragraphs.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {page.images.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {page.images.length} image{page.images.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preview of extracted content */}
              {page.headings.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Headings</p>
                  <div className="flex flex-wrap gap-1">
                    {page.headings.slice(0, 5).map((h, j) => (
                      <span key={j} className="rounded bg-[var(--muted)] px-2 py-0.5 text-[10px]">
                        {h.length > 50 ? h.slice(0, 50) + "..." : h}
                      </span>
                    ))}
                    {page.headings.length > 5 && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        +{page.headings.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {page.paragraphs.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Content Preview</p>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                    {page.paragraphs[0]}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
            <div className="flex-1">
              <p className="text-xs font-medium text-indigo-700">
                Ready to use this content in your new site?
              </p>
              <p className="text-[10px] text-indigo-600/70">
                Open the Site Builder and use the AI button on any section — paste your extracted content and it will format it perfectly.
              </p>
            </div>
            <Link href="/settings/template">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                Open Site Builder <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No content could be extracted. The site may be behind a login or use JavaScript rendering.
        </div>
      )}
    </div>
  );
}
