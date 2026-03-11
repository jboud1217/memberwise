"use client";

import { useState, useRef, useCallback } from "react";
import { getAssetUploadUrl, listAssets, deleteAsset } from "@/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  X,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

interface Asset {
  key: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
}

interface MediaLibraryProps {
  /** When provided, clicking an asset calls this instead of copying URL */
  onSelect?: (url: string) => void;
  /** Show as compact inline picker vs full page */
  compact?: boolean;
}

export function MediaLibrary({ onSelect, compact }: MediaLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssets();
      setAssets(result);
      setLoaded(true);
    } catch {
      // S3 may not be configured yet
      setAssets([]);
      setLoaded(true);
    }
    setLoading(false);
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${timestamp}-${safeName}`;

      try {
        const { uploadUrl, publicUrl } = await getAssetUploadUrl(filename, file.type);
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        // Add to local list immediately
        setAssets((prev) => [
          {
            key: filename,
            filename,
            url: publicUrl,
            size: file.size,
            lastModified: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      await deleteAsset(filename);
      setAssets((prev) => prev.filter((a) => a.filename !== filename));
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(null);
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Lazy-load: show "Open Media Library" button until first load
  if (!loaded && !loading) {
    return (
      <Button variant="outline" size={compact ? "sm" : "default"} onClick={loadAssets}>
        <FolderOpen className="mr-2 h-4 w-4" />
        Open Media Library
      </Button>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Upload bar */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Spinner className="mr-2 h-3.5 w-3.5" />
          ) : (
            <Upload className="mr-2 h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
        <Button variant="outline" size="sm" onClick={loadAssets} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">
          {assets.length} file{assets.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Asset grid */}
      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-8">
          <ImageIcon className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No images uploaded yet</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Upload images to use in your site sections
          </p>
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
          {assets.map((asset) => (
            <div
              key={asset.filename}
              className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]"
            >
              <div
                className={`relative aspect-square cursor-pointer overflow-hidden ${
                  onSelect ? "hover:opacity-80" : ""
                }`}
                onClick={() => onSelect?.(asset.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium text-[var(--foreground)]">
                    {asset.filename.replace(/^\d+-/, "")}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {formatSize(asset.size)}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(asset.url)}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                      title="Select"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCopy(asset.url)}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                      title="Copy URL"
                    >
                      {copiedUrl === asset.url ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.filename)}
                    disabled={deleting === asset.filename}
                    className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                    title="Delete"
                  >
                    {deleting === asset.filename ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
