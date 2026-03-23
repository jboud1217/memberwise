"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  UserPlus,
  Upload,
  Mail,
  CalendarDays,
  Search,
  Heart,
  FileText,
} from "lucide-react";

interface QuickAction {
  label: string;
  icon: typeof Plus;
  href?: string;
  action?: () => void;
  color: string;
  bg: string;
}

const GLOBAL_ACTIONS: QuickAction[] = [
  { label: "Add Member", icon: UserPlus, href: "/members/new", color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Send Email", icon: Mail, href: "/email/new", color: "text-purple-600", bg: "bg-purple-100" },
  { label: "Import CSV", icon: Upload, href: "/members/import", color: "text-teal-600", bg: "bg-teal-100" },
  { label: "Create Event", icon: CalendarDays, href: "/events/create", color: "text-amber-600", bg: "bg-amber-100" },
];

const CONTEXTUAL_ACTIONS: Record<string, QuickAction[]> = {
  "/members": [
    { label: "Add Member", icon: UserPlus, href: "/members/new", color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Import CSV", icon: Upload, href: "/members/import", color: "text-teal-600", bg: "bg-teal-100" },
  ],
  "/email": [
    { label: "New Campaign", icon: Mail, href: "/email/new", color: "text-purple-600", bg: "bg-purple-100" },
  ],
  "/events": [
    { label: "Create Event", icon: CalendarDays, href: "/events/create", color: "text-amber-600", bg: "bg-amber-100" },
  ],
  "/donations": [
    { label: "New Campaign", icon: Heart, href: "/donations/new", color: "text-rose-600", bg: "bg-rose-100" },
  ],
  "/documents": [
    { label: "Upload Document", icon: FileText, href: "/documents/upload", color: "text-cyan-600", bg: "bg-cyan-100" },
  ],
};

export function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Get contextual actions based on current page
  const contextKey = Object.keys(CONTEXTUAL_ACTIONS).find(
    (key) => pathname === key || pathname.startsWith(key + "/")
  );
  const actions = contextKey ? CONTEXTUAL_ACTIONS[contextKey] : GLOBAL_ACTIONS;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleAction = (action: QuickAction) => {
    setIsOpen(false);
    if (action.href) {
      router.push(action.href);
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 lg:hidden">
      {/* Action items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2 animate-fade-in">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action)}
              className="flex items-center gap-3 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium shadow-lg transition-all hover:shadow-xl animate-slide-up"
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", action.bg)}>
                <action.icon className={cn("h-4 w-4", action.color)} />
              </div>
              {action.label}
            </button>
          ))}
          {/* Search shortcut */}
          <button
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
            className="flex items-center gap-3 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium shadow-lg transition-all hover:shadow-xl animate-slide-up"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--muted)]">
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            Search
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 active:scale-95",
          isOpen
            ? "bg-[var(--foreground)] text-[var(--background)] rotate-45"
            : "bg-[var(--primary)] text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)]"
        )}
      >
        {isOpen ? <X className="h-6 w-6 -rotate-45" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
