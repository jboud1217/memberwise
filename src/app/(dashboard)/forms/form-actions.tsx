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
import { Plus, AlertCircle } from "lucide-react";
import { createForm } from "@/actions/forms";

const FORM_TYPES = [
  { value: "general", label: "General Survey" },
  { value: "membership_application", label: "Membership Application" },
  { value: "event_feedback", label: "Event Feedback" },
  { value: "volunteer_signup", label: "Volunteer Signup" },
  { value: "contact", label: "Contact Form" },
];

const STARTER_FIELDS: Record<
  string,
  { id: string; label: string; type: "text" | "textarea" | "email" | "select"; required?: boolean; placeholder?: string }[]
> = {
  general: [
    { id: "name", label: "Your Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "comments", label: "Comments", type: "textarea" },
  ],
  membership_application: [
    { id: "firstName", label: "First Name", type: "text", required: true },
    { id: "lastName", label: "Last Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "phone", label: "Phone", type: "text" },
    { id: "reason", label: "Why do you want to join?", type: "textarea" },
  ],
  event_feedback: [
    { id: "name", label: "Your Name", type: "text" },
    { id: "rating", label: "Overall Rating", type: "select", required: true },
    { id: "feedback", label: "Feedback", type: "textarea", required: true },
  ],
  volunteer_signup: [
    { id: "name", label: "Full Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "availability", label: "Availability", type: "textarea", placeholder: "When are you available?" },
  ],
  contact: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "subject", label: "Subject", type: "text", required: true },
    { id: "message", label: "Message", type: "textarea", required: true },
  ],
};

export function FormActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const formType = (form.get("formType") as string) || "general";
    const fields = STARTER_FIELDS[formType] || STARTER_FIELDS.general;

    startTransition(async () => {
      try {
        await createForm({
          title: form.get("title") as string,
          description: (form.get("description") as string) || undefined,
          formType,
          fields,
        });
        setShowCreate(false);
        router.refresh();
      } catch {
        setError("Failed to create form.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Form
      </Button>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogClose onClose={() => setShowCreate(false)} />
        <DialogHeader>
          <DialogTitle>Create Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Form Title</Label>
              <Input name="title" id="title" required placeholder="e.g. Member Feedback Survey" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formDescription">Description</Label>
              <textarea
                name="description"
                id="formDescription"
                rows={2}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder="Brief description shown to respondents..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formType">Form Type</Label>
              <select
                name="formType"
                id="formType"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                {FORM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Starter fields will be pre-populated based on the type. You can customize them later.
              </p>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Form
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
