"use client";

import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Copy,
  FileText,
  ArrowLeft,
  Pencil,
  GripVertical,
  Paintbrush,
  Type,
  Sparkles,
  Loader2,
  Search,
} from "lucide-react";
import type { PageDocument, SectionDocument, SectionType, SectionStyle } from "@/lib/types/site-document";
import { SectionEditor, SECTION_TYPE_INFO, SECTION_CATEGORIES } from "./section-editors";
import { SectionStyleEditor } from "./section-style-editor";
import { aiGenerateSectionContent } from "@/actions/ai";

// ─── Types ───────────────────────────────────────────

interface PageEditorProps {
  pages: PageDocument[];
  onPagesChange: (pages: PageDocument[]) => void;
  onDirty: () => void;
  selectedSectionId?: string | null;
  onSectionSelect?: (sectionId: string | null) => void;
  insertAtPosition?: { pageSlug: string; position: number } | null;
  onInsertHandled?: () => void;
}

// ─── Field Helper ────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-[var(--muted-foreground)]">{label}</Label>
      {children}
    </div>
  );
}

// ─── Categorized Add Section Picker ─────────────────

function AddSectionPicker({
  onAdd,
  onAddWithPreset,
  onCancel,
}: {
  onAdd: (type: SectionType) => void;
  onAddWithPreset: (type: SectionType, preset: SectionPreset) => void;
  onCancel: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [presetType, setPresetType] = useState<SectionType | null>(null);

  const allTypes = Object.entries(SECTION_TYPE_INFO);

  const filteredTypes = search
    ? allTypes.filter(
        ([type, info]) =>
          info.label.toLowerCase().includes(search.toLowerCase()) ||
          info.description.toLowerCase().includes(search.toLowerCase()) ||
          type.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory === "all"
    ? allTypes
    : allTypes.filter(([, info]) => info.category === activeCategory);

  return (
    <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold">Add Section</span>
        <button onClick={onCancel} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          Cancel
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setActiveCategory("all");
          }}
          placeholder="Search sections..."
          className="h-8 pl-7 text-xs"
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-medium transition-all",
              activeCategory === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            )}
          >
            All
          </button>
          {SECTION_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-medium transition-all",
                activeCategory === cat.key
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Preset selection view */}
      {presetType && SECTION_PRESETS[presetType] ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPresetType(null)}
              className="text-[10px] text-[var(--primary)] hover:underline"
            >
              &larr; Back
            </button>
            <span className="text-[11px] font-medium">
              {SECTION_TYPE_INFO[presetType]?.icon} {SECTION_TYPE_INFO[presetType]?.label} Presets
            </span>
          </div>
          <button
            onClick={() => onAdd(presetType)}
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]"
          >
            <Plus className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <div>
              <p className="text-[11px] font-medium">Blank</p>
              <p className="text-[9px] text-[var(--muted-foreground)]">Start with default content</p>
            </div>
          </button>
          {SECTION_PRESETS[presetType]!.map((preset, i) => (
            <button
              key={i}
              onClick={() => onAddWithPreset(presetType, preset)}
              className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--accent)] hover:shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <div>
                <p className="text-[11px] font-medium">{preset.name}</p>
                <p className="text-[9px] text-[var(--muted-foreground)]">{preset.description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Section types */
        <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto">
          {filteredTypes.length === 0 ? (
            <p className="col-span-2 py-4 text-center text-xs text-[var(--muted-foreground)]">No sections match your search</p>
          ) : (
            filteredTypes.map(([type, info]) => {
              const hasPresets = SECTION_PRESETS[type as SectionType]?.length;
              return (
                <button
                  key={type}
                  onClick={() => {
                    if (hasPresets) {
                      setPresetType(type as SectionType);
                    } else {
                      onAdd(type as SectionType);
                    }
                  }}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--accent)] hover:shadow-sm"
                >
                  <span className="text-base shrink-0">{info.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-tight">{info.label}</p>
                    <p className="text-[9px] text-[var(--muted-foreground)] leading-tight truncate">{info.description}</p>
                  </div>
                  {hasPresets && (
                    <span className="rounded bg-violet-100 px-1 py-0.5 text-[8px] font-medium text-violet-600 shrink-0">
                      Presets
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section Editor Tabs (Content / Style) ──────────

function SectionEditorTabs({
  section,
  onUpdate,
}: {
  section: SectionDocument;
  onUpdate: (section: SectionDocument) => void;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [aiPending, startAiTransition] = useTransition();
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiError, setAiError] = useState("");

  // Sections that don't benefit from AI content generation
  const noAiTypes = new Set(["spacer", "divider", "custom-html", "google-map", "calendar-widget", "social-feed", "social-links"]);
  const showAiButton = !noAiTypes.has(section.type);

  function handleAiGenerate(prompt?: string) {
    setAiError("");
    startAiTransition(async () => {
      const result = await aiGenerateSectionContent(section.type, section.props, prompt);
      if ("error" in result) {
        setAiError(result.error || "AI generation failed");
      } else if (result.props) {
        onUpdate({ ...section, props: result.props });
        setShowAiPrompt(false);
        setAiPrompt("");
      }
    });
  }

  return (
    <div>
      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            activeTab === "content"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Type className="h-3.5 w-3.5" />
          Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("style")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            activeTab === "style"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Paintbrush className="h-3.5 w-3.5" />
          Style
        </button>
        {showAiButton && (
          <div className="ml-auto flex items-center pr-2">
            <button
              type="button"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              disabled={aiPending}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                showAiPrompt
                  ? "bg-violet-100 text-violet-700"
                  : "text-violet-600 hover:bg-violet-50"
              )}
            >
              {aiPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              AI
            </button>
          </div>
        )}
      </div>

      {/* AI prompt bar */}
      {showAiPrompt && (
        <div className="border-b border-[var(--border)] bg-violet-50/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAiGenerate(aiPrompt || undefined);
                }
              }}
              placeholder="Describe what you want (or leave empty for auto-generate)..."
              className="flex-1 text-xs h-8 bg-white"
              disabled={aiPending}
            />
            <Button
              size="sm"
              onClick={() => handleAiGenerate(aiPrompt || undefined)}
              disabled={aiPending}
              className="h-8 bg-violet-600 hover:bg-violet-700 text-xs"
            >
              {aiPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
            </Button>
          </div>
          {aiError && (
            <p className="mt-1.5 text-[10px] text-red-500">{aiError}</p>
          )}
        </div>
      )}

      <div className="p-3">
        {activeTab === "content" ? (
          <SectionEditor
            section={section}
            onChange={(newProps) => onUpdate({ ...section, props: newProps })}
          />
        ) : (
          <SectionStyleEditor
            style={section.style || {}}
            onChange={(newStyle) => onUpdate({ ...section, style: newStyle })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Section List Item ───────────────────────────────

function SectionItem({
  section,
  index,
  total,
  isOpen,
  onToggle,
  onUpdate,
  onMove,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
}: {
  section: SectionDocument;
  index: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (section: SectionDocument) => void;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
}) {
  const info = SECTION_TYPE_INFO[section.type];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border transition-all",
        !section.visible && "opacity-50",
        isDragOver && "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/30",
        isOpen
          ? "border-[var(--primary)]/40 bg-[var(--card)] shadow-sm"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]/30"
      )}
    >
      {/* Header */}
      <div className="flex w-full items-center gap-1 px-1 py-2.5 text-left">
        <div
          className="cursor-grab rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
        <span className="text-sm">{info?.icon || "📦"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{info?.label || section.type}</p>
          {!isOpen && typeof section.props.heading === "string" && (
            <p className="text-[10px] text-[var(--muted-foreground)] truncate">
              {section.props.heading}
            </p>
          )}
        </div>
        {!section.visible && (
          <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[9px] text-[var(--muted-foreground)]">
            Hidden
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        </button>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-[var(--border)]">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 border-b border-[var(--border)] px-2 py-1.5">
            <button
              type="button"
              onClick={() => onMove("up")}
              disabled={index === 0}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove("down")}
              disabled={index === total - 1}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1 h-4 w-px bg-[var(--border)]" />
            <button
              type="button"
              onClick={onToggleVisibility}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              title={section.visible ? "Hide section" : "Show section"}
            >
              {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              title="Duplicate section"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title="Delete section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Section editor with tabs */}
          <SectionEditorTabs
            section={section}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page Detail View ────────────────────────────────

function PageDetail({
  page,
  onBack,
  onUpdate,
  onDirty,
  selectedSectionId,
  insertAtPosition,
  onInsertHandled,
}: {
  page: PageDocument;
  onBack: () => void;
  onUpdate: (page: PageDocument) => void;
  onDirty: () => void;
  selectedSectionId?: string | null;
  insertAtPosition?: number;
  onInsertHandled?: () => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Auto-open section when clicked from preview
  useEffect(() => {
    if (selectedSectionId && page.sections.some((s) => s.id === selectedSectionId)) {
      setOpenSection(selectedSectionId);
    }
  }, [selectedSectionId, page.sections]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [addAtIndex, setAddAtIndex] = useState<number | null>(null);

  // Handle insert from visual editor
  useEffect(() => {
    if (insertAtPosition !== undefined) {
      setAddAtIndex(insertAtPosition);
      setShowAddPicker(true);
      onInsertHandled?.();
    }
  }, [insertAtPosition, onInsertHandled]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function handleDrop() {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...page.sections];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, dragged);
      onUpdate({ ...page, sections: next });
      onDirty();
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function updateSection(index: number, section: SectionDocument) {
    const next = [...page.sections];
    next[index] = section;
    onUpdate({ ...page, sections: next });
    onDirty();
  }

  function moveSection(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= page.sections.length) return;
    const next = [...page.sections];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate({ ...page, sections: next });
    onDirty();
  }

  function duplicateSection(index: number) {
    const section = page.sections[index];
    const newSection: SectionDocument = {
      ...JSON.parse(JSON.stringify(section)),
      id: `${section.type}-${Date.now()}`,
    };
    const next = [...page.sections];
    next.splice(index + 1, 0, newSection);
    onUpdate({ ...page, sections: next });
    onDirty();
  }

  function deleteSection(index: number) {
    onUpdate({ ...page, sections: page.sections.filter((_, i) => i !== index) });
    onDirty();
    if (openSection === page.sections[index]?.id) setOpenSection(null);
  }

  function toggleVisibility(index: number) {
    const next = [...page.sections];
    next[index] = { ...next[index], visible: !next[index].visible };
    onUpdate({ ...page, sections: next });
    onDirty();
  }

  function addSection(type: SectionType) {
    const newSection: SectionDocument = {
      id: `${type}-${Date.now()}`,
      type,
      props: getDefaultProps(type),
      style: {},
      visible: true,
    };
    if (addAtIndex !== null) {
      const sections = [...page.sections];
      sections.splice(addAtIndex, 0, newSection);
      onUpdate({ ...page, sections });
    } else {
      onUpdate({ ...page, sections: [...page.sections, newSection] });
    }
    onDirty();
    setShowAddPicker(false);
    setAddAtIndex(null);
    setOpenSection(newSection.id);
  }

  function addSectionWithPreset(type: SectionType, preset: SectionPreset) {
    const newSection: SectionDocument = {
      id: `${type}-${Date.now()}`,
      type,
      props: preset.props,
      style: (preset.style || {}) as SectionDocument["style"],
      visible: true,
    };
    if (addAtIndex !== null) {
      const sections = [...page.sections];
      sections.splice(addAtIndex, 0, newSection);
      onUpdate({ ...page, sections });
    } else {
      onUpdate({ ...page, sections: [...page.sections, newSection] });
    }
    onDirty();
    setShowAddPicker(false);
    setAddAtIndex(null);
    setOpenSection(newSection.id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-[var(--border)] px-4 py-3">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> All Pages
        </button>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
          {editingTitle ? (
            <Input
              value={page.title}
              onChange={(e) => {
                onUpdate({ ...page, title: e.target.value });
                onDirty();
              }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              autoFocus
              className="h-7 text-sm font-semibold"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 text-sm font-semibold hover:text-[var(--primary)] transition-colors"
            >
              {page.title}
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
          <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
            /{page.slug === "landing" ? "" : page.slug}
          </span>
        </div>
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {page.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="mb-2 h-8 w-8 text-[var(--muted-foreground)]/40" />
            <p className="text-sm font-medium">No sections yet</p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Add your first section below</p>
          </div>
        ) : (
          page.sections.map((section, i) => (
            <SectionItem
              key={section.id}
              section={section}
              index={i}
              total={page.sections.length}
              isOpen={openSection === section.id}
              onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
              onUpdate={(s) => updateSection(i, s)}
              onMove={(dir) => moveSection(i, dir)}
              onDuplicate={() => duplicateSection(i)}
              onDelete={() => deleteSection(i)}
              onToggleVisibility={() => toggleVisibility(i)}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragEnd={handleDrop}
              isDragOver={dragOverIndex === i && dragIndex !== i}
            />
          ))
        )}

        {/* Add section */}
        <div className="pt-1">
          {showAddPicker ? (
            <AddSectionPicker onAdd={addSection} onAddWithPreset={addSectionWithPreset} onCancel={() => setShowAddPicker(false)} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPicker(true)}
              className="w-full border-dashed text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Section
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Default Props per Section Type ──────────────────

function getDefaultProps(type: SectionType): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { heading: "Your Headline", subheading: "Supporting text goes here.", ctaText: "Learn More", ctaLink: "/about", size: "medium" },
    features: { heading: "Features", items: [{ icon: "Star", title: "Feature One", description: "Description of this feature." }] },
    cta: { heading: "Ready to get started?", description: "Join us today.", ctaText: "Get Started", ctaLink: "/contact" },
    testimonials: { heading: "What People Say", items: [{ quote: "Great experience!", author: "John Doe", role: "Member" }] },
    stats: { heading: "By the Numbers", items: [{ value: "100+", label: "Members" }] },
    "contact-form": { fields: ["name", "email", "message"] },
    "events-list": { heading: "Upcoming Events", showPast: false, limit: 10 },
    faq: { heading: "FAQ", items: [{ question: "Your question here?", answer: "Your answer here." }] },
    gallery: { heading: "Gallery", columns: 3, images: [] },

    // Content
    "rich-text": { heading: "", content: "<p>Start writing your content here. You can use <strong>bold</strong>, <em>italic</em>, <a href=\"#\">links</a>, headings, lists, and more.</p>" },
    "image-banner": { imageUrl: "", alt: "", height: "medium", overlayPosition: "center" },
    "video-embed": { heading: "", videoUrl: "" },
    "custom-html": { heading: "", html: "" },

    // Layout
    cards: { heading: "Our Programs", columns: 3, items: [{ title: "Card Title", description: "Card description goes here.", image: "", linkUrl: "", linkText: "Learn more" }] },
    pricing: {
      heading: "Membership Tiers", subheading: "Choose the plan that works for you.",
      tiers: [
        { name: "Basic", price: "$25", period: "year", description: "For individuals", features: ["Community access", "Newsletter"], ctaText: "Join", ctaLink: "/register", highlighted: false },
        { name: "Professional", price: "$75", period: "year", description: "For active members", features: ["Everything in Basic", "Event discounts", "Member directory"], ctaText: "Join", ctaLink: "/register", highlighted: true },
      ],
    },
    team: { heading: "Our Team", columns: 3, members: [{ name: "Jane Doe", role: "President", bio: "", image: "" }] },
    "logo-cloud": { heading: "Our Partners", grayscale: true, logos: [] },
    timeline: { heading: "Our History", events: [{ date: "2024", title: "Founded", description: "Our organization was established." }] },

    // Widgets
    "social-feed": { heading: "Follow Us", platform: "instagram", embedCode: "", profileUrl: "" },
    "google-reviews": { heading: "What Our Members Say", reviews: [], overallRating: "", totalReviews: "" },
    "google-map": { heading: "Find Us", address: "", embedUrl: "", height: "medium" },
    "calendar-widget": { heading: "Our Calendar", provider: "google", calendarUrl: "", embedCode: "" },
    "newsletter-signup": { heading: "Stay Updated", subheading: "Get the latest news and updates.", buttonText: "Subscribe", successMessage: "Thanks for subscribing!" },
    countdown: { heading: "Coming Soon", subheading: "", targetDate: "", expiredMessage: "This event has passed!" },
    "social-links": { heading: "Connect With Us", links: [] },

    // Utility
    spacer: { height: "4rem" },
    divider: { style: "solid", width: "medium" },
  };

  return defaults[type] || {};
}

// ─── Section Presets ─────────────────────────────────

interface SectionPreset {
  name: string;
  description: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
}

const SECTION_PRESETS: Partial<Record<SectionType, SectionPreset[]>> = {
  hero: [
    {
      name: "Bold Welcome",
      description: "Large heading with gradient background",
      props: { heading: "Welcome to Our Community", subheading: "Join thousands of members making a difference together.", ctaText: "Become a Member", ctaLink: "/register", size: "large" },
      style: { backgroundGradient: { type: "linear", angle: 135, stops: [{ color: "#4f46e5", position: 0 }, { color: "#7c3aed", position: 100 }] }, textColor: "#ffffff", padding: { top: "6rem", bottom: "6rem" } },
    },
    {
      name: "Minimal",
      description: "Clean, centered hero with subtle styling",
      props: { heading: "Empowering Our Members", subheading: "Discover the benefits of membership and how we support your growth.", ctaText: "Learn More", ctaLink: "/about", size: "medium" },
    },
  ],
  features: [
    {
      name: "Benefits Grid",
      description: "3-column member benefits",
      props: {
        heading: "Member Benefits",
        items: [
          { icon: "Award", title: "Professional Development", description: "Access exclusive workshops, certifications, and training programs." },
          { icon: "Users", title: "Networking", description: "Connect with peers and industry leaders at our regular events." },
          { icon: "Shield", title: "Advocacy", description: "We represent your interests at the local and national level." },
        ],
      },
    },
  ],
  testimonials: [
    {
      name: "Member Spotlight",
      description: "3 member testimonials",
      props: {
        heading: "What Our Members Say",
        items: [
          { quote: "Joining was the best professional decision I've made. The networking opportunities alone are worth it.", author: "Sarah Chen", role: "Member since 2022" },
          { quote: "The workshops and events have helped me grow both personally and professionally.", author: "Marcus Johnson", role: "Board Member" },
          { quote: "I love being part of a community that truly cares about making a difference.", author: "Emily Rodriguez", role: "Volunteer Coordinator" },
        ],
      },
    },
  ],
  stats: [
    {
      name: "Impact Numbers",
      description: "Organization impact statistics",
      props: {
        heading: "Our Impact",
        items: [
          { value: "500+", label: "Active Members" },
          { value: "50+", label: "Events Per Year" },
          { value: "25+", label: "Years of Service" },
          { value: "$1M+", label: "Community Investment" },
        ],
      },
      style: { backgroundColor: "#f8fafc", padding: { top: "4rem", bottom: "4rem" } },
    },
  ],
  cta: [
    {
      name: "Join CTA",
      description: "Membership signup call to action",
      props: { heading: "Ready to Make a Difference?", description: "Join our growing community of members and unlock exclusive benefits, events, and resources.", ctaText: "Join Now", ctaLink: "/register" },
      style: { backgroundGradient: { type: "linear", angle: 135, stops: [{ color: "#4f46e5", position: 0 }, { color: "#6366f1", position: 100 }] }, textColor: "#ffffff", padding: { top: "5rem", bottom: "5rem" } },
    },
  ],
  faq: [
    {
      name: "Membership FAQ",
      description: "Common membership questions",
      props: {
        heading: "Frequently Asked Questions",
        items: [
          { question: "How do I become a member?", answer: "You can sign up online through our registration page. The process takes just a few minutes." },
          { question: "What are the membership fees?", answer: "We offer several tiers to fit your needs. Visit our pricing page for current rates." },
          { question: "Can I cancel my membership?", answer: "Yes, you can cancel at any time. Contact our team and we'll process your request." },
          { question: "What events are included?", answer: "Members get access to all regular events, with discounts on premium workshops and conferences." },
        ],
      },
    },
  ],
  pricing: [
    {
      name: "3-Tier Pricing",
      description: "Three membership levels",
      props: {
        heading: "Choose Your Membership",
        subheading: "Find the right membership level for you.",
        tiers: [
          { name: "Individual", price: "$50", period: "year", description: "For individuals", features: ["Community access", "Monthly newsletter", "Event notifications"], ctaText: "Join", ctaLink: "/register", highlighted: false },
          { name: "Professional", price: "$125", period: "year", description: "Most popular", features: ["Everything in Individual", "Event discounts", "Member directory", "Professional development"], ctaText: "Join", ctaLink: "/register", highlighted: true },
          { name: "Corporate", price: "$500", period: "year", description: "For teams", features: ["Everything in Professional", "5 team members included", "Sponsor visibility", "Board meeting access"], ctaText: "Contact Us", ctaLink: "/contact", highlighted: false },
        ],
      },
    },
  ],
};

// ─── Main Page Editor ────────────────────────────────

export function PageEditor({ pages, onPagesChange, onDirty, selectedSectionId, onSectionSelect, insertAtPosition, onInsertHandled }: PageEditorProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  // Auto-navigate to the page containing the selected section
  useEffect(() => {
    if (!selectedSectionId) return;
    for (const page of pages) {
      if (page.sections.some((s) => s.id === selectedSectionId)) {
        setSelectedPage(page.slug);
        return;
      }
    }
  }, [selectedSectionId, pages]);

  // Handle insert at position from visual editor
  useEffect(() => {
    if (!insertAtPosition) return;
    setSelectedPage(insertAtPosition.pageSlug);
  }, [insertAtPosition]);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");

  const activePage = selectedPage ? pages.find((p) => p.slug === selectedPage) : null;

  function updatePage(updated: PageDocument) {
    onPagesChange(pages.map((p) => (p.slug === updated.slug ? updated : p)));
  }

  function handleCreatePage() {
    if (!newPageTitle.trim()) return;
    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (pages.some((p) => p.slug === slug)) return;
    const newPage: PageDocument = {
      slug,
      title: newPageTitle.trim(),
      sections: [
        {
          id: `hero-${Date.now()}`,
          type: "hero",
          props: { heading: newPageTitle.trim(), subheading: "Add your content here.", size: "small" },
          style: {},
          visible: true,
        },
      ],
    };
    onPagesChange([...pages, newPage]);
    onDirty();
    setNewPageTitle("");
    setShowNewPage(false);
    setSelectedPage(slug);
  }

  function handleDeletePage(slug: string) {
    onPagesChange(pages.filter((p) => p.slug !== slug));
    onDirty();
    if (selectedPage === slug) setSelectedPage(null);
  }

  // Page detail view
  if (activePage) {
    return (
      <PageDetail
        page={activePage}
        onBack={() => setSelectedPage(null)}
        onUpdate={updatePage}
        onDirty={onDirty}
        selectedSectionId={selectedSectionId}
        insertAtPosition={activePage.slug === insertAtPosition?.pageSlug ? insertAtPosition.position : undefined}
        onInsertHandled={onInsertHandled}
      />
    );
  }

  // Page list view
  return (
    <div className="px-4 py-3">
      <div className="space-y-1">
        {pages.map((page) => (
          <div
            key={page.slug}
            className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--muted-foreground)]/30"
          >
            <button
              onClick={() => setSelectedPage(page.slug)}
              className="flex flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
            >
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{page.title}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  /{page.slug === "landing" ? "" : page.slug} &middot; {page.sections.length} section{page.sections.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
            {page.slug !== "landing" && (
              <button
                onClick={() => handleDeletePage(page.slug)}
                className="mr-2 rounded p-1 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                title="Delete page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New page form */}
      <div className="mt-3">
        {showNewPage ? (
          <div className="space-y-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
            <Field label="Page Title">
              <Input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePage()}
                placeholder="e.g. About Us"
                autoFocus
                className="text-xs"
              />
            </Field>
            {newPageTitle && (
              <p className="text-[10px] text-[var(--muted-foreground)]">
                URL: /{newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreatePage} className="h-7 text-xs" disabled={!newPageTitle.trim()}>
                Create Page
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNewPage(false); setNewPageTitle(""); }} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewPage(true)}
            className="w-full border-dashed text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Page
          </Button>
        )}
      </div>
    </div>
  );
}
