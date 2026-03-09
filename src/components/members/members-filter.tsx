"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";
import { Search } from "lucide-react";

export function MembersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search);

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/members?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    updateFilters("search", debouncedSearch);
  }, [debouncedSearch, updateFilters]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={searchParams.get("status") || ""}
        onChange={(e) => updateFilters("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="LAPSED">Lapsed</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="PROSPECT">Prospect</option>
        <option value="ARCHIVED">Archived</option>
      </Select>
    </div>
  );
}
