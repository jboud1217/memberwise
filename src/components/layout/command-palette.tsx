"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ContactRound,
  Tag,
  CreditCard,
  Heart,
  CalendarDays,
  Mail,
  Zap,
  FileText,
  HandHeart,
  Users2,
  ClipboardList,
  PieChart,
  BarChart3,
  FolderOpen,
  Settings,
  UserPlus,
  Upload,
  Plus,
  Send,
  Globe,
  PenLine,
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Command,
  Clock,
  Sparkles,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof LayoutDashboard;
  href?: string;
  action?: () => void;
  category: "recent" | "navigation" | "action" | "create";
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: "dashboard", label: "Dashboard", description: "Overview and stats", icon: LayoutDashboard, href: "/dashboard", category: "navigation", keywords: ["home", "overview"] },
  { id: "members", label: "Members", description: "Manage your members", icon: Users, href: "/members", category: "navigation", keywords: ["people", "list"] },
  { id: "contacts", label: "Contacts", description: "Contact directory", icon: ContactRound, href: "/contacts", category: "navigation", keywords: ["people"] },
  { id: "tiers", label: "Membership Tiers", description: "Plans and pricing", icon: Tag, href: "/tiers", category: "navigation", keywords: ["pricing", "plans", "levels"] },
  { id: "billing", label: "Billing", description: "Payments and invoices", icon: CreditCard, href: "/billing", category: "navigation", keywords: ["payments", "revenue", "money"] },
  { id: "donations", label: "Donations", description: "Campaigns and giving", icon: Heart, href: "/donations", category: "navigation", keywords: ["fundraising", "giving"] },
  { id: "events", label: "Events", description: "Calendar and registrations", icon: CalendarDays, href: "/events", category: "navigation", keywords: ["calendar", "meetings"] },
  { id: "email", label: "Email Campaigns", description: "Send newsletters", icon: Mail, href: "/email", category: "navigation", keywords: ["campaigns", "newsletters"] },
  { id: "automations", label: "Automations", description: "Workflow rules", icon: Zap, href: "/automations", category: "navigation", keywords: ["workflows", "rules"] },
  { id: "documents", label: "Documents", description: "Files and resources", icon: FileText, href: "/documents", category: "navigation", keywords: ["files", "resources", "library"] },
  { id: "volunteers", label: "Volunteers", description: "Hours and service", icon: HandHeart, href: "/volunteers", category: "navigation", keywords: ["hours", "service"] },
  { id: "committees", label: "Committees", description: "Groups and boards", icon: Users2, href: "/committees", category: "navigation", keywords: ["groups", "boards"] },
  { id: "forms", label: "Forms & Surveys", description: "Collect responses", icon: ClipboardList, href: "/forms", category: "navigation", keywords: ["surveys", "applications"] },
  { id: "reports", label: "Reports", description: "Exports and data", icon: PieChart, href: "/reports", category: "navigation", keywords: ["analytics", "data", "export"] },
  { id: "analytics", label: "Analytics", description: "Insights and charts", icon: BarChart3, href: "/analytics", category: "navigation", keywords: ["insights", "charts"] },
  { id: "assets", label: "Assets", description: "Media library", icon: FolderOpen, href: "/assets", category: "navigation", keywords: ["media", "images"] },
  { id: "settings", label: "Settings", description: "Organization config", icon: Settings, href: "/settings", category: "navigation", keywords: ["config", "preferences"] },
  { id: "site-builder", label: "Site Builder", description: "Edit your website", icon: PenLine, href: "/settings/template", category: "navigation", keywords: ["website", "editor", "design"] },

  // Quick Actions
  { id: "add-member", label: "Add a new member", description: "Create a member record", icon: UserPlus, href: "/members/new", category: "create", keywords: ["create", "new"] },
  { id: "import-members", label: "Import members from CSV", description: "Bulk upload", icon: Upload, href: "/members/import", category: "create", keywords: ["upload", "csv", "excel"] },
  { id: "create-event", label: "Create an event", description: "Schedule a new event", icon: Plus, href: "/events/create", category: "create", keywords: ["new", "schedule"] },
  { id: "send-email", label: "Compose email campaign", description: "Draft a newsletter", icon: Send, href: "/email/new", category: "create", keywords: ["new", "campaign", "newsletter"] },
  { id: "record-payment", label: "Record a payment", description: "Log member dues", icon: CreditCard, href: "/billing", category: "create", keywords: ["money", "dues"] },
  { id: "view-site", label: "View your website", description: "Open public site", icon: Globe, category: "action", keywords: ["preview", "public"] },
];

