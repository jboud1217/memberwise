"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Plus, X, DollarSign } from "lucide-react";
import { recordPayment } from "@/actions/payments";

interface Props {
  members: { id: string; displayName: string }[];
  defaultMemberId?: string;
}

export function RecordPaymentButton({ members, defaultMemberId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const memberId = form.get("memberId") as string;
    const amount = parseFloat(form.get("amount") as string);
    const method = form.get("method") as "CHECK" | "CASH" | "STRIPE" | "OTHER";
    const description = form.get("description") as string;
    const paidAt = form.get("paidAt") as string;

    if (!memberId || isNaN(amount) || amount <= 0) {
      setError("Please select a member and enter a valid amount");
      setSaving(false);
      return;
    }

    const result = await recordPayment({ memberId, amount, method, description, paidAt });
    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <DollarSign className="h-4 w-4" />
        Record Payment
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Record Payment</h2>
          <button onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-member">Member</Label>
            <Select id="pay-member" name="memberId" required defaultValue={defaultMemberId || ""}>
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount ($)</Label>
              <Input id="pay-amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-method">Method</Label>
              <Select id="pay-method" name="method">
                <option value="CHECK">Check</option>
                <option value="CASH">Cash</option>
                <option value="STRIPE">Stripe</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-desc">Description (optional)</Label>
            <Input id="pay-desc" name="description" placeholder="e.g. Annual dues 2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Payment Date</Label>
            <Input id="pay-date" name="paidAt" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
              Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
