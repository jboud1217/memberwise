"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Folder, Upload, AlertCircle } from "lucide-react";
import { createDocumentFolder, createDocument } from "@/actions/documents";

export function DocumentActions({
  folders,
}: {
  folders: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showFolder, setShowFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreateFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createDocumentFolder({
          name: form.get("name") as string,
          description: (form.get("description") as string) || undefined,
          memberOnly: form.get("memberOnly") === "on",
          isPublic: form.get("isPublic") === "on",
        });
        setShowFolder(false);
        router.refresh();
      } catch {
        setError("Failed to create folder.");
      }
    });
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const fileUrl = form.get("fileUrl") as string;
    if (!fileUrl) {
      setError("Please provide a file URL.");
      return;
    }
    startTransition(async () => {
      try {
        await createDocument({
          name: form.get("name") as string,
          description: (form.get("description") as string) || undefined,
          fileName: (form.get("fileName") as string) || (form.get("name") as string),
          fileUrl,
          fileSize: 0,
          folderId: (form.get("folderId") as string) || undefined,
          memberOnly: form.get("memberOnly") === "on",
          isPublic: form.get("isPublic") === "on",
        });
        setShowUpload(false);
        router.refresh();
      } catch {
        setError("Failed to upload document.");
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowFolder(true)}>
          <Folder className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showFolder} onClose={() => setShowFolder(false)}>
        <DialogClose onClose={() => setShowFolder(false)} />
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateFolder}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input name="name" id="name" required placeholder="e.g. Bylaws & Policies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderDescription">Description (optional)</Label>
              <Input name="description" id="folderDescription" placeholder="What goes in this folder?" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="memberOnly" defaultChecked className="cursor-pointer" />
                Members only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="cursor-pointer" />
                Publicly visible on website
              </label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowFolder(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUpload} onClose={() => setShowUpload(false)}>
        <DialogClose onClose={() => setShowUpload(false)} />
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input name="name" id="docName" required placeholder="e.g. 2024 Annual Report" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input name="fileUrl" id="fileUrl" type="url" required placeholder="https://..." />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Paste a link to the file hosted on S3, Google Drive, Dropbox, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input name="fileName" id="fileName" placeholder="annual-report-2024.pdf" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docDescription">Description (optional)</Label>
              <Input name="description" id="docDescription" placeholder="Brief description..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docFolder">Folder (optional)</Label>
              <select
                name="folderId"
                id="docFolder"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">No folder (root level)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="memberOnly" defaultChecked className="cursor-pointer" />
                Members only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="cursor-pointer" />
                Publicly visible
              </label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Add Document
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
