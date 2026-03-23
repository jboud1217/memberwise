"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  MapPin,
  Users,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import {
  previewAddressStandardization,
  applyAddressStandardization,
  findDuplicateMembers,
  findUnusedCustomFields,
  deactivateCustomField,
  deleteCustomField,
} from "@/actions/data-cleanup";

type AddressPreview = Awaited<ReturnType<typeof previewAddressStandardization>>;
type DuplicateResult = Awaited<ReturnType<typeof findDuplicateMembers>>;
type CustomFieldInfo = Awaited<ReturnType<typeof findUnusedCustomFields>>;

export default function DataCleanupPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Address standardization state
  const [addressPreview, setAddressPreview] = useState<AddressPreview | null>(null);
  const [addressScanned, setAddressScanned] = useState(false);

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<DuplicateResult | null>(null);
  const [duplicatesScanned, setDuplicatesScanned] = useState(false);

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomFieldInfo | null>(null);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);

  function scanAddresses() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await previewAddressStandardization();
        setAddressPreview(result);
        setAddressScanned(true);
      } catch {
        setMessage({ type: "error", text: "Failed to scan addresses." });
      }
    });
  }

  function applyAddresses() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await applyAddressStandardization();
        setMessage({ type: "success", text: `Standardized addresses for ${result.updated} members.` });
        setAddressPreview(null);
        setAddressScanned(false);
      } catch {
        setMessage({ type: "error", text: "Failed to apply address standardization." });
      }
    });
  }

  function scanDuplicates() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await findDuplicateMembers();
        setDuplicates(result);
        setDuplicatesScanned(true);
      } catch {
        setMessage({ type: "error", text: "Failed to scan for duplicates." });
      }
    });
  }

  function loadCustomFields() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await findUnusedCustomFields();
        setCustomFields(result);
        setFieldsLoaded(true);
      } catch {
        setMessage({ type: "error", text: "Failed to load custom fields." });
      }
    });
  }

  function handleDeactivateField(fieldId: string) {
    startTransition(async () => {
      try {
        await deactivateCustomField(fieldId);
        setCustomFields((prev) => prev?.map((f) => (f.id === fieldId ? { ...f, isActive: false } : f)) || null);
        setMessage({ type: "success", text: "Field deactivated." });
      } catch {
        setMessage({ type: "error", text: "Failed to deactivate field." });
      }
    });
  }

  function handleDeleteField(fieldId: string, name: string) {
    if (!confirm(`Delete "${name}" and all its values? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteCustomField(fieldId);
        setCustomFields((prev) => prev?.filter((f) => f.id !== fieldId) || null);
        setMessage({ type: "success", text: `Deleted "${name}" field.` });
      } catch {
        setMessage({ type: "error", text: "Failed to delete field." });
      }
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Data Cleanup</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Standardize addresses, find duplicates, and clean out unused attributes.
      </p>

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Address Standardization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> Address Standardization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              Normalize state abbreviations (e.g. &quot;Georgia&quot; → &quot;GA&quot;), fix ZIP code formatting, and title-case city names across all member records.
            </p>
            {!addressScanned ? (
              <Button onClick={scanAddresses} disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Scan Addresses
              </Button>
            ) : addressPreview && addressPreview.changes.length > 0 ? (
              <>
                <div className="mb-3 text-sm">
                  Found <strong>{addressPreview.changes.length}</strong> changes across{" "}
                  <strong>{addressPreview.totalMembers}</strong> member records.
                </div>
                <div className="mb-4 max-h-64 overflow-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Before</TableHead>
                        <TableHead></TableHead>
                        <TableHead>After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addressPreview.changes.slice(0, 50).map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{c.displayName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{c.field}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-red-600">{c.before}</TableCell>
                          <TableCell><ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" /></TableCell>
                          <TableCell className="font-mono text-xs text-green-600">{c.after}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {addressPreview.changes.length > 50 && (
                    <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                      ...and {addressPreview.changes.length - 50} more
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={applyAddresses} disabled={isPending}>
                    {isPending && <Spinner className="mr-2 h-4 w-4" />}
                    Apply All Changes
                  </Button>
                  <Button variant="outline" onClick={() => { setAddressScanned(false); setAddressPreview(null); }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> All addresses are already standardized!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duplicate Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" /> Duplicate Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              Find potential duplicate member records based on matching email addresses or names.
            </p>
            {!duplicatesScanned ? (
              <Button onClick={scanDuplicates} disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Scan for Duplicates
              </Button>
            ) : duplicates && duplicates.duplicates.length > 0 ? (
              <>
                <div className="mb-3 text-sm">
                  Found <strong>{duplicates.duplicates.length}</strong> potential duplicate groups across{" "}
                  <strong>{duplicates.totalMembers}</strong> members.
                </div>
                <div className="space-y-3">
                  {duplicates.duplicates.slice(0, 20).map((group, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={group.matchType === "email" ? "default" : "secondary"} className="text-[10px]">
                          {group.matchType}
                        </Badge>
                        <span className="text-xs text-[var(--muted-foreground)]">{group.matchValue}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.members.map((m) => (
                          <a
                            key={m.id}
                            href={`/members/${m.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--accent)]/80"
                          >
                            {m.displayName}
                            <Badge variant={m.status === "ACTIVE" ? "success" : "secondary"} className="text-[8px] px-1">
                              {m.status}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                  {duplicates.duplicates.length > 20 && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      ...and {duplicates.duplicates.length - 20} more groups
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> No duplicate records found!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unused Custom Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5" /> Custom Fields Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              Review custom fields, see which ones have no data, and deactivate or remove unused attributes.
            </p>
            {!fieldsLoaded ? (
              <Button onClick={loadCustomFields} disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Load Custom Fields
              </Button>
            ) : customFields && customFields.length > 0 ? (
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Values</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((f) => (
                      <TableRow key={f.id} className={!f.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium text-sm">{f.name}</TableCell>
                        <TableCell className="font-mono text-xs">{f.key}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{f.type}</Badge></TableCell>
                        <TableCell className="text-xs">{f.entity}</TableCell>
                        <TableCell className="text-right">
                          <span className={f.valueCount === 0 ? "text-amber-600 font-medium" : ""}>
                            {f.valueCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.isActive ? "success" : "secondary"} className="text-[10px]">
                            {f.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {f.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivateField(f.id)}
                                disabled={isPending}
                                title="Deactivate"
                              >
                                <EyeOff className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {f.valueCount === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(f.id, f.name)}
                                disabled={isPending}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                No custom fields found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
