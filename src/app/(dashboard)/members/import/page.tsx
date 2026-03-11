"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { createImportJob, importMembers } from "@/actions/import";
import {
  analyzeData,
  analyzeWithMapping,
  autoMapColumns,
  detectPlatform,
  extractTiers,
  getSampleValues,
  parseWorkbook,
  type ImportPreview,
  type ColumnMapping,
  type ParsedSheet,
  type Platform,
} from "@/lib/import-utils";
import { ColumnMapper, type CustomFieldOption } from "./column-mapper";
import { getCustomFields } from "@/actions/custom-fields";
import {
  Upload,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Users,
  ContactRound,
  UserPlus,
  Tag,
  CreditCard,
  Mail,
  Layers,
  Table2,
} from "lucide-react";

type Step = 1 | 2 | 3;

const PLATFORM_LABELS: Record<Platform, string> = {
  memberclicks: "MemberClicks",
  wildapricot: "Wild Apricot",
  growthzone: "GrowthZone",
  yourmembership: "YourMembership",
  generic: "Spreadsheet",
};

const ACCEPTED_FORMATS = ".csv,.xlsx,.xls,.ods,.xlsb";

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, string[]>>({});
  const [platform, setPlatform] = useState<Platform>("generic");
  const [mapping, setMapping] = useState<Record<string, ColumnMapping>>({});
  const [autoMappedColumns, setAutoMappedColumns] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    processedRows: number;
    errorRows: number;
    errors: { row: number; error: string }[];
    tiersCreated: number;
    membersCreated: number;
  } | null>(null);

  // Custom fields for mapping
  const [customFields, setCustomFields] = useState<CustomFieldOption[]>([]);

  useEffect(() => {
    getCustomFields().then((fields) => {
      setCustomFields(
        fields.map((f) => ({
          id: f.id,
          name: f.name,
          key: f.key,
          type: f.type,
          entity: f.entity as "MEMBER" | "CONTACT",
        }))
      );
    });
  }, []);

  // Excel multi-sheet state
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  // Live preview: recalculates whenever mapping changes
  const livePreview = useMemo(() => {
    if (!headers.length || !rows.length) return null;
    return analyzeWithMapping(headers, rows, mapping, platform);
  }, [headers, rows, mapping, platform]);

  const tiers = livePreview ? extractTiers(livePreview.memberTypes) : [];

  // ─── File upload handler ─────────────────────────────────

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const isCSV = ext === "csv";

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          const hdrs = results.meta.fields || [];
          loadData(hdrs, data);
        },
      });
    } else {
      // Excel format
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result as ArrayBuffer;
        const parsed = parseWorkbook(data);
        if (parsed.length === 1) {
          loadData(parsed[0].headers, parsed[0].rows);
        } else if (parsed.length > 1) {
          setSheets(parsed);
          setShowSheetSelector(true);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function selectSheet(index: number) {
    const sheet = sheets[index];
    setShowSheetSelector(false);
    loadData(sheet.headers, sheet.rows);
  }

  function loadData(hdrs: string[], data: Record<string, string>[]) {
    setHeaders(hdrs);
    setRows(data);
    setSampleData(getSampleValues(hdrs, data));

    const detected = detectPlatform(hdrs);
    setPlatform(detected);

    const autoMap = autoMapColumns(hdrs, detected);
    setMapping(autoMap);
    setAutoMappedColumns(new Set(Object.keys(autoMap)));
    setStep(2);
  }

  // ─── Mapping handlers ───────────────────────────────────

  function handleMappingChange(header: string, value: string) {
    setMapping((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[header];
      } else if (value.startsWith("custom:")) {
        // Format: "custom:key:fieldId"
        const parts = value.split(":");
        const key = parts[1];
        const fieldId = parts[2];
        next[header] = { target: key, entity: "custom", customFieldId: fieldId };
      } else {
        const [entity, target] = value.split(":");
        next[header] = { target, entity: entity as ColumnMapping["entity"] };
      }
      return next;
    });
  }

  function handleAutoMap() {
    const autoMap = autoMapColumns(headers, platform);
    setMapping(autoMap);
    setAutoMappedColumns(new Set(Object.keys(autoMap)));
  }

  function handleClearAll() {
    setMapping({});
    setAutoMappedColumns(new Set());
  }

  // ─── Import ──────────────────────────────────────────────

  async function handleImport() {
    setImporting(true);
    const job = await createImportJob(fileName);
    const res = await importMembers(rows, mapping, headers, job.id);
    setResult(res);
    setImporting(false);
    setStep(3);
  }

  function resetWizard() {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setSampleData({});
    setMapping({});
    setAutoMappedColumns(new Set());
    setSheets([]);
    setShowSheetSelector(false);
    setResult(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Members</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upload a CSV or Excel file from any platform
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[
          { num: 1, label: "Upload" },
          { num: 2, label: "Map & Review" },
          { num: 3, label: "Done" },
        ].map((s, i) => (
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
            {i < 2 && <div className="h-px w-8 bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && !showSheetSelector && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mb-2 text-lg font-medium">Upload your spreadsheet</p>
            <p className="mb-6 text-sm text-[var(--muted-foreground)]">
              Supports CSV, Excel (.xlsx, .xls), and OpenDocument (.ods) formats.
              <br />
              We&apos;ll auto-detect MemberClicks, Wild Apricot, GrowthZone, YourMembership, or map columns manually.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
              <FileSpreadsheet className="h-4 w-4" />
              Choose File
              <input
                type="file"
                accept={ACCEPTED_FORMATS}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              CSV, XLSX, XLS, ODS
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sheet selector (for multi-sheet Excel files) */}
      {step === 1 && showSheetSelector && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">Select a Sheet</CardTitle>
                <CardDescription>
                  {fileName} contains {sheets.length} sheets — choose which one to import
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sheets.map((sheet, i) => (
              <button
                key={i}
                onClick={() => selectSheet(i)}
                className="flex w-full items-center justify-between rounded-md border border-[var(--border)] p-4 text-left transition-colors hover:bg-[var(--muted)]"
              >
                <div className="flex items-center gap-3">
                  <Table2 className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <div>
                    <div className="font-medium">{sheet.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {sheet.rowCount} rows, {sheet.colCount} columns
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {sheet.headers.slice(0, 3).join(", ")}
                  {sheet.headers.length > 3 && "..."}
                </div>
              </button>
            ))}
            <div className="pt-2">
              <Button variant="outline" onClick={resetWizard}>
                <ArrowLeft className="h-4 w-4" />
                Choose Different File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map & Review */}
      {step === 2 && livePreview && (
        <div className="space-y-6">
          {/* Compact file info bar */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-[var(--muted-foreground)]" />
                <div>
                  <span className="font-medium">{fileName}</span>
                  <Badge variant="default" className="ml-2">
                    {PLATFORM_LABELS[livePreview.platform]}
                  </Badge>
                </div>
              </div>
              <Badge variant="secondary" className="text-base">
                {livePreview.totalRows} rows
              </Badge>
            </CardContent>
          </Card>

          {/* Interactive column mapper */}
          <ColumnMapper
            headers={headers}
            mapping={mapping}
            sampleData={sampleData}
            autoMappedColumns={autoMappedColumns}
            customFields={customFields}
            onMappingChange={handleMappingChange}
            onAutoMap={handleAutoMap}
            onClearAll={handleClearAll}
          />

          {/* Data summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{livePreview.orgRecords}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Households</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-green-100 p-2">
                  <ContactRound className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{livePreview.contactRecords}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Contacts</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-gray-100 p-2">
                  <UserPlus className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{livePreview.standaloneRecords}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Prospects</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{livePreview.rowsWithEmail}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Have Email</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What will be created */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Tiers */}
            {tiers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="h-5 w-5" />
                    Membership Tiers to Create
                  </CardTitle>
                  <CardDescription>Auto-detected from Member Type values</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tiers.map((tier, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2"
                      >
                        <div>
                          <span className="font-medium">{tier.name}</span>
                          <span className="ml-2 text-sm text-[var(--muted-foreground)]">
                            {tier.interval === "TWO_YEAR" ? "/ 2yr" : tier.interval === "MONTHLY" ? "/ mo" : "/ yr"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {tier.price > 0 && (
                            <Badge variant="secondary">${(tier.price / 100).toFixed(0)}</Badge>
                          )}
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {tier.memberCount} members
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status breakdown */}
            {Object.keys(livePreview.memberStatuses).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Member Statuses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(livePreview.memberStatuses)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2"
                        >
                          <span className="font-medium">{status}</span>
                          <span className="text-sm text-[var(--muted-foreground)]">{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment data */}
            {livePreview.rowsWithPayment > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Payment Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-[var(--muted-foreground)]">
                    {livePreview.rowsWithPayment} rows with dues/payment data
                  </p>
                  {Object.keys(livePreview.duesValues).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(livePreview.duesValues)
                        .sort(([, a], [, b]) => b - a)
                        .map(([amount, count]) => (
                          <div key={amount} className="flex items-center justify-between text-sm">
                            <span>${amount}</span>
                            <span className="text-[var(--muted-foreground)]">{count} payments</span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Import action */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetWizard}>
              <ArrowLeft className="h-4 w-4" />
              Choose Different File
            </Button>
            <Button onClick={handleImport} disabled={importing} size="lg">
              {importing ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Importing {rows.length} records...
                </>
              ) : (
                <>
                  Import {rows.length} Records
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {result.errorRows === 0 ? (
                <div className="rounded-full bg-green-100 p-1">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="rounded-full bg-yellow-100 p-1">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-[var(--border)] p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{result.processedRows}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Records Imported</div>
              </div>
              <div className="rounded-md border border-[var(--border)] p-4 text-center">
                <div className="text-2xl font-bold">{result.membersCreated}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Members Created</div>
              </div>
              <div className="rounded-md border border-[var(--border)] p-4 text-center">
                <div className="text-2xl font-bold">{result.tiersCreated}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Tiers Created</div>
              </div>
              {result.errorRows > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.errorRows}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-red-600">Errors:</h3>
                <div className="max-h-48 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-600">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => router.push("/members")}>
                <Users className="h-4 w-4" />
                View Members
              </Button>
              <Button variant="outline" onClick={() => router.push("/tiers")}>
                <Tag className="h-4 w-4" />
                View Tiers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
