"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ColumnMapping, Platform } from "@/lib/import-utils";
import {
  Search,
  RotateCcw,
  X,
  AlertTriangle,
  Columns,
} from "lucide-react";

const TARGET_OPTIONS: { group: string; options: { value: string; label: string }[] }[] = [
  {
    group: "Member Fields",
    options: [
      { value: "member:displayName", label: "Display Name" },
      { value: "member:organizationName", label: "Organization Name" },
      { value: "member:status", label: "Member Status" },
      { value: "member:memberType", label: "Member Type / Tier" },
      { value: "member:memberNumber", label: "Member Number" },
      { value: "member:address1", label: "Address Line 1" },
      { value: "member:address2", label: "Address Line 2" },
      { value: "member:city", label: "City" },
      { value: "member:state", label: "State" },
      { value: "member:zip", label: "ZIP" },
      { value: "member:country", label: "Country" },
      { value: "member:orgAddress1", label: "Org Address Line 1" },
      { value: "member:orgAddress2", label: "Org Address Line 2" },
      { value: "member:orgCity", label: "Org City" },
      { value: "member:orgState", label: "Org State" },
      { value: "member:orgZip", label: "Org ZIP" },
      { value: "member:orgCountry", label: "Org Country" },
      { value: "member:orgEmail", label: "Org Email" },
      { value: "member:orgPhone", label: "Org Phone" },
      { value: "member:website", label: "Website" },
      { value: "member:notes", label: "Notes" },
      { value: "member:boardMember", label: "Board Member" },
      { value: "member:joinDate", label: "Join Date" },
      { value: "member:expirationDate", label: "Expiration Date" },
      { value: "member:renewalDate", label: "Renewal Date" },
      { value: "member:legacyId", label: "Legacy ID" },
      { value: "member:dues", label: "Dues Amount" },
      { value: "member:committees", label: "Committees / Notes" },
    ],
  },
  {
    group: "Contact Fields",
    options: [
      { value: "contact:firstName", label: "First Name" },
      { value: "contact:lastName", label: "Last Name" },
      { value: "contact:fullName", label: "Full Name" },
      { value: "contact:email", label: "Email" },
      { value: "contact:phone", label: "Phone" },
      { value: "contact:mobile", label: "Mobile Phone" },
      { value: "contact:phoneHome", label: "Home Phone" },
      { value: "contact:phoneWork", label: "Work Phone" },
      { value: "contact:phoneOther", label: "Other Phone" },
      { value: "contact:fax", label: "Fax" },
      { value: "contact:emailSecondary", label: "Secondary Email" },
      { value: "contact:emailOther", label: "Other Email" },
      { value: "contact:prefix", label: "Name Prefix" },
      { value: "contact:suffix", label: "Name Suffix" },
      { value: "contact:middleName", label: "Middle Name" },
      { value: "contact:nickname", label: "Nickname" },
      { value: "contact:title", label: "Title" },
      { value: "contact:doNotEmail", label: "Do Not Email" },
      { value: "contact:doNotMail", label: "Do Not Mail" },
      { value: "contact:doNotCall", label: "Do Not Call" },
      { value: "contact:directoryOptOut", label: "Directory Opt Out" },
      { value: "contact:deceased", label: "Deceased" },
      { value: "contact:username", label: "Username" },
    ],
  },
  {
    group: "Meta / Linking",
    options: [
      { value: "meta:legacyOrganizationId", label: "Organization ID (linking)" },
      { value: "meta:linkToOrganizationId", label: "Link to Org ID (linking)" },
    ],
  },
];

export interface CustomFieldOption {
  id: string;
  name: string;
  key: string;
  type: string;
  entity: "MEMBER" | "CONTACT";
}

interface ColumnMapperProps {
  headers: string[];
  mapping: Record<string, ColumnMapping>;
  sampleData: Record<string, string[]>;
  autoMappedColumns: Set<string>;
  customFields?: CustomFieldOption[];
  onMappingChange: (header: string, value: string) => void;
  onAutoMap: () => void;
  onClearAll: () => void;
}

