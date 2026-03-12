"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Plus, X } from "lucide-react";
import { inviteTeamMember } from "@/actions/team";
import { useRouter } from "next/navigation";

export function TeamActions({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const role = form.get("role") as "ADMIN" | "STAFF";

    const result = await inviteTeamMember({ email, role });
    setSending(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSuccess(`Invite sent to ${email}`);
    setShowInvite(false);
    router.refresh();
  }

  return (
    <div>
      {!showInvite ? (
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      ) : (
        <form onSubmit={handleInvite} className="flex items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <div className="space-y-1">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input id="invite-email" name="email" type="email" required placeholder="team@example.com" className="w-56" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role" className="text-xs">Role</Label>
            <Select id="invite-role" name="role">
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </Select>
          </div>
          <Button type="submit" disabled={sending} size="sm">
            {sending ? <Spinner className="h-4 w-4" /> : "Send"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
    </div>
  );
}
