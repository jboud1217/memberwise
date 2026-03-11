"use client";

import { useState } from "react";
import { revertSiteToSnapshot } from "@/actions/template";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Undo2, CheckCircle, AlertTriangle } from "lucide-react";

interface SnapshotControlsProps {
  lastUpdated?: string | null;
}

export function SnapshotControls({ lastUpdated }: SnapshotControlsProps) {
  const [reverting, setReverting] = useState(false);
  const [reverted, setReverted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRevert() {
    setReverting(true);
    try {
      await revertSiteToSnapshot();
      setReverted(true);
      setShowConfirm(false);
      setTimeout(() => {
        setReverted(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Revert failed:", err);
      alert("No snapshot available to revert to. Make some changes first.");
    }
    setReverting(false);
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Site Snapshots</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            A snapshot is automatically saved each time you make changes.
            {lastUpdated && (
              <> Last updated: {new Date(lastUpdated).toLocaleString()}</>
            )}
          </p>
        </div>

        {showConfirm ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Revert to previous version?
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRevert}
              disabled={reverting}
            >
              {reverting ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
              ) : reverted ? (
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {reverted ? "Reverted!" : "Yes, Revert"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowConfirm(true)}
          >
            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
            Revert to Previous
          </Button>
        )}
      </div>
    </div>
  );
}
