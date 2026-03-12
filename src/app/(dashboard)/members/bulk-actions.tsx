"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, RefreshCw } from "lucide-react";
import { bulkUpdateMembers, bulkDeleteMembers } from "@/actions/members";

interface Props {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, onClear }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState("");

  if (selectedIds.length === 0) return null;

  async function handleApply() {
    if (!action) return;

    if (action === "delete") {
      if (!confirm(`Delete ${selectedIds.length} members? This cannot be undone.`)) return;
      startTransition(async () => {
        await bulkDeleteMembers(selectedIds);
        onClear();
        router.refresh();
      });
    } else if (action.startsWith("status:")) {
      const status = action.replace("status:", "");
      startTransition(async () => {
        await bulkUpdateMembers(selectedIds, { status });
        onClear();
        router.refresh();
      });
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5">
      <span className="text-sm font-medium text-indigo-700">{selectedIds.length} selected</span>
      <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-48">
        <option value="">Choose action...</option>
        <option value="status:ACTIVE">Set Active</option>
        <option value="status:LAPSED">Set Lapsed</option>
        <option value="status:SUSPENDED">Set Suspended</option>
        <option value="status:ARCHIVED">Set Archived</option>
        <option value="delete">Delete</option>
      </Select>
      <Button size="sm" onClick={handleApply} disabled={!action || isPending}>
        {isPending ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        Apply
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
