"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { MoreHorizontal, Send, Trash2, Clock, XCircle } from "lucide-react";
import { sendCampaign, deleteCampaign, unscheduleCampaign } from "@/actions/email-campaigns";

export function CampaignActions({
  campaignId,
  status,
  emailConfigured,
}: {
  campaignId: string;
  status: string;
  emailConfigured: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const canSend = (status === "DRAFT" || status === "SCHEDULED") && emailConfigured;
  const canDelete = status === "DRAFT" || status === "SCHEDULED" || status === "FAILED";
  const canUnschedule = status === "SCHEDULED";

  if (!canSend && !canDelete && !canUnschedule) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
          {canSend && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--accent)]"
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  await sendCampaign(campaignId);
                });
              }}
            >
              <Send className="h-3.5 w-3.5" />
              Send Now
            </button>
          )}
          {canUnschedule && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--accent)]"
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  await unscheduleCampaign(campaignId);
                });
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
              Unschedule
            </button>
          )}
          {canDelete && (
            <>
              <div className="my-1 h-px bg-[var(--border)]" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                onClick={() => {
                  setOpen(false);
                  if (confirm("Delete this campaign?")) {
                    startTransition(async () => {
                      await deleteCampaign(campaignId);
                    });
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
