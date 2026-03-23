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
import {
  Send,
  Save,
  ArrowLeft,
  Users,
  Mail,
  AlertCircle,
  Sparkles,
  Loader2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { createCampaign, sendCampaign, scheduleCampaign } from "@/actions/email-campaigns";
import { aiDraftEmail } from "@/actions/ai";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  // Controlled form state for AI integration
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [showSchedule, setShowSchedule] = useState(false);

  async function handleSend() {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    setError("");
    setSending(true);

    const result = await createCampaign({ subject, body, statusFilter, tierFilter });
    if ("error" in result) {
      setError(result.error || "Failed to create campaign");
      setSending(false);
      return;
    }

    const sendResult = await sendCampaign(result.campaign.id);
    setSending(false);

    if ("error" in sendResult) {
      setError(sendResult.error);
      return;
    }

    router.push("/email");
  }

  async function handleSaveDraft() {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    setSaving(true);
    setError("");

    const result = await createCampaign({ subject, body, statusFilter, tierFilter });
    if ("error" in result) {
      setError(result.error || "Failed to save draft");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/email");
  }

  async function handleSchedule() {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!scheduleDate) {
      setError("Please select a date to schedule");
      return;
    }
    setError("");
    setScheduling(true);

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    const result = await createCampaign({
      subject,
      body,
      statusFilter,
      tierFilter,
      scheduledAt,
    });

    if ("error" in result) {
      setError(result.error || "Failed to schedule campaign");
      setScheduling(false);
      return;
    }

    setScheduling(false);
    router.push("/email");
  }

  async function handleAiDraft() {
    setAiLoading(true);
    try {
      const purpose = subject || "monthly member newsletter";
      const result = await aiDraftEmail(purpose);
      if (result.subject) setSubject(result.subject);
      if (result.body) setBody(result.body);
    } catch {
      setError("AI draft failed. Check your API key.");
    } finally {
      setAiLoading(false);
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <Link
        href="/email"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaigns
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Email Campaign</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          Compose and send an email to your members
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

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
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g. March Newsletter — What's New"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Body</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                    disabled={aiLoading}
                    onClick={handleAiDraft}
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiLoading ? "Drafting..." : "AI Draft"}
                  </Button>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={16}
                  placeholder="Write your email content here... (HTML supported)"
                  className="min-h-[300px] text-sm leading-relaxed"
                />
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Tip: Enter a subject line first, then click AI Draft to auto-generate the email body
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recipients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="statusFilter" className="text-xs">Member Status</Label>
                <Select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm"
                >
                  <option value="">All members</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="LAPSED">Lapsed only</option>
                  <option value="PROSPECT">Prospects only</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tierFilter" className="text-xs">Membership Tier</Label>
                <Select
                  id="tierFilter"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="text-sm"
                >
                  <option value="">All tiers</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showSchedule ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSchedule(true)}
                >
                  <CalendarDays className="h-4 w-4" />
                  Schedule for Later
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduleDate" className="text-xs">Date</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={today}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduleTime" className="text-xs">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleSchedule}
                      disabled={scheduling}
                    >
                      {scheduling ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <CalendarDays className="h-4 w-4" />
                      )}
                      {scheduling ? "Scheduling..." : "Schedule"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSchedule(false);
                        setScheduleDate("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Now"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/email")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
