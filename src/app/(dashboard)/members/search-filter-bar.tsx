"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
  { value: "LAPSED", label: "Lapsed", dot: "bg-red-500" },
  { value: "PROSPECT", label: "Prospect", dot: "bg-blue-500" },
  { value: "SUSPENDED", label: "Suspended", dot: "bg-amber-500" },
  { value: "ARCHIVED", label: "Archived", dot: "bg-gray-400" },
];

interface SearchFilterBarProps {
  tiers: { id: string; name: string }[];
  currentSearch?: string;
  currentStatus?: string;
  currentTierId?: string;
  total: number;
}

export function SearchFilterBar({
  tiers,
  currentSearch = "",
  currentStatus = "",
  currentTierId = "",
  total,
}: SearchFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(!!currentStatus || !!currentTierId);

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const qp = new URLSearchParams(searchParams.toString());
      qp.delete("page"); // reset page on filter change
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          qp.set(key, value);
        } else {
          qp.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/members?${qp.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      // Debounced search
      const timeout = setTimeout(() => {
        updateUrl({ search: value });
      }, 300);
      return () => clearTimeout(timeout);
    },
    [updateUrl]
  );

  const handleClearAll = useCallback(() => {
    setSearch("");
    startTransition(() => {
      router.push("/members");
    });
    setShowFilters(false);
  }, [router]);

  const activeFilterCount =
    (currentStatus ? 1 : 0) + (currentTierId ? 1 : 0);

  return (
    <div className="mb-4 space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, email, member number..."
            className={cn(
              "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-10 text-sm outline-none transition-all",
              "placeholder:text-[var(--muted-foreground)]",
              "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20",
              isPending && "opacity-70"
            )}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2",
            activeFilterCount > 0 && "border-[var(--primary)] text-[var(--primary)]"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-3 animate-fade-in">
          {/* Status filter */}
          <div className="relative">
            <select
              value={currentStatus}
              onChange={(e) => updateUrl({ status: e.target.value })}
              className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 pl-3 pr-8 text-xs font-medium outline-none transition-colors focus:border-[var(--ring)]"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
          </div>

          {/* Tier filter */}
          {tiers.length > 0 && (
            <div className="relative">
              <select
                value={currentTierId}
                onChange={(e) => updateUrl({ tierId: e.target.value })}
                className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 pl-3 pr-8 text-xs font-medium outline-none transition-colors focus:border-[var(--ring)]"
              >
                <option value="">All Tiers</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
            </div>
          )}

          {/* Active filter badges */}
          {currentStatus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--primary)]">
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUSES.find((s) => s.value === currentStatus)?.dot || "bg-gray-400")} />
              {STATUSES.find((s) => s.value === currentStatus)?.label}
              <button
                onClick={() => updateUrl({ status: "" })}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--primary)]/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="ml-auto text-xs font-medium text-[var(--primary)] transition-colors hover:underline"
            >
              Clear all
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-[11px] text-[var(--muted-foreground)]">
            {total} result{total !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
