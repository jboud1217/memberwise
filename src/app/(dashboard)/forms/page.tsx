import type { Metadata } from "next";
import { getForms, getFormStats } from "@/actions/forms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  FileText,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { FormActions } from "./form-actions";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", className: "bg-red-100 text-red-700" },
};

const TYPE_LABEL: Record<string, string> = {
  general: "Survey",
  membership_application: "Application",
  event_feedback: "Event Feedback",
  volunteer_signup: "Volunteer Signup",
  contact: "Contact Form",
};

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const [{ forms, total }, stats] = await Promise.all([
    getForms({ pageSize: 50 }),
    getFormStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forms & Surveys</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Create forms, surveys, and applications for your members
          </p>
        </div>
        <FormActions />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalForms}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Forms</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.publishedForms}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Published</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalResponses}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Responses</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No forms yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Create surveys, membership applications, event feedback forms, and more.
            </p>
            <FormActions />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => {
            const badge = STATUS_BADGE[form.status] || STATUS_BADGE.DRAFT;
            return (
              <Card key={form.id} className="transition-all hover:bg-[var(--muted)]/30 hover:shadow-[var(--shadow-sm)]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]">
                    <ClipboardList className="h-5 w-5 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{form.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {TYPE_LABEL[form.formType] || form.formType}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span>{form._count.responses} responses</span>
                      {form.maxResponses && (
                        <span>Limit: {form.maxResponses}</span>
                      )}
                      {form.closesAt && (
                        <span>Closes {format(new Date(form.closesAt), "MMM d, yyyy")}</span>
                      )}
                      <span>Created {format(new Date(form.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.status === "PUBLISHED" && (
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
