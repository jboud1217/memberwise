"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Send } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    // TODO: Implement campaign creation server action
    setTimeout(() => {
      setSending(false);
      router.push("/email");
    }, 1000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Email Campaign</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Compose and send an email to your members</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recipients</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Member Status</Label>
              <Select id="statusFilter" name="statusFilter">
                <option value="">All members</option>
                <option value="ACTIVE">Active only</option>
                <option value="LAPSED">Lapsed only</option>
                <option value="PROSPECT">Prospects only</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierFilter">Membership Tier</Label>
              <Select id="tierFilter" name="tierFilter">
                <option value="">All tiers</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required placeholder="e.g. March Newsletter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" name="body" required rows={12} placeholder="Write your email content..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/email")}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Send Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
