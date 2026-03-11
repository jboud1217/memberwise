"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboardingData } from "@/actions/onboarding";
import { THEMES, isDarkTheme, getRecommendedThemes } from "@/lib/themes";
import { TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Building2,
  Church,
  Trophy,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  BookOpen,
  CreditCard,
  Mail,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Layers,
  Zap,
  FileSpreadsheet,
  Star,
  Sparkles,
} from "lucide-react";

const ORG_TYPES = [
  { id: "civic", label: "Civic Association", icon: Building2, color: "from-blue-500 to-indigo-600" },
  { id: "nonprofit", label: "Nonprofit", icon: Heart, color: "from-rose-500 to-pink-600" },
  { id: "church", label: "Church / Religious", icon: Church, color: "from-amber-500 to-orange-600" },
  { id: "sports", label: "Sports League", icon: Trophy, color: "from-emerald-500 to-teal-600" },
  { id: "hoa", label: "HOA / Community", icon: Home, color: "from-cyan-500 to-blue-600" },
  { id: "professional", label: "Professional Assoc.", icon: Briefcase, color: "from-violet-500 to-purple-600" },
  { id: "alumni", label: "Alumni Group", icon: GraduationCap, color: "from-indigo-500 to-blue-600" },
  { id: "other", label: "Other", icon: Users, color: "from-slate-500 to-gray-600" },
];

const MEMBER_COUNTS = [
  { label: "1-50", desc: "Small" },
  { label: "51-200", desc: "Growing" },
  { label: "201-500", desc: "Medium" },
  { label: "501-1,000", desc: "Large" },
  { label: "1,000+", desc: "Enterprise" },
];

const PRIORITY_FEATURES = [
  { id: "directory", label: "Member Directory", icon: BookOpen, desc: "Searchable member listings" },
  { id: "dues", label: "Dues & Payments", icon: CreditCard, desc: "Collect and track payments" },
  { id: "email", label: "Email Campaigns", icon: Mail, desc: "Send newsletters & updates" },
  { id: "events", label: "Events", icon: Calendar, desc: "Manage registrations" },
];

const DATA_SOURCES = [
  { id: "memberclicks", label: "MemberClicks", icon: Upload },
  { id: "wild-apricot", label: "Wild Apricot", icon: Upload },
  { id: "growthzone", label: "GrowthZone", icon: Upload },
  { id: "yourmembership", label: "YourMembership", icon: Upload },
  { id: "spreadsheet", label: "Excel / Spreadsheet", icon: FileSpreadsheet },
  { id: "fresh", label: "Starting Fresh", icon: Zap },
];

const SPREADSHEET_FIELDS = [
  "Names (first/last)",
  "Email addresses",
  "Phone numbers",
  "Mailing addresses",
  "Membership status",
  "Member type / tier",
  "Dues / payment info",
  "Join dates",
  "Custom fields",
];

