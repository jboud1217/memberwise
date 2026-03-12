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
import { Send, Save, ArrowLeft, Users, Tag, Mail, AlertCircle } from "lucide-react";
import { createCampaign, sendCampaign } from "@/actions/email-campaigns";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSending(true);

    const form = new FormData(e.currentTarget);
    const subject = form.get("subject") as string;
    const body = form.get("body") as string;
    const statusFilter = form.get("statusFilter") as string;
    const tierFilter = form.get("tierFilter") as string;

    const result = await createCampaign({ subject, body, statusFilter, tierFilter });
    if ("error" in result) {
      setError(result.error || "Failed to create campaign");
      setSending(false);
      return;
    }

    await sendCampaign(result.campaign.id);
    setSending(false);
    router.push("/email");
  }

  async function handleSaveDraft(e: React.MouseEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = (e.target as HTMLElement).closest("form") as HTMLFormElement;
    const formData = new FormData(form);

    const result = await createCampaign({
      subject: formData.get("subject") as string,
      body: (formData.get("body") as string) || "",
      statusFilter: formData.get("statusFilter") as string,
      tierFilter: formData.get("tierFilter") as string,
    });

    if ("error" in result) {
      setError(result.error || "Failed to save draft");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/email");
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/email"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaigns
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Email Campaign</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">Compose and send an email to your members</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
                  Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input id="subject" name="subject" required placeholder="e.g. March Newsletter" className="text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    name="body"
                    required
                    rows={16}
                    placeholder="Write your email content here..."
                    className="min-h-[300px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

            {/* Actions */}
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                Send Campaign
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                Save as Draft
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/email")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
