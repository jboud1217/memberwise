"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { FileText, Folder, Download, AlertCircle } from "lucide-react";
import { getPortalDocuments } from "@/actions/portal";

type DocData = Awaited<ReturnType<typeof getPortalDocuments>>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalDocumentsPage() {
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalDocuments()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">Unable to load documents.</p>
      </div>
    );
  }

  const { folders, rootDocuments } = data;
  const hasContent = folders.length > 0 || rootDocuments.length > 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Documents</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Access member-only documents and files shared by your organization.
      </p>

      {!hasContent ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="font-medium">No documents available</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Documents shared by your organization will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {folders.map((folder) => (
            <Card key={folder.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-5 w-5 text-[var(--primary)]" />
                  {folder.name}
                  <Badge variant="secondary" className="text-[10px]">
                    {folder.documents.length} {folder.documents.length === 1 ? "file" : "files"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {folder.documents.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No files in this folder.</p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {folder.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-[var(--muted-foreground)]">{doc.description}</p>
                            )}
                            <p className="text-[11px] text-[var(--muted-foreground)]">
                              {formatFileSize(doc.fileSize)} &middot; {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--accent)]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {rootDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[var(--border)]">
                  {rootDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-[var(--muted-foreground)]">{doc.description}</p>
                          )}
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            {formatFileSize(doc.fileSize)} &middot; {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--accent)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
