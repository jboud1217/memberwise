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
import { Clock, Plus, AlertCircle } from "lucide-react";
import { createVolunteerOpportunity, logVolunteerHours } from "@/actions/volunteers";

export function VolunteerActions({
  members,
  opportunities,
}: {
  members: { id: string; displayName: string }[];
  opportunities: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLogHours, setShowLogHours] = useState(false);
  const [showNewOpp, setShowNewOpp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLogHours(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await logVolunteerHours({
          memberId: form.get("memberId") as string,
          hours: Number(form.get("hours")),
          date: form.get("date") as string,
          description: (form.get("description") as string) || undefined,
          opportunityId: (form.get("opportunityId") as string) || undefined,
        });
        setShowLogHours(false);
        router.refresh();
      } catch {
        setError("Failed to log hours. Please try again.");
      }
    });
  }

  function handleCreateOpp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createVolunteerOpportunity({
          title: form.get("title") as string,
          description: (form.get("description") as string) || undefined,
          location: (form.get("location") as string) || undefined,
          date: (form.get("date") as string) || undefined,
          spotsAvailable: form.get("spotsAvailable")
            ? Number(form.get("spotsAvailable"))
            : undefined,
        });
        setShowNewOpp(false);
        router.refresh();
      } catch {
        setError("Failed to create opportunity. Please try again.");
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowLogHours(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Log Hours
        </Button>
        <Button onClick={() => setShowNewOpp(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      {/* Log Hours Dialog */}
      <Dialog open={showLogHours} onClose={() => setShowLogHours(false)}>
        <DialogClose onClose={() => setShowLogHours(false)} />
        <DialogHeader>
          <DialogTitle>Log Volunteer Hours</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogHours}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="memberId">Volunteer</Label>
              <select
                name="memberId"
                id="memberId"
                required
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">Select a member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  name="hours"
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="2.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  name="date"
                  id="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opportunityId">Opportunity (optional)</Label>
              <select
                name="opportunityId"
                id="opportunityId"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input name="description" id="description" placeholder="What did they work on?" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowLogHours(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Log Hours
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* New Opportunity Dialog */}
      <Dialog open={showNewOpp} onClose={() => setShowNewOpp(false)}>
        <DialogClose onClose={() => setShowNewOpp(false)} />
        <DialogHeader>
          <DialogTitle>New Volunteer Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateOpp}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input name="title" id="title" required placeholder="e.g. Community Clean-Up Day" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oppDescription">Description</Label>
              <textarea
                name="description"
                id="oppDescription"
                rows={3}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder="Describe the volunteer opportunity..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oppDate">Date</Label>
                <Input name="date" id="oppDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spotsAvailable">Spots Available</Label>
                <Input
                  name="spotsAvailable"
                  id="spotsAvailable"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input name="location" id="location" placeholder="e.g. City Park Pavilion" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowNewOpp(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
