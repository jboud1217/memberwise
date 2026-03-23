import { type LucideIcon } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyAction[];
  tips?: string[];
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  tips,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-16",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--muted)] to-[var(--accent)] shadow-sm">
        <Icon className="h-7 w-7 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
        {description}
      </p>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            const btn = (
              <Button
                key={action.label}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
              >
                {ActionIcon && <ActionIcon className="mr-1.5 h-4 w-4" />}
                {action.label}
              </Button>
            );
            return action.href ? (
              <Link key={action.label} href={action.href}>
                {btn}
              </Link>
            ) : (
              btn
            );
          })}
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Quick Tips
          </p>
          <ul className="space-y-1 text-left text-xs text-[var(--muted-foreground)]">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[9px] font-bold text-[var(--primary)]">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
