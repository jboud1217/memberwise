"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Plus,
  UserPlus,
  Clock,
  CreditCard,
  AlertTriangle,
  Mail,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getAutomations,
  createFromTemplate,
  updateAutomationStatus,
  deleteAutomation,
  AUTOMATION_TEMPLATES,
} from "@/actions/automations";

const TRIGGER_LABELS: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  MEMBER_JOINED: { label: "Member Joined", icon: UserPlus, color: "text-green-600" },
  MEMBER_LAPSED: { label: "Member Lapsed", icon: AlertTriangle, color: "text-orange-600" },
  RENEWAL_DUE: { label: "Renewal Due", icon: Clock, color: "text-blue-600" },
  PAYMENT_RECEIVED: { label: "Payment Received", icon: CreditCard, color: "text-emerald-600" },
  STATUS_CHANGED: { label: "Status Changed", icon: Zap, color: "text-purple-600" },
  SCHEDULED: { label: "Scheduled", icon: Clock, color: "text-indigo-600" },
  MANUAL: { label: "Manual", icon: Play, color: "text-gray-600" },
};

const ACTION_LABELS: Record<string, string> = {
  SEND_EMAIL: "Send Email",
  UPDATE_STATUS: "Update Status",
  NOTIFY_ADMIN: "Notify Admin",
  WAIT: "Wait",
};

type AutomationType = Awaited<ReturnType<typeof getAutomations>>[number];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [acting, startAction] = useTransition();

  useEffect(() => {
    getAutomations().then((data) => {
      setAutomations(data);
      setLoaded(true);
    });
  }, []);

  function reload() {
    getAutomations().then(setAutomations);
  }

  function handleCreateFromTemplate(templateId: string) {
    startAction(async () => {
      const result = await createFromTemplate(templateId);
      if ("success" in result) {
        setShowTemplates(false);
        reload();
      }
    });
  }

  function handleToggleStatus(automation: AutomationType) {
    const next = automation.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    startAction(async () => {
      await updateAutomationStatus(automation.id, next);
      reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this automation? This cannot be undone.")) return;
    startAction(async () => {
      await deleteAutomation(id);
      reload();
    });
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up automated workflows that trigger based on member activity
          </p>
        </div>
        <Button onClick={() => setShowTemplates(true)}>
          <Plus className="h-4 w-4" />
          New Automation
        </Button>
      </div>

      {/* Template Picker */}
      {showTemplates && (
        <Card className="mb-6 border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              Start from a Template
            </CardTitle>
            <CardDescription>
              Pre-built automations you can customize — or create one from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {AUTOMATION_TEMPLATES.map((t) => {
                const trigger = TRIGGER_LABELS[t.trigger];
                const TriggerIcon = trigger?.icon || Zap;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={acting}
                    onClick={() => handleCreateFromTemplate(t.id)}
                    className="rounded-lg border border-[var(--border)] bg-white p-4 text-left transition-all hover:border-[var(--primary)] hover:shadow-sm dark:bg-[var(--card)]"
                  >
                    <div className="flex items-center gap-2">
                      <TriggerIcon className={`h-4 w-4 ${trigger?.color || ""}`} />
                      <span className="text-sm font-semibold">{t.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t.description}</p>
                    <div className="mt-2 flex items-center gap-1">
                      {t.steps.map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {ACTION_LABELS[step.action] || step.action}
                          </Badge>
                          {i < t.steps.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                          )}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-right">
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Automations */}
      {automations.length === 0 && !showTemplates ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-semibold">No automations yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
              Automations run in the background to send emails, update statuses, and notify your
              team when things happen.
            </p>
            <Button className="mt-4" onClick={() => setShowTemplates(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => {
            const trigger = TRIGGER_LABELS[auto.trigger];
            const TriggerIcon = trigger?.icon || Zap;
            return (
              <Card key={auto.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`rounded-lg bg-[var(--muted)] p-2.5 ${trigger?.color || ""}`}>
                    <TriggerIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{auto.name}</h3>
                      <Badge
                        variant={
                          auto.status === "ACTIVE"
                            ? "success"
                            : auto.status === "PAUSED"
                              ? "warning"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {auto.status}
                      </Badge>
                    </div>
                    {auto.description && (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)] truncate">
                        {auto.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {trigger?.label || auto.trigger}
                      </Badge>
                      <span className="text-[10px] text-[var(--muted-foreground)]">→</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {auto.steps.length} {auto.steps.length === 1 ? "step" : "steps"}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">•</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {auto._count.runs} {auto._count.runs === 1 ? "run" : "runs"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={acting}
                      onClick={() => handleToggleStatus(auto)}
                    >
                      {auto.status === "ACTIVE" ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={acting}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(auto.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <Card className="mt-6">
        <CardContent className="py-6">
          <h3 className="text-sm font-semibold">How Automations Work</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Trigger fires</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Something happens — a member joins, payment comes in, or renewal is due
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Steps execute</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Send emails, update statuses, wait, then continue the sequence
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Track results</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  See how many runs completed, emails sent, and members engaged
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