const STEP_LABELS = ["About", "Data", "Theme", "Layout", "Launch"];
const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  // Step 1
  const [orgType, setOrgType] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [features, setFeatures] = useState<string[]>([]);

  // Step 2
  const [dataSource, setDataSource] = useState("");
  const [spreadsheetFields, setSpreadsheetFields] = useState<string[]>([]);

  // Step 3
  const [selectedTheme, setSelectedTheme] = useState("modern-minimal");

  // Step 4
  const [selectedTemplate, setSelectedTemplate] = useState("starter");

  const recommended = orgType ? getRecommendedThemes(orgType) : [];
  const recommendedIds = new Set(recommended.map((t) => t.id));

  const sortedThemes = orgType
    ? [...THEMES].sort((a, b) => {
        const aRec = recommendedIds.has(a.id) ? 0 : 1;
        const bRec = recommendedIds.has(b.id) ? 0 : 1;
        return aRec - bRec;
      })
    : THEMES;

  function toggleFeature(id: string) {
    setFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function toggleSpreadsheetField(field: string) {
    setSpreadsheetFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  }

  function canAdvance() {
    if (step === 1) return orgType && memberCount;
    if (step === 2) return dataSource;
    if (step === 3) return selectedTheme;
    if (step === 4) return selectedTemplate;
    return true;
  }

  function goToStep(s: number) {
    setStep(s);
    setAnimKey((k) => k + 1);
  }

  async function handleFinish(redirectTo = "/dashboard") {
    setSaving(true);
    setError(null);
    try {
      await saveOnboardingData({
        organizationType: orgType,
        approximateMemberCount: memberCount,
        priorityFeatures: features,
        dataSource,
        spreadsheetFields: dataSource === "spreadsheet" ? spreadsheetFields : undefined,
        theme: selectedTheme,
        layoutTemplate: selectedTemplate,
        completedAt: new Date().toISOString(),
      });
      router.push(redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
          <span className="text-base font-bold text-white">M</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">MemberWise</span>
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const isComplete = s < step;
            const isCurrent = s === step;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    isComplete
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                      : isCurrent
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_2px_8px_rgba(99,102,241,0.3)] ring-4 ring-[var(--primary)]/20"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isCurrent ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress track */}
        <div className="relative h-1 rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div key={`step-${animKey}`} className="animate-fade-in-up">
        {/* Step 1: About Your Organization */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">About Your Organization</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Help us tailor MemberWise to your needs
              </p>
            </div>

            {/* Org type */}
            <div>
              <label className="mb-3 block text-sm font-semibold">What type of organization?</label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {ORG_TYPES.map((type) => {
                  const selected = orgType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setOrgType(type.id)}
                      className={`group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-sm font-medium transition-all duration-200 ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--accent)] shadow-[var(--shadow-md)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-sm)]"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${type.color} text-white shadow-sm transition-transform duration-200 ${!selected ? "group-hover:scale-105" : ""}`}>
                        <type.icon className="h-5 w-5" />
                      </div>
                      <span className="text-center leading-tight">{type.label}</span>
                      {selected && (
                        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Member count */}
            <div>
              <label className="mb-3 block text-sm font-semibold">Approximately how many members?</label>
              <div className="flex flex-wrap gap-2.5">
                {MEMBER_COUNTS.map((count) => {
                  const selected = memberCount === count.label;
                  return (
                    <button
                      key={count.label}
                      type="button"
                      onClick={() => setMemberCount(count.label)}
                      className={`rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-sm)]"
                      }`}
                    >
                      <span className="block">{count.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${selected ? "text-white/70" : "text-[var(--muted-foreground)]"}`}>{count.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="mb-3 block text-sm font-semibold">
                What features matter most?{" "}
                <span className="text-[var(--muted-foreground)] font-normal">(select all that apply)</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PRIORITY_FEATURES.map((feature) => {
                  const selected = features.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className={`group flex items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--accent)] shadow-[var(--shadow-sm)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-sm)]"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        selected ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}>
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block">{feature.label}</span>
                        <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">{feature.desc}</span>
                      </div>
                      {selected && <Check className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Data Migration */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Data Migration</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Where is your member data coming from?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {DATA_SOURCES.map((source) => {
                const selected = dataSource === source.id;
                const Icon = source.icon;
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setDataSource(source.id)}
                    className={`group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 text-sm font-medium transition-all duration-200 ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--accent)] shadow-[var(--shadow-md)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      selected ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {source.label}
                    {selected && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {dataSource === "spreadsheet" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] animate-fade-in-up">
                <h3 className="text-sm font-semibold">What data does your spreadsheet include?</h3>
                <p className="mb-4 mt-1 text-xs text-[var(--muted-foreground)]">
                  This helps us pre-configure the import column mapper for you.
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {SPREADSHEET_FIELDS.map((field) => {
                    const selected = spreadsheetFields.includes(field);
                    return (
                      <label
                        key={field}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--accent)]"
                            : "border-[var(--border)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSpreadsheetField(field)}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            selected
                              ? "border-[var(--primary)] bg-[var(--primary)]"
                              : "border-[var(--border)]"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {field}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {dataSource && dataSource !== "fresh" && dataSource !== "spreadsheet" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] p-5 animate-fade-in-up">
                <p className="text-sm leading-relaxed">
                  We support direct CSV/Excel imports from <strong>{DATA_SOURCES.find((s) => s.id === dataSource)?.label}</strong>.
                  After setup, go to <strong>Members &rarr; Import</strong> to upload your export file.
                  Column mapping will be auto-detected.
                </p>
              </div>
            )}

            {dataSource === "fresh" && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 animate-fade-in-up">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-200 leading-relaxed">
                    No problem! You can start adding members manually or set up a public join page later.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Choose Your Theme */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Choose Your Theme</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Pick a visual style for your site. You can change this anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sortedThemes.map((theme) => {
                const dark = isDarkTheme(theme.id);
                const isRecommended = recommendedIds.has(theme.id);
                const selected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`group overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                      selected
                        ? "border-[var(--primary)] shadow-[0_4px_12px_rgba(99,102,241,0.2)] ring-2 ring-[var(--primary)]/20"
                        : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-md)]"
                    }`}
                  >
                    <div
                      style={{
                        backgroundColor: theme.variables["--background"],
                        color: theme.variables["--foreground"],
                        ...(dark ? { colorScheme: "dark" as const } : {}),
                      }}
                      className="relative p-2.5"
                    >
                      {isRecommended && (
                        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-1.5 py-0.5 shadow-sm">
                          <Star className="h-2.5 w-2.5 text-amber-900" />
                          <span className="text-[8px] font-bold text-amber-900">REC</span>
                        </div>
                      )}
                      {selected && (
                        <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div
                        style={{ backgroundColor: theme.variables["--primary"] }}
                        className="mb-2 h-5 rounded flex items-center px-1.5"
                      >
                        <div className="flex gap-0.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.variables["--card"],
                          borderColor: theme.variables["--border"],
                          borderRadius: theme.variables["--radius"],
                        }}
                        className="mb-2 border p-1.5"
                      >
                        <div
                          className="mb-1 h-1.5 w-3/4 rounded-full"
                          style={{ backgroundColor: theme.variables["--foreground"], opacity: 0.6 }}
                        />
                        <div
                          className="h-1 w-1/2 rounded-full"
                          style={{ backgroundColor: theme.variables["--muted-foreground"], opacity: 0.4 }}
                        />
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.variables["--primary"],
                          borderRadius: theme.variables["--radius"],
                        }}
                        className="h-4 w-full"
                      />
                    </div>
                    <div className="bg-[var(--background)] px-2.5 py-2">
                      <p className="text-xs font-semibold">{theme.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] leading-tight mt-0.5">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Choose Your Layout Template */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Choose Your Layout</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Select a page layout template. You can change this anytime.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {TEMPLATES.map((template) => {
                const selected = selectedTemplate === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`group overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                      selected
                        ? "border-[var(--primary)] shadow-[0_4px_12px_rgba(99,102,241,0.2)] ring-2 ring-[var(--primary)]/20"
                        : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-md)]"
                    }`}
                  >
                    <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={template.previewImage}
                        alt={template.name}
                        className="h-full w-full object-cover object-top brightness-75 contrast-110 saturate-50 transition-all duration-300 group-hover:scale-105 group-hover:brightness-90"
                      />
                      {selected && (
                        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] shadow-md">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold">{template.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                        {template.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                          {template.portalNavStyle}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                          {template.pages.length} pages
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Ready to Go */}
        {step === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)]">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">You&apos;re All Set!</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Here&apos;s a summary of your setup. You can always change these in settings.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] space-y-3">
              {[
                { label: "Organization type", value: ORG_TYPES.find((t) => t.id === orgType)?.label },
                { label: "Member count", value: memberCount },
                { label: "Data source", value: DATA_SOURCES.find((s) => s.id === dataSource)?.label },
                { label: "Theme", value: THEMES.find((t) => t.id === selectedTheme)?.name },
                { label: "Layout", value: TEMPLATES.find((t) => t.id === selectedTemplate)?.name },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[var(--muted-foreground)]">{item.label}:</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Next steps */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Recommended next steps</h3>
              <div className="space-y-2">
                {dataSource !== "fresh" && (
                  <button
                    type="button"
                    onClick={() => handleFinish(`/members/import${dataSource !== "spreadsheet" ? `?source=${dataSource}` : ""}`)}
                    disabled={saving}
                    className="group flex w-full items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">Import your members</span>
                      <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">Upload a CSV or Excel file</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleFinish("/tiers")}
                  disabled={saving}
                  className="group flex w-full items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Set up membership tiers</span>
                    <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">Define plans and pricing</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish("/settings/billing")}
                  disabled={saving}
                  className="group flex w-full items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Connect Stripe for payments</span>
                    <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">Start collecting dues online</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2.5">
          <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-px">
            <span className="text-xs font-bold">!</span>
          </div>
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => goToStep(step - 1)} className="gap-1.5 text-[var(--muted-foreground)]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS ? (
          <Button onClick={() => goToStep(step + 1)} disabled={!canAdvance()} size="lg" className="gap-2 min-w-[140px] rounded-xl">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => handleFinish()} disabled={saving} size="lg" className="gap-2 min-w-[180px] rounded-xl">
            {saving ? <Spinner className="h-4 w-4" /> : null}
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
