"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { BulkActionBar } from "./bulk-actions";
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X, ChevronRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  ACTIVE: "success",
  LAPSED: "destructive",
  SUSPENDED: "warning",
  PROSPECT: "secondary",
  ARCHIVED: "outline",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  LAPSED: "Lapsed",
  SUSPENDED: "Suspended",
  PROSPECT: "Prospect",
  ARCHIVED: "Archived",
};

const STATUSES = ["ACTIVE", "LAPSED", "SUSPENDED", "PROSPECT", "ARCHIVED"];

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-violet-400 to-violet-600",
  "from-cyan-400 to-cyan-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(date);
}

interface Member {
  id: string;
  displayName: string;
  organizationName: string | null;
  status: string;
  tier: { name: string } | null;
  contacts: { id: string }[];
  joinDate: Date | string | null;
}

interface Tier {
  id: string;
  name: string;
}

type SortKey = "displayName" | "status" | "tier" | "contacts" | "joinDate";

interface MembersTableProps {
  members: Member[];
  tiers: Tier[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  isEmpty: boolean;
}

export function MembersTable({ members, tiers, sortBy, sortOrder, isEmpty }: MembersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nameSearch, setNameSearch] = useState(searchParams.get("search") || "");
  const debouncedName = useDebounce(nameSearch);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedName) {
      params.set("search", debouncedName);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/members?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/members?${params.toString()}`);
  }

  function handleSort(column: SortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === column) {
      params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    }
    params.delete("page");
    router.push(`/members?${params.toString()}`);
  }

  function clearAllFilters() {
    setNameSearch("");
    router.push("/members");
  }

  function toggleAll() {
    setSelected(selected.size === members.length ? new Set() : new Set(members.map((m) => m.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortBy !== column) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-25" />;
    return sortOrder === "asc"
      ? <ArrowUp className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
      : <ArrowDown className="ml-1 inline h-3 w-3 text-[var(--primary)]" />;
  }

  const hasFilters = searchParams.get("search") || searchParams.get("status") || searchParams.get("tierName");
  const activeFilterCount = [searchParams.get("search"), searchParams.get("status"), searchParams.get("tierName")].filter(Boolean).length;

  return (
    <div>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="border-b border-[var(--border)] px-4 py-2">
          <BulkActionBar selectedIds={Array.from(selected)} onClear={() => setSelected(new Set())} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--muted)]/30 px-4 py-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select
          value={searchParams.get("status") || ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-8 w-36 text-xs"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </Select>
        <Select
          value={searchParams.get("tierName") || ""}
          onChange={(e) => updateParam("tierName", e.target.value)}
          className="h-8 w-36 text-xs"
        >
          <option value="">All tiers</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 gap-1 px-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-3 w-3" />
            Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ""}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={selected.size === members.length && members.length > 0}
                onChange={toggleAll}
                className="cursor-pointer accent-[var(--primary)] h-3.5 w-3.5 rounded"
              />
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => handleSort("displayName")}>
              Member <SortIcon column="displayName" />
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => handleSort("status")}>
              Status <SortIcon column="status" />
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => handleSort("tier")}>
              Tier <SortIcon column="tier" />
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:text-[var(--foreground)] transition-colors text-center" onClick={() => handleSort("contacts")}>
              Contacts <SortIcon column="contacts" />
            </TableHead>
            <TableHead className="cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => handleSort("joinDate")}>
              Joined <SortIcon column="joinDate" />
            </TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={7} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <UserCircle className="h-8 w-8 text-[var(--muted-foreground)]/50" />
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">No members match your filters</p>
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="mt-1 text-xs">
                    Clear all filters
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow
                key={member.id}
                className={`group cursor-pointer transition-colors ${selected.has(member.id) ? "bg-[var(--primary)]/[0.04]" : ""}`}
                onClick={(e) => {
                  // Don't navigate if clicking checkbox or link
                  if ((e.target as HTMLElement).closest("a, input, button")) return;
                  router.push(`/members/${member.id}`);
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(member.id)}
                    onChange={() => toggle(member.id)}
                    className="cursor-pointer accent-[var(--primary)] h-3.5 w-3.5 rounded"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(member.displayName)} text-[11px] font-semibold text-white shadow-sm`}>
                      {getInitials(member.displayName)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {member.displayName}
                      </Link>
                      {member.organizationName && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{member.organizationName}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/members?status=${member.status}`} onClick={(e) => e.stopPropagation()}>
                    <Badge variant={statusVariant[member.status] || "secondary"} className="transition-opacity hover:opacity-80">
                      {statusLabel[member.status] || member.status}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {member.tier ? (
                    <Link
                      href={`/members?tierName=${encodeURIComponent(member.tier.name)}`}
                      className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {member.tier.name}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {member.contacts.length > 0 ? (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--muted)] px-1.5 text-xs font-medium">
                      {member.contacts.length}
                    </span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-[var(--muted-foreground)]" title={member.joinDate ? formatDate(member.joinDate) : undefined}>
                  {relativeDate(member.joinDate)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
