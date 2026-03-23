"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/members/new": "Add Member",
  "/members/import": "Import",
  "/contacts": "Contacts",
  "/tiers": "Tiers",
  "/billing": "Billing",
  "/donations": "Donations",
  "/events": "Events",
  "/events/create": "Create Event",
  "/email": "Email",
  "/email/new": "New Campaign",
  "/automations": "Automations",
  "/documents": "Documents",
  "/volunteers": "Volunteers",
  "/committees": "Committees",
  "/forms": "Forms",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/assets": "Assets",
  "/settings": "Settings",
  "/settings/template": "Site Builder",
  "/settings/team": "Team",
  "/settings/billing": "Billing",
  "/settings/domain": "Domain",
  "/settings/email": "Email",
  "/settings/custom-fields": "Custom Fields",
  "/settings/theme": "Theme",
  "/settings/migration": "Migration Center",
};

function autoBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [];

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    path += "/" + segments[i];
    const label = ROUTE_LABELS[path];
    if (label) {
      const isLast = i === segments.length - 1;
      crumbs.push({ label, href: isLast ? undefined : path });
    }
  }

  return crumbs;
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  children,
}: PageHeaderProps) {
  const pathname = usePathname();
  const crumbs = breadcrumbs ?? autoBreadcrumbs(pathname);

  return (
    <div className="mb-6 animate-fade-in-up">
      {/* Breadcrumbs */}
      {crumbs.length > 1 && (
        <nav className="mb-3 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors hover:text-[var(--foreground)]"
          >
            <Home className="h-3 w-3" />
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--foreground)]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Optional children (filters, tabs, etc.) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

interface TabItem {
  label: string;
  value: string;
  count?: number;
  icon?: React.ReactNode;
}

export function PageTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)]/50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            activeTab === tab.value
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                activeTab === tab.value
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