export function ColumnMapper({
  headers,
  mapping,
  sampleData,
  autoMappedColumns,
  customFields = [],
  onMappingChange,
  onAutoMap,
  onClearAll,
}: ColumnMapperProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Build target options including custom fields
  const allTargetOptions = [...TARGET_OPTIONS];
  const memberCustomFields = customFields.filter((f) => f.entity === "MEMBER");
  const contactCustomFields = customFields.filter((f) => f.entity === "CONTACT");
  if (memberCustomFields.length > 0 || contactCustomFields.length > 0) {
    const customOptions: { value: string; label: string }[] = [];
    for (const f of memberCustomFields) {
      customOptions.push({ value: `custom:${f.key}:${f.id}`, label: `${f.name} (member)` });
    }
    for (const f of contactCustomFields) {
      customOptions.push({ value: `custom:${f.key}:${f.id}`, label: `${f.name} (contact)` });
    }
    allTargetOptions.push({ group: "Custom Fields", options: customOptions });
  }

  const mappedCount = Object.keys(mapping).length;
  const totalCount = headers.length;

  // Separate mapped vs unmapped headers
  const mappedHeaders = headers.filter((h) => mapping[h]);
  const unmappedHeaders = headers.filter((h) => !mapping[h]);

  // Filter by search query
  const matchesSearch = (header: string) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (header.toLowerCase().includes(q)) return true;
    const samples = sampleData[header] || [];
    return samples.some((s) => s.toLowerCase().includes(q));
  };

  const filteredMapped = mappedHeaders.filter(matchesSearch);
  const filteredUnmapped = unmappedHeaders.filter(matchesSearch);

  // Detect which target values are already used (for duplicate warnings)
  const usedTargets = new Map<string, string>();
  for (const [header, m] of Object.entries(mapping)) {
    const val = `${m.entity}:${m.target}`;
    usedTargets.set(val, header);
  }

  // Check required fields
  const hasNameField = Object.values(mapping).some(
    (m) => m.target === "firstName" || m.target === "lastName" || m.target === "displayName" || m.target === "fullName"
  );
  const hasEmailField = Object.values(mapping).some((m) => m.target === "email");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Column Mapping</CardTitle>
              <CardDescription>
                {mappedCount} of {totalCount} columns mapped
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onAutoMap}>
              <RotateCcw className="h-3.5 w-3.5" />
              Auto-map
            </Button>
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${totalCount > 0 ? (mappedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Mapping rows */}
        <div className="max-h-[32rem] space-y-1 overflow-y-auto">
          {/* Mapped section */}
          {filteredMapped.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Mapped Columns ({filteredMapped.length})
              </div>
              {filteredMapped.map((header) => (
                <MappingRow
                  key={header}
                  header={header}
                  mapping={mapping[header]}
                  sampleValues={sampleData[header] || []}
                  isAutoMapped={autoMappedColumns.has(header)}
                  usedTargets={usedTargets}
                  currentHeader={header}
                  targetOptions={allTargetOptions}
                  onMappingChange={onMappingChange}
                />
              ))}
            </div>
          )}

          {/* Unmapped section */}
          {filteredUnmapped.length > 0 && (
            <div className={filteredMapped.length > 0 ? "mt-4" : ""}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Unmapped Columns ({filteredUnmapped.length})
              </div>
              {filteredUnmapped.map((header) => (
                <MappingRow
                  key={header}
                  header={header}
                  mapping={undefined}
                  sampleValues={sampleData[header] || []}
                  isAutoMapped={false}
                  usedTargets={usedTargets}
                  currentHeader={header}
                  targetOptions={allTargetOptions}
                  onMappingChange={onMappingChange}
                />
              ))}
            </div>
          )}

          {filteredMapped.length === 0 && filteredUnmapped.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No columns match your search
            </div>
          )}
        </div>

        {/* Required field warnings */}
        {(!hasNameField || !hasEmailField) && (
          <div className="space-y-1 rounded-md border border-yellow-200 bg-yellow-50 p-3">
            {!hasNameField && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                No name field mapped (First Name, Last Name, Display Name, or Full Name)
              </div>
            )}
            {!hasEmailField && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                No email column mapped — members won&apos;t have email addresses
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Individual mapping row ────────────────────────────────

function MappingRow({
  header,
  mapping,
  sampleValues,
  isAutoMapped,
  usedTargets,
  currentHeader,
  targetOptions,
  onMappingChange,
}: {
  header: string;
  mapping: ColumnMapping | undefined;
  sampleValues: string[];
  isAutoMapped: boolean;
  usedTargets: Map<string, string>;
  currentHeader: string;
  targetOptions: { group: string; options: { value: string; label: string }[] }[];
  onMappingChange: (header: string, value: string) => void;
}) {
  const isMapped = !!mapping;
  const currentValue = mapping
    ? mapping.entity === "custom" && mapping.customFieldId
      ? `custom:${mapping.target}:${mapping.customFieldId}`
      : `${mapping.entity}:${mapping.target}`
    : "";

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
        isMapped
          ? "border-l-4 border-l-green-500 border-t-[var(--border)] border-r-[var(--border)] border-b-[var(--border)] bg-green-50/50"
          : "border-l-4 border-l-gray-200 border-t-[var(--border)] border-r-[var(--border)] border-b-[var(--border)]"
      }`}
    >
      {/* Status dot */}
      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${isMapped ? "bg-green-500" : "bg-gray-300"}`} />

      {/* Column name + badges */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium" title={header}>
            {header}
          </span>
          {isAutoMapped && (
            <Badge variant="secondary" className="flex-shrink-0 px-1.5 py-0 text-[10px]">
              auto
            </Badge>
          )}
        </div>
        {sampleValues.length > 0 && (
          <div className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]" title={sampleValues.join(", ")}>
            {sampleValues.map((v, i) => (
              <span key={i}>
                {i > 0 && ", "}
                &ldquo;{v.length > 24 ? v.slice(0, 24) + "..." : v}&rdquo;
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Target selector */}
      <div className="flex-shrink-0">
        <Select
          value={currentValue}
          onChange={(e) => onMappingChange(header, e.target.value)}
          className="w-48 text-sm"
        >
          <option value="">-- Skip --</option>
          {targetOptions.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => {
                const isDuplicate = usedTargets.has(opt.value) && usedTargets.get(opt.value) !== currentHeader;
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{isDuplicate ? " (in use)" : ""}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Select>
      </div>

      {/* Clear button */}
      {isMapped && (
        <button
          onClick={() => onMappingChange(header, "")}
          className="flex-shrink-0 rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          title="Unmap column"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
