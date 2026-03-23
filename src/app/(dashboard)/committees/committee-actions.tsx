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
import { Plus, AlertCircle } from "lucide-react";
import { createCommittee } from "@/actions/committees";

export function CommitteeActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createCommittee({
          name: form.get("name") as string,
          description: (form.get("description") as string) || undefined,
          purpose: (form.get("purpose") as string) || undefined,
          meetingSchedule: (form.get("meetingSchedule") as string) || undefined,
          meetingLocation: (form.get("meetingLocation") as string) || undefined,
          meetingUrl: (form.get("meetingUrl") as string) || undefined,
        });
        setShowCreate(false);
        router.refresh();
      } catch {
        setError("Failed to create committee.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Committee
      </Button>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogClose onClose={() => setShowCreate(false)} />
        <DialogHeader>
          <DialogTitle>New Committee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Committee Name</Label>
              <Input name="name" id="name" required placeholder="e.g. Finance Committee" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                name="description"
                id="description"
                rows={2}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder="Brief description..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Charter</Label>
              <textarea
                name="purpose"
                id="purpose"
                rows={2}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder="What does this committee do?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingSchedule">Meeting Schedule</Label>
              <Input
                name="meetingSchedule"
                id="meetingSchedule"
                placeholder="e.g. First Monday of each month at 6 PM"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingLocation">Location</Label>
                <Input name="meetingLocation" id="meetingLocation" placeholder="Room 200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Virtual Meeting Link</Label>
                <Input name="meetingUrl" id="meetingUrl" type="url" placeholder="https://..." />
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Committee
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
