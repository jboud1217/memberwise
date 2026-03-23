"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishEvent, cancelEvent, completeEvent, deleteEvent } from "@/actions/events";
import { Send, X, CheckCircle, Trash2 } from "lucide-react";

export function EventActions({ event }: { event: { id: string; status: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function handleAction(action: () => Promise<unknown>, name: string) {
    setLoading(name);
    setError("");
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
      {event.status === "DRAFT" && (
        <Button
          size="sm"
          onClick={() => handleAction(() => publishEvent(event.id), "publish")}
          disabled={!!loading}
        >
          <Send className="mr-1 h-3.5 w-3.5" />
          {loading === "publish" ? "Publishing..." : "Publish"}
        </Button>
      )}
      {event.status === "PUBLISHED" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(() => completeEvent(event.id), "complete")}
            disabled={!!loading}
          >
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            {loading === "complete" ? "..." : "Mark Complete"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(() => cancelEvent(event.id), "cancel")}
            disabled={!!loading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
        </>
      )}
      {(event.status === "DRAFT" || event.status === "CANCELLED") && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!confirm("Delete this event? This cannot be undone.")) return;
            handleAction(async () => {
              await deleteEvent(event.id);
              router.push("/events");
            }, "delete");
          }}
          disabled={!!loading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          {loading === "delete" ? "..." : "Delete"}
        </Button>
      )}
      </div>
    </div>
  );
}
