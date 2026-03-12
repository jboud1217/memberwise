"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Plus, X } from "lucide-react";
import { createContact } from "@/actions/contacts";

interface Props {
  memberId?: string;
}

export function AddContactButton({ memberId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const result = await createContact({
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      mobile: form.get("mobile") as string,
      isPrimary: form.get("isPrimary") === "on",
      memberId: memberId || undefined,
    });

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
        <Plus className="h-4 w-4" />
        Add Contact
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Contact</h2>
          <button onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-first">First Name</Label>
              <Input id="ct-first" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-last">Last Name</Label>
              <Input id="ct-last" name="lastName" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-email">Email</Label>
            <Input id="ct-email" name="email" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-phone">Phone</Label>
              <Input id="ct-phone" name="phone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-mobile">Mobile</Label>
              <Input id="ct-mobile" name="mobile" type="tel" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPrimary" className="cursor-pointer" />
            Primary contact
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
