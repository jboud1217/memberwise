"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createImportJob, importMembers } from "@/actions/import";
import { autoMapColumns } from "@/lib/import-utils";
import { Upload, Check, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const MEMBER_TARGETS = [
  { value: "", label: "— Skip —" },
  { value: "member:displayName", label: "Display Name" },
  { value: "member:organizationName", label: "Organization Name" },
  { value: "member:status", label: "Status" },
  { value: "member:memberNumber", label: "Member Number" },
  { value: "member:address1", label: "Address Line 1" },
  { value: "member:city", label: "City" },
  { value: "member:state", label: "State" },
  { value: "member:zip", label: "ZIP" },
  { value: "member:country", label: "Country" },
  { value: "member:legacyId", label: "Legacy Member ID" },
  { value: "member:legacyOrganizationId", label: "Legacy Org ID" },
  { value: "member:memberSince", label: "Member Since" },
  { value: "member:renewalDate", label: "Renewal Date" },
  { value: "member:tierName", label: "Tier Name" },
  { value: "contact:firstName", label: "First Name" },
  { value: "contact:lastName", label: "Last Name" },
  { value: "contact:email", label: "Email" },
  { value: "contact:phone", label: "Phone" },
  { value: "contact:mobile", label: "Mobile" },
  { value: "contact:linkToOrganizationId", label: "Link to Org ID" },
];

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, { target: string; entity: string }>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ processedRows: number; errorRows: number; errors: { row: number; error: string }[] } | null>(null);

  // Step 1: Upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const hdrs = results.meta.fields || [];
        setHeaders(hdrs);
        setRows(data);

        // Auto-map columns
        const autoMapped = autoMapColumns(hdrs);
        // Convert to our format
        const mapping: Record<string, { target: string; entity: string }> = {};
        for (const [col, map] of Object.entries(autoMapped)) {
          mapping[col] = map;
        }
        setColumnMapping(mapping);
        setStep(2);
      },
    });
  }

  // Step 2: Column mapping
  function handleMappingChange(header: string, value: string) {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[header];
      } else {
        const [entity, target] = value.split(":");
        next[header] = { target, entity };
      }
      return next;
    });
  }

  // Step 4: Import
  async function handleImport() {
    setImporting(true);
    const job = await createImportJob(fileName);
    const res = await importMembers(rows, columnMapping, job.id);
    setResult(res);
    setImporting(false);
    setStep(4);
  }

  const steps = [
    { num: 1, label: "Upload" },
    { num: 2, label: "Map Columns" },
    { num: 3, label: "Review" },
    { num: 4, label: "Import" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Members</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Upload a CSV file to import member data</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s.num
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className="hidden text-sm sm:inline">{s.label}</span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mb-4 text-lg font-medium">Upload your CSV file</p>
            <p className="mb-6 text-sm text-[var(--muted-foreground)]">
              Supports Wild Apricot, MemberClicks, and other CSV exports
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
              Choose File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Map Columns
              <Badge variant="secondary" className="ml-2">{headers.length} columns detected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Sample Data</TableHead>
                    <TableHead>Maps To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-medium text-sm">{header}</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)] max-w-48 truncate">
                        {rows[0]?.[header] || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[header] ? `${columnMapping[header].entity}:${columnMapping[header].target}` : ""}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className="w-48"
                        >
                          {MEMBER_TARGETS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">File:</span> {fileName}
              </div>
              <div>
                <span className="font-medium">Total Rows:</span> {rows.length}
              </div>
              <div>
                <span className="font-medium">Mapped Columns:</span> {Object.keys(columnMapping).length}
              </div>
              <div>
                <span className="font-medium">Unmapped Columns:</span> {headers.length - Object.keys(columnMapping).length}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Column Mappings:</h3>
              <div className="space-y-1">
                {Object.entries(columnMapping).map(([csv, mapping]) => (
                  <div key={csv} className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--muted-foreground)]">{csv}</span>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="secondary">{mapping.entity}: {mapping.target}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  <>Import {rows.length} Rows</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {result.errorRows === 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Processed:</span> {result.processedRows}
              </div>
              <div>
                <span className="font-medium">Errors:</span> {result.errorRows}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-red-600">Errors:</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-600">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => router.push("/members")}>View Members</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
