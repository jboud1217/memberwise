"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const styles = VARIANT_STYLES[variant];
  const IconComponent = styles.icon;

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, onClose]);

  if (!open) return null;

  const busy = loading || isLoading;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
                styles.iconBg
              )}
            >
              <IconComponent className={cn("h-6 w-6", styles.iconColor)} />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={busy}
            >
              {cancelLabel}
            </Button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                styles.buttonClass
              )}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "info";
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "danger",
    confirmLabel: "Confirm",
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (opts: {
      title: string;
      description: string;
      variant?: "danger" | "warning" | "info";
      confirmLabel?: string;
      onConfirm: () => void | Promise<void>;
    }) => {
      setState({
        open: true,
        title: opts.title,
        description: opts.description,
        variant: opts.variant || "danger",
        confirmLabel: opts.confirmLabel || "Confirm",
        onConfirm: opts.onConfirm,
      });
    },
    []
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onClose={close}
      onConfirm={state.onConfirm}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmLabel={state.confirmLabel}
    />
  );

  return { confirm, dialog };
}