const CATEGORY_LABELS: Record<string, string> = {
  recent: "Recent",
  create: "Quick Actions",
  navigation: "Go to",
  action: "Actions",
};

const RECENT_KEY = "mw_recent_commands";
const MAX_RECENT = 5;

function getRecentIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  try {
    const recent = getRecentIds().filter((r) => r !== id);
    recent.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

// Fuzzy match scoring
function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // Exact match
  if (t === q) return 100;
  // Starts with
  if (t.startsWith(q)) return 80;
  // Contains
  if (t.includes(q)) return 60;

  // Fuzzy character match
  let score = 0;
  let tIdx = 0;
  for (let qIdx = 0; qIdx < q.length && tIdx < t.length; qIdx++) {
    while (tIdx < t.length) {
      if (t[tIdx] === q[qIdx]) {
        score += 1;
        tIdx++;
        break;
      }
      tIdx++;
    }
  }
  return score > 0 ? (score / q.length) * 40 : 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load recents on open
  useEffect(() => {
    if (open) {
      setRecentIds(getRecentIds());
    }
  }, [open]);

  // Filter and score commands based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS
      .map((cmd) => {
        const labelScore = fuzzyScore(cmd.label, q);
        const descScore = cmd.description ? fuzzyScore(cmd.description, q) * 0.5 : 0;
        const keywordScore = Math.max(0, ...(cmd.keywords?.map((k) => fuzzyScore(k, q) * 0.7) ?? [0]));
        return { cmd, score: Math.max(labelScore, descScore, keywordScore) };
      })
      .filter(({ score }) => score > 10)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }, [query]);

  // Group by category, with recent items shown when no query
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    if (!query.trim() && recentIds.length > 0) {
      const recentCmds = recentIds
        .map((id) => COMMANDS.find((c) => c.id === id))
        .filter(Boolean) as CommandItem[];
      if (recentCmds.length > 0) {
        groups["recent"] = recentCmds.map((cmd) => ({ ...cmd, category: "recent" as const }));
      }
    }

    const order = query.trim()
      ? ["create", "action", "navigation"]
      : ["recent", "create", "navigation", "action"];

    for (const cmd of filtered) {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    }

    return order.filter((cat) => groups[cat]).map((cat) => ({ category: cat, items: groups[cat] }));
  }, [filtered, query, recentIds]);

  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      saveRecent(cmd.id);
      setOpen(false);
      setQuery("");
      if (cmd.href) {
        router.push(cmd.href);
      } else if (cmd.action) {
        cmd.action();
      }
    },
    [router]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
        return;
      }

      if (!open) return;

      // Navigate list
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          executeCommand(flatItems[selectedIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, flatItems, executeCommand]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => { setOpen(false); setQuery(""); }}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15vh] z-[101] mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-slide-up">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] sm:inline-flex">
              ESC
            </kbd>
          </div>

          {/* Hint when empty */}
          {!query.trim() && recentIds.length === 0 && (
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--accent)]/30 px-4 py-2 text-[11px] text-[var(--muted-foreground)]">
              <Sparkles className="h-3 w-3" />
              Tip: Start typing to search, or use arrow keys to browse
            </div>
          )}

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto overscroll-contain py-2">
            {flatItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto mb-2 h-8 w-8 text-[var(--muted-foreground)]/30" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]/60">
                  Try a different search term
                </p>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.category}>
                  <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {group.category === "recent" && <Clock className="h-3 w-3" />}
                    {CATEGORY_LABELS[group.category]}
                  </div>
                  {group.items.map((cmd) => {
                    const idx = globalIndex++;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={`${group.category}-${cmd.id}`}
                        data-index={idx}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                        }`}
                      >
                        <cmd.icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white/80" : "text-[var(--muted-foreground)]"}`} />
                        <div className="min-w-0 flex-1">
                          <span className="truncate">{cmd.label}</span>
                          {cmd.description && (
                            <span className={`ml-2 text-xs ${isSelected ? "text-white/50" : "text-[var(--muted-foreground)]"}`}>
                              {cmd.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> select
            </span>
            <span className="flex items-center gap-1">
              <span className="rounded border border-[var(--border)] px-1 text-[9px]">ESC</span> close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
