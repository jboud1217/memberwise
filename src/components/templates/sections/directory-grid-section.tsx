"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";

interface DirectoryGridSectionProps {
  showSearch?: boolean;
  columns?: number;
}

export function DirectoryGridSection({ showSearch = true, columns = 3 }: DirectoryGridSectionProps) {
  const [search, setSearch] = useState("");

  // Placeholder members — in production, fetched from DB
  const members = [
    { name: "Jane Smith", role: "Board Member" },
    { name: "John Doe", role: "Member" },
    { name: "Sarah Johnson", role: "Committee Chair" },
    { name: "Michael Brown", role: "Member" },
    { name: "Emily Davis", role: "Treasurer" },
    { name: "Robert Wilson", role: "Member" },
  ];

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const gridCols =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {showSearch && (
          <div className="relative mx-auto mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <div className={`grid gap-4 ${gridCols}`}>
          {filtered.map((member, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10">
                <User className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--card-foreground)]">{member.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
