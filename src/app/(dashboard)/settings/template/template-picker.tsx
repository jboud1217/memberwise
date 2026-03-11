"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import { selectTemplate } from "@/actions/template";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Check } from "lucide-react";
import Image from "next/image";

interface TemplatePickerProps {
  currentTemplate: string;
}

export function TemplatePicker({ currentTemplate }: TemplatePickerProps) {
  const [selected, setSelected] = useState(currentTemplate);
  const [saving, setSaving] = useState(false);
  const hasChanges = selected !== currentTemplate;

  async function handleSave() {
    setSaving(true);
    await selectTemplate(selected);
    setSaving(false);
    window.location.reload(); // Refresh to pick up new site document
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelected(template.id)}
            className={`overflow-hidden rounded-lg border-2 text-left transition-all ${
              selected === template.id
                ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2"
                : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
            }`}
          >
            <div className="relative aspect-[16/9] bg-[var(--muted)] flex items-center justify-center overflow-hidden">
              <Image
                src={template.previewImage}
                alt={`${template.name} template preview`}
                fill
                className="object-cover"
              />
              {selected === template.id && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]">
                  <Check className="h-3.5 w-3.5 text-[var(--primary-foreground)]" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-medium text-[var(--foreground)]">{template.name}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{template.description}</p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Nav: {template.portalNavStyle} &middot; {template.pages.length} pages
              </p>
            </div>
          </button>
        ))}
      </div>

      {hasChanges && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Spinner className="mr-2 h-4 w-4" />}
            Save Template
          </Button>
        </div>
      )}
    </div>
  );
}
