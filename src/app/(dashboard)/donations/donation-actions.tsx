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
import { Target, Plus, AlertCircle } from "lucide-react";
import { createDonationCampaign, recordDonation } from "@/actions/donations";

export function DonationActions({
  campaigns,
  members,
}: {
  campaigns: { id: string; name: string }[];
  members: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCampaign, setShowCampaign] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreateCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createDonationCampaign({
          name: form.get("name") as string,
          description: (form.get("description") as string) || undefined,
          goalAmount: form.get("goalAmount")
            ? Math.round(Number(form.get("goalAmount")) * 100)
            : undefined,
          startDate: (form.get("startDate") as string) || undefined,
          endDate: (form.get("endDate") as string) || undefined,
        });
        setShowCampaign(false);
        router.refresh();
      } catch {
        setError("Failed to create campaign.");
      }
    });
  }

  function handleRecordDonation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await recordDonation({
          amount: Math.round(Number(form.get("amount")) * 100),
          donorName: (form.get("donorName") as string) || undefined,
          donorEmail: (form.get("donorEmail") as string) || undefined,
          memberId: (form.get("memberId") as string) || undefined,
          campaignId: (form.get("campaignId") as string) || undefined,
          method: (form.get("method") as string) || undefined,
          isAnonymous: form.get("isAnonymous") === "on",
        });
        setShowDonation(false);
        router.refresh();
      } catch {
        setError("Failed to record donation.");
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowCampaign(true)}>
          <Target className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
        <Button onClick={() => setShowDonation(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Donation
        </Button>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showCampaign} onClose={() => setShowCampaign(false)}>
        <DialogClose onClose={() => setShowCampaign(false)} />
        <DialogHeader>
          <DialogTitle>New Fundraising Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateCampaign}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input name="name" id="name" required placeholder="e.g. Annual Fund Drive" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campDescription">Description</Label>
              <textarea
                name="description"
                id="campDescription"
                rows={3}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder="Describe the campaign..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Goal Amount ($)</Label>
              <Input
                name="goalAmount"
                id="goalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="10000.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input name="startDate" id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input name="endDate" id="endDate" type="date" />
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCampaign(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Donation Dialog */}
      <Dialog open={showDonation} onClose={() => setShowDonation(false)}>
        <DialogClose onClose={() => setShowDonation(false)} />
        <DialogHeader>
          <DialogTitle>Record Donation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleRecordDonation}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                name="amount"
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="100.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Donor Name</Label>
                <Input name="donorName" id="donorName" placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorEmail">Donor Email</Label>
                <Input name="donorEmail" id="donorEmail" type="email" placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="donMemberId">Link to Member (optional)</Label>
              <select
                name="memberId"
                id="donMemberId"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">No member link</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="donCampaignId">Campaign (optional)</Label>
              <select
                name="campaignId"
                id="donCampaignId"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  name="method"
                  id="method"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  <option value="CHECK">Check</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex items-end space-y-2">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="isAnonymous" className="cursor-pointer" />
                  Anonymous
                </label>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDonation(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Record Donation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
