"use client";

import { MediaLibrary } from "../settings/template/media-library";

export default function AssetsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Upload and manage images used across your site.
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
