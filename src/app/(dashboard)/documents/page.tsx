import type { Metadata } from "next";
import { getDocuments, getDocumentFolders, getDocumentStats } from "@/actions/documents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Folder,
  Download,
  Eye,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { DocumentActions } from "./document-actions";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const [{ documents, total }, folders, stats] = await Promise.all([
    getDocuments({ pageSize: 50 }),
    getDocumentFolders(),
    getDocumentStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your organization&apos;s document library and resources
          </p>
        </div>
        <DocumentActions folders={folders.map((f) => ({ id: f.id, name: f.name }))} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Documents</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <Folder className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalFolders}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Folders</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Downloads</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Folders</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="cursor-pointer transition-all hover:bg-[var(--muted)]/30 hover:shadow-[var(--shadow-sm)] hover:scale-[1.02] active:scale-[0.98]">
                <CardContent className="flex items-center gap-3 p-4">
                  <Folder className="h-8 w-8 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{folder.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {folder._count.documents} files
                    </div>
                  </div>
                  {folder.memberOnly && !folder.isPublic && (
                    <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length === 0 && folders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Upload documents, bylaws, newsletters, and resources for your members to access.
            </p>
            <DocumentActions folders={[]} />
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold">All Documents</h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="transition-all hover:bg-[var(--muted)]/30 hover:shadow-[var(--shadow-sm)]">
                <CardContent className="flex items-center gap-4 p-4">
                  <FileText className="h-8 w-8 flex-shrink-0 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{doc.name}</span>
                      {doc.memberOnly && (
                        <Badge variant="secondary" className="text-[10px]">Members Only</Badge>
                      )}
                      {doc.isPublic && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Eye className="mr-1 h-3 w-3" />Public
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>{doc.fileName}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.folder && <span>in {doc.folder.name}</span>}
                      <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium">{doc.downloadCount}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">downloads</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
