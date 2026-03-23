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
import { PLATFORM_GUIDES, calculateMigrationScore } from "@/lib/platform-guides";
import {
  Upload,
  Check,
  AlertCircle,
  AlertTriangle,
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
  ShieldCheck,
  CircleAlert,
  Copy,
  Calendar,
  Sparkles,
  BookOpen,
  CircleCheck,
  CircleX,
  Trophy,
} from "lucide-react";

type Step = 1 | 2 | 3;

const PLATFORM_LABELS: Record<Platform, string> = {
  memberclicks: "MemberClicks",
  wildapricot: "Wild Apricot",
  growthzone: "GrowthZone",
  yourmembership: "YourMembership",
  hivebrite: "Hivebrite",
  clubexpress: "ClubExpress",
  neoncrm: "Neon CRM",
  glueup: "Glue Up",
  memberplanet: "MemberPlanet",
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
  const [confidence, setConfidence] = useState<Record<string, "exact" | "high" | "medium" | "low">>({});
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
    }).catch(() => {
      // Custom fields are optional — continue without them
    });
  }, []);

  // Excel multi-sheet state
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  // Live preview: recalculates whenever mapping changes
  const livePreview = useMemo(() => {
    if (!headers.length || !rows.length) return null;
    return analyzeWithMapping(headers, rows, mapping, platform, confidence);
  }, [headers, rows, mapping, platform, confidence]);

  const tiers = livePreview ? extractTiers(livePreview.memberTypes) : [];

  // Migration completeness score
  const migrationScore = useMemo(() => {
    if (!livePreview) return null;
    const mappedTargets = new Set(Object.values(mapping).map((m) => m.target));
    return calculateMigrationScore(
      mappedTargets,
      livePreview.totalRows,
      livePreview.rowsWithEmail,
      livePreview.validation
    );
  }, [livePreview, mapping]);

  // Platform guide
  const platformGuide = platform !== "generic" ? PLATFORM_GUIDES[platform] : null;

  // Export guide toggle
  const [showExportGuide, setShowExportGuide] = useState(false);

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

    const { mapping: autoMap, confidence: autoConfidence } = autoMapColumns(hdrs, detected);
    setMapping(autoMap);
    setConfidence(autoConfidence);
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
    const { mapping: autoMap, confidence: autoConfidence } = autoMapColumns(headers, platform);
    setMapping(autoMap);
    setConfidence(autoConfidence);
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
    setConfidence({});
    setSheets([]);
    setShowSheetSelector(false);
    setShowExportGuide(false);
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
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="mb-2 text-lg font-medium">Upload your spreadsheet</p>
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                Supports CSV, Excel (.xlsx, .xls), and OpenDocument (.ods) formats.
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

          {/* Supported platforms grid */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">
              We auto-detect exports from these platforms
            </h3>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-3">
              {(Object.entries(PLATFORM_GUIDES) as [Platform, NonNullable<typeof platformGuide>][]).map(([key, guide]) => (
                <button
                  key={key}
                  onClick={() => { setPlatform(key); setShowExportGuide(true); }}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)]"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0 text-[var(--muted-foreground)]" />
                  <span className="font-medium">{guide.name}</span>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]">Export guide</span>
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-md border border-dashed border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted-foreground)]">
                <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
                <span>Any CSV or Excel file</span>
                <span className="ml-auto text-xs">Auto-mapped</span>
              </div>
            </div>
          </div>

          {/* Platform-specific export guide (toggled) */}
          {showExportGuide && platformGuide && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5" />
                      How to export from {platformGuide.name}
                    </CardTitle>
                    <CardDescription>{platformGuide.tagline}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowExportGuide(false)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step-by-step export instructions */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Export steps</h4>
                  <ol className="space-y-2">
                    {platformGuide.exportSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-6">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips */}
                {platformGuide.tips.length > 0 && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-blue-800">Tips</h4>
                    <ul className="space-y-1">
                      {platformGuide.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What transfers / what doesn't */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-700">
                      <CircleCheck className="h-4 w-4" />
                      What we&apos;ll migrate
                    </h4>
                    <ul className="space-y-1">
                      {platformGuide.dataAvailable.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                          <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)]">
                      <CircleX className="h-4 w-4" />
                      Not included
                    </h4>
                    <ul className="space-y-1">
                      {platformGuide.dataNotAvailable.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                          <span className="h-3.5 w-3.5 flex-shrink-0 text-center text-xs">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
          {/* Platform welcome banner */}
          {platformGuide && livePreview.platform !== "generic" ? (
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="rounded-full bg-green-100 p-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{platformGuide.name} export detected</span>
                    <Badge variant="default">{livePreview.totalRows} rows</Badge>
                  </div>
                  <p className="text-sm text-green-700">{platformGuide.tagline}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-[var(--muted-foreground)]">{fileName}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}

          {/* Migration completeness score */}
          {migrationScore && (
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-6">
                  {/* Overall score circle */}
                  <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={migrationScore.overall >= 80 ? "#22c55e" : migrationScore.overall >= 50 ? "#eab308" : "#f97316"}
                        strokeWidth="3"
                        strokeDasharray={`${migrationScore.overall}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-bold">{migrationScore.overall}%</div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <span className="text-sm font-semibold">Migration Completeness</span>
                      {migrationScore.overall >= 80 && (
                        <Badge variant="default" className="bg-green-500 text-xs">Excellent</Badge>
                      )}
                      {migrationScore.overall >= 50 && migrationScore.overall < 80 && (
                        <Badge variant="secondary" className="text-xs">Good — map more fields to improve</Badge>
                      )}
                      {migrationScore.overall < 50 && (
                        <Badge variant="secondary" className="text-xs">Map more fields to improve</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 lg:grid-cols-6">
                      {migrationScore.categories.map((cat) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--muted-foreground)]">{cat.name}</span>
                            <span className="text-xs font-medium">{cat.score}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                cat.score >= 80 ? "bg-green-500" : cat.score >= 50 ? "bg-yellow-500" : "bg-orange-400"
                              }`}
                              style={{ width: `${cat.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive column mapper */}
          <ColumnMapper
            headers={headers}
            mapping={mapping}
            sampleData={sampleData}
            autoMappedColumns={autoMappedColumns}
            confidence={confidence}
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

          {/* Validation report */}
          {livePreview.validation.totalIssues > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  Data Quality Report
                  <Badge variant="secondary">{livePreview.validation.totalIssues} issues</Badge>
                </CardTitle>
                <CardDescription>
                  Review these issues before importing — records will still import, but some data may be skipped or incorrect
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Issue summary cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {livePreview.validation.invalidEmails > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      <CircleAlert className="h-4 w-4 text-red-500" />
                      <div>
                        <div className="text-sm font-medium text-red-700">{livePreview.validation.invalidEmails} invalid emails</div>
                        <div className="text-xs text-red-600">Won&apos;t be saved</div>
                      </div>
                    </div>
                  )}
                  {livePreview.validation.invalidDates > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="text-sm font-medium text-amber-700">{livePreview.validation.invalidDates} bad dates</div>
                        <div className="text-xs text-amber-600">Will be left blank</div>
                      </div>
                    </div>
                  )}
                  {livePreview.validation.duplicateCount > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                      <Copy className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-blue-700">{livePreview.validation.duplicateCount} duplicate emails</div>
                        <div className="text-xs text-blue-600">May create duplicates</div>
                      </div>
                    </div>
                  )}
                  {livePreview.validation.missingRequired > 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="text-sm font-medium text-yellow-700">{livePreview.validation.missingRequired} missing name/email</div>
                        <div className="text-xs text-yellow-600">Will import as &ldquo;Unknown&rdquo;</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed issue list (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    Show {Math.min(livePreview.validation.issues.length, 50)} of {livePreview.validation.issues.length} issues...
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-2">
                    {livePreview.validation.issues.slice(0, 50).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 border-b border-[var(--border)] px-2 py-1.5 last:border-0 text-xs">
                        <span className="font-mono text-[var(--muted-foreground)]">Row {issue.row}</span>
                        <Badge variant={
                          issue.issue === "invalid_email" ? "destructive" :
                          issue.issue === "duplicate_email_in_file" ? "default" :
                          "secondary"
                        } className="px-1.5 py-0 text-[10px]">
                          {issue.issue === "invalid_email" ? "email" :
                           issue.issue === "invalid_date" ? "date" :
                           issue.issue === "duplicate_email_in_file" ? "duplicate" :
                           "missing"}
                        </Badge>
                        <span className="text-[var(--muted-foreground)]">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Duplicate email summary */}
                {livePreview.validation.duplicateEmails.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      {livePreview.validation.duplicateEmails.length} duplicate email addresses...
                    </summary>
                    <div className="mt-2 space-y-1">
                      {livePreview.validation.duplicateEmails.slice(0, 20).map((dup, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-1.5 text-sm">
                          <span className="font-mono">{dup.email}</span>
                          <span className="text-[var(--muted-foreground)]">
                            {dup.rows.length} rows: {dup.rows.slice(0, 5).join(", ")}{dup.rows.length > 5 ? "..." : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clean data badge */}
          {livePreview.validation.totalIssues === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-700">Data looks clean</div>
                <div className="text-xs text-green-600">No invalid emails, dates, or duplicates detected</div>
              </div>
            </div>
          )}

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
