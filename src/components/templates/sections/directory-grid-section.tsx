"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";

interface DirectoryMember {
  name: string;
  role: string;
  image?: string;
}

interface DirectoryGridSectionProps {
  heading?: string;
  showSearch?: boolean;
  columns?: number;
  members?: DirectoryMember[];
}

export function DirectoryGridSection({
  heading = "Member Directory",
  showSearch = true,
  columns = 3,
  members: propMembers,
}: DirectoryGridSectionProps) {
  const [search, setSearch] = useState("");

  // Use provided members or placeholder data
  const members = propMembers || [
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
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
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
              data-array-item="members"
              data-item-index={i}
            >
              {member.image ? (
                <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden" data-editable-image={`members.${i}.image`}>
                  <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10" data-editable-image={`members.${i}.image`}>
                  <User className="h-5 w-5 text-[var(--primary)]" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-[var(--card-foreground)]" data-editable-text={`members.${i}.name`}>{member.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]" data-editable-text={`members.${i}.role`}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
