"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ContactRound,
  Tag,
  ChevronRight,
  ChevronLeft,
  Command,
  Search,
  Globe,
  ExternalLink,
  PenLine,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  CalendarDays,
  Zap,
  FileText,
  Heart,
  HandHeart,
  Users2,
  ClipboardList,
  PieChart,
} from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "./notification-bell";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "D" },
  { name: "Members", href: "/members", icon: Users, shortcut: "M" },
  { name: "Contacts", href: "/contacts", icon: ContactRound, shortcut: "C" },
  { name: "Tiers", href: "/tiers", icon: Tag, shortcut: "T" },
  { name: "Billing", href: "/billing", icon: CreditCard, shortcut: "B" },
  { name: "Donations", href: "/donations", icon: Heart, shortcut: "O" },
  { name: "Events", href: "/events", icon: CalendarDays, shortcut: "V" },
  { name: "Email", href: "/email", icon: Mail, shortcut: "E" },
  { name: "Automations", href: "/automations", icon: Zap, shortcut: "W" },
  { name: "Documents", href: "/documents", icon: FileText, shortcut: "R" },
  { name: "Volunteers", href: "/volunteers", icon: HandHeart, shortcut: "L" },
  { name: "Committees", href: "/committees", icon: Users2, shortcut: "G" },
  { name: "Forms", href: "/forms", icon: ClipboardList, shortcut: "Q" },
  { name: "Reports", href: "/reports", icon: PieChart, shortcut: "P" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "A" },
  { name: "Assets", href: "/assets", icon: FolderOpen, shortcut: "F" },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

function getBreadcrumb(pathname: string): string | null {
  if (pathname.startsWith("/members/") && pathname !== "/members/import" && pathname !== "/members/new") {
    return "Member Detail";
  }
  if (pathname === "/members/new") return "Add Member";
  if (pathname === "/members/import") return "Import";
  if (pathname === "/email/new") return "New Campaign";
  if (pathname === "/events/create") return "Create Event";
  if (pathname.startsWith("/events/") && pathname !== "/events/create") return "Event Detail";
  if (pathname === "/settings/migration") return "Migration Center";
  if (pathname.startsWith("/settings/")) {
    const segment = pathname.split("/")[2];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : null;
  }
  return null;
}

export function Sidebar({ siteUrl = "/", collapsed = false, onToggleCollapse }: { siteUrl?: string; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumb = getBreadcrumb(pathname);

  const activeSection = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--accent)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex flex-1 items-center gap-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-[10px] font-bold text-white">M</span>
          </div>
          {activeSection && (
            <>
              <span className="font-medium">{activeSection.name}</span>
              {breadcrumb && (
                <>
                  <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">{breadcrumb}</span>
                </>
              )}
            </>
          )}
        </div>
        <NotificationBell />
      </div>

      {/* Mobile spacer */}
      <div className="h-14 lg:hidden" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 lg:translate-x-0",
          collapsed ? "w-[68px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-[var(--border)]", collapsed ? "justify-center px-2" : "gap-3 px-5")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold tracking-tight leading-tight truncate">MemberWise</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Membership Platform</span>
              </div>
              <NotificationBell />
            </div>
          )}
        </div>

        {/* Search hint - opens command palette */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-1">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--ring)]/30 hover:bg-[var(--accent)] cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center pt-4 pb-1">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className={cn("flex-1 space-y-0.5 py-3 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {/* Website section */}
          {!collapsed && (
            <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Website
            </p>
          )}
          {collapsed && <div className="mt-2 mb-2 mx-auto h-px w-6 bg-[var(--border)]" />}
          <Link
            href="/settings/template"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Site Builder" : undefined}
            className={cn(
              "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
              pathname === "/settings/template"
                ? "bg-[var(--primary)] text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            )}
          >
            <PenLine className={cn("h-4 w-4 shrink-0", pathname !== "/settings/template" && "transition-transform duration-150 group-hover:scale-110")} />
            {!collapsed && <span className="flex-1">Site Builder</span>}
            {!collapsed && (
              <kbd className={cn(
                "hidden text-[10px] font-mono rounded px-1 py-0.5 lg:inline-block transition-colors",
                pathname === "/settings/template"
                  ? "bg-white/20 text-white/70"
                  : "text-[var(--muted-foreground)]/50 group-hover:text-[var(--muted-foreground)]"
              )}>
                S
              </kbd>
            )}
          </Link>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? "View Website" : undefined}
            className={cn(
              "group flex items-center rounded-lg text-[13px] font-medium text-[var(--muted-foreground)] transition-all duration-150 hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
              collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
            )}
          >
            <Globe className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
            {!collapsed && <span className="flex-1">View Website</span>}
            {!collapsed && <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity" />}
          </a>

          {!collapsed && (
            <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Manage
            </p>
          )}
          {collapsed && <div className="mt-2 mb-2 mx-auto h-px w-6 bg-[var(--border)]" />}
          {navigation.slice(0, 9).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", !isActive && "transition-transform duration-150 group-hover:scale-110")} />
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {!collapsed && (
                  <kbd className={cn(
                    "hidden text-[10px] font-mono rounded px-1 py-0.5 lg:inline-block transition-colors",
                    isActive
                      ? "bg-white/20 text-white/70"
                      : "text-[var(--muted-foreground)]/50 group-hover:text-[var(--muted-foreground)]"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}

          {/* Engage section */}
          {!collapsed && (
            <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Engage
            </p>
          )}
          {collapsed && <div className="mt-2 mb-2 mx-auto h-px w-6 bg-[var(--border)]" />}
          {navigation.slice(9).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", !isActive && "transition-transform duration-150 group-hover:scale-110")} />
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {!collapsed && (
                  <kbd className={cn(
                    "hidden text-[10px] font-mono rounded px-1 py-0.5 lg:inline-block transition-colors",
                    isActive
                      ? "bg-white/20 text-white/70"
                      : "text-[var(--muted-foreground)]/50 group-hover:text-[var(--muted-foreground)]"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className={cn("border-t border-[var(--border)] py-3 space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.name}
              </Link>
            );
          })}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              title={collapsed ? "Sign Out" : undefined}
              className={cn(
                "flex w-full items-center rounded-lg text-[13px] font-medium text-[var(--muted-foreground)] transition-all duration-150 hover:bg-red-500/10 hover:text-red-500",
                collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sign Out"}
            </button>
          </form>

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex w-full items-center rounded-lg text-[13px] font-medium text-[var(--muted-foreground)] transition-all duration-150 hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
              collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
