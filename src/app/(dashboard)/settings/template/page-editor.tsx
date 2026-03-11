"use client";

import { useState, useCallback } from "react";
import { savePageContent, createPage, renamePage, deletePage } from "@/actions/template";
import { getTemplateById, type SectionType } from "@/lib/templates";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Save,
  ChevronDown,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Type,
  BarChart3,
  MessageSquareQuote,
  HelpCircle,
  Calendar,
  Users,
  Mail,
  Megaphone,
  CheckCircle,
  GripVertical,
  Pencil,
  FilePlus,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Paintbrush,
  PanelTop,
} from "lucide-react";
import type { SectionStyle } from "@/lib/types/site-document";
import { AVAILABLE_FONTS } from "@/lib/types/site-document";

interface PageEditorProps {
  templateId: string;
  currentOverrides: Record<string, Record<string, Record<string, unknown>>>;
  siteSubdomain?: string;
  customDomain?: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <ImageIcon className="h-4 w-4" />,
  features: <Type className="h-4 w-4" />,
  cta: <Megaphone className="h-4 w-4" />,
  testimonials: <MessageSquareQuote className="h-4 w-4" />,
  stats: <BarChart3 className="h-4 w-4" />,
  "contact-form": <Mail className="h-4 w-4" />,
  "events-list": <Calendar className="h-4 w-4" />,
  "directory-grid": <Users className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  gallery: <ImageIcon className="h-4 w-4" />,
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  features: "Features",
  cta: "Call to Action",
  testimonials: "Testimonials",
  stats: "Statistics",
  "contact-form": "Contact Form",
  "events-list": "Events List",
  "directory-grid": "Member Directory",
  faq: "FAQ",
  gallery: "Gallery",
};

const AVAILABLE_SECTIONS: { type: SectionType; label: string }[] = [
  { type: "hero", label: "Hero Banner" },
  { type: "features", label: "Features" },
  { type: "cta", label: "Call to Action" },
  { type: "testimonials", label: "Testimonials" },
  { type: "stats", label: "Statistics" },
  { type: "faq", label: "FAQ" },
  { type: "gallery", label: "Gallery" },
  { type: "contact-form", label: "Contact Form" },
  { type: "events-list", label: "Events List" },
  { type: "directory-grid", label: "Member Directory" },
];

const DEFAULT_SECTION_PROPS: Record<SectionType, Record<string, unknown>> = {
  hero: { heading: "New Section", subheading: "Add your content here.", size: "small" },
  features: { heading: "Features", items: [{ icon: "Star", title: "Feature", description: "Description" }] },
  cta: { heading: "Take Action", description: "Your call to action.", ctaText: "Get Started", ctaLink: "/" },
  testimonials: { heading: "Testimonials", items: [{ quote: "Quote here", author: "Author", role: "Role" }] },
  stats: { heading: "By the Numbers", items: [{ value: "100+", label: "Members" }] },
  faq: { heading: "FAQ", items: [{ question: "Question?", answer: "Answer." }] },
  gallery: { heading: "Gallery", images: [] },
  "contact-form": { fields: ["name", "email", "message"] },
  "events-list": { heading: "Events", showPast: false, limit: 10 },
  "directory-grid": { showSearch: true, columns: 3 },
};

function generateSectionId(type: string, existing: string[]): string {
  let id = type;
  let counter = 2;
  while (existing.includes(id)) {
    id = `${type}-${counter}`;
    counter++;
  }
  return id;
}

// ─── Sortable Section Item ──────────────────────────────

function SortableSectionItem({
  section,
  pageSlug,
  isExpanded,
  onToggleExpand,
  onRemove,
  children,
}: {
  section: { id: string; type: SectionType };
  pageSlug: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-lg border border-[var(--border)]"
    >
      <div className="flex items-center bg-[var(--muted)]/50">
        <button
          type="button"
          className="cursor-grab touch-none rounded px-1.5 py-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
        >
          {SECTION_ICONS[section.type] || <Type className="h-4 w-4" />}
          <span className="flex-1 text-sm font-medium">
            {SECTION_LABELS[section.type] || section.type}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="mr-3 rounded p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500"
          title="Remove section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {isExpanded && children}
    </div>
  );
}

export function PageEditor({ templateId, currentOverrides, siteSubdomain, customDomain }: PageEditorProps) {
  const template = getTemplateById(templateId);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [overrides, setOverrides] = useState(currentOverrides);
  const [addingSectionTo, setAddingSectionTo] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] = useState<SectionType>("hero");
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [sectionStyles, setSectionStyles] = useState<Record<string, Record<string, SectionStyle>>>({});
  const [activeTab, setActiveTab] = useState<Record<string, "content" | "style">>({});
  // Page CRUD state
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [renamingPage, setRenamingPage] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameSlug, setRenameSlug] = useState("");
  const [customPages, setCustomPages] = useState<{ slug: string; title: string }[]>([]);

  async function handleCreatePage() {
    if (!newPageTitle.trim()) return;
    const slug = newPageSlug.trim() || newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSaving(true);
    try {
      await createPage(newPageTitle.trim(), slug);
      setCustomPages((prev) => [...prev, { slug, title: newPageTitle.trim() }]);
      setNewPageTitle("");
      setNewPageSlug("");
      setShowNewPageForm(false);
    } catch (err) {
      console.error("Failed to create page:", err);
    }
    setSaving(false);
  }

  async function handleRenamePage(oldSlug: string) {
    if (!renameTitle.trim()) return;
    const slug = renameSlug.trim() || oldSlug;
    setSaving(true);
    try {
      await renamePage(oldSlug, renameTitle.trim(), slug);
      setCustomPages((prev) =>
        prev.map((p) => (p.slug === oldSlug ? { slug, title: renameTitle.trim() } : p))
      );
      setRenamingPage(null);
    } catch (err) {
      console.error("Failed to rename page:", err);
    }
    setSaving(false);
  }

  async function handleDeletePage(slug: string) {
    if (!confirm(`Delete the page "${slug}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deletePage(slug);
      setCustomPages((prev) => prev.filter((p) => p.slug !== slug));
      if (activePage === slug) setActivePage(null);
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
    setSaving(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (pageSlug: string) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const sections = getPageSections(pageSlug);
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(sections, oldIndex, newIndex);
      setPageLayout(pageSlug, reordered);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides]
  );

  function getSectionStyle(pageSlug: string, sectionId: string): SectionStyle {
    return sectionStyles[pageSlug]?.[sectionId] || {};
  }

  function updateSectionStyle(pageSlug: string, sectionId: string, style: Partial<SectionStyle>) {
    setSaved(false);
    setSectionStyles((prev) => ({
      ...prev,
      [pageSlug]: {
        ...(prev[pageSlug] || {}),
        [sectionId]: { ...(prev[pageSlug]?.[sectionId] || {}), ...style },
      },
    }));
  }

  function getSiteUrl(pageSlug: string): string | null {
    if (!siteSubdomain && !customDomain) return null;
    const host = customDomain || `${siteSubdomain}.${typeof window !== "undefined" ? window.location.hostname.split(".").slice(-2).join(".") : "localhost:3000"}`;
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
    const path = pageSlug === "landing" ? "/" : `/${pageSlug}`;
    return `${protocol}//${host}${path}`;
  }

  // Build the effective section list for a page, respecting __layout__ overrides
  function getPageSections(pageSlug: string): { id: string; type: SectionType }[] {
    const layout = overrides[pageSlug]?.__layout__ as unknown as { id: string; type: SectionType }[] | undefined;
    if (layout) return layout;
    const page = template.pages.find((p) => p.slug === pageSlug);
    return page?.sections.map((s) => ({ id: s.id, type: s.type })) || [];
  }

  function setPageLayout(pageSlug: string, layout: { id: string; type: SectionType }[]) {
    setSaved(false);
    setOverrides((prev) => ({
      ...prev,
      [pageSlug]: {
        ...(prev[pageSlug] || {}),
        __layout__: layout as unknown as Record<string, unknown>,
      },
    }));
  }

  function addSection(pageSlug: string, type: SectionType) {
    const sections = getPageSections(pageSlug);
    const existingIds = sections.map((s) => s.id);
    const newId = generateSectionId(type, existingIds);
    const newLayout = [...sections, { id: newId, type }];
    setPageLayout(pageSlug, newLayout);
    // Set default props for the new section
    updateField(pageSlug, newId, "__defaults__", "true");
    const defaults = DEFAULT_SECTION_PROPS[type];
    if (defaults) {
      setOverrides((prev) => ({
        ...prev,
        [pageSlug]: {
          ...(prev[pageSlug] || {}),
          __layout__: newLayout as unknown as Record<string, unknown>,
          [newId]: defaults,
        },
      }));
    }
    setAddingSectionTo(null);
  }

  function removeSection(pageSlug: string, sectionId: string) {
    const sections = getPageSections(pageSlug);
    const newLayout = sections.filter((s) => s.id !== sectionId);
    setPageLayout(pageSlug, newLayout);
    // Clean up overrides for removed section
    setOverrides((prev) => {
      const pageData = { ...(prev[pageSlug] || {}) };
      delete pageData[sectionId];
      pageData.__layout__ = newLayout as unknown as Record<string, unknown>;
      return { ...prev, [pageSlug]: pageData };
    });
  }


  function getMergedProps(pageSlug: string, sectionId: string, sectionType: SectionType): Record<string, unknown> {
    // Get template defaults if the section exists in the template
    const page = template.pages.find((p) => p.slug === pageSlug);
    const templateSection = page?.sections.find((s) => s.id === sectionId);
    const baseProps = templateSection?.props || DEFAULT_SECTION_PROPS[sectionType] || {};
    const sectionOverrides = (overrides[pageSlug]?.[sectionId] || {}) as Record<string, unknown>;
    return { ...baseProps, ...sectionOverrides };
  }

  function updateField(pageSlug: string, sectionId: string, field: string, value: unknown) {
    setSaved(false);
    setOverrides((prev) => ({
      ...prev,
      [pageSlug]: {
        ...(prev[pageSlug] || {}),
        [sectionId]: {
          ...((prev[pageSlug]?.[sectionId] || {}) as Record<string, unknown>),
          [field]: value,
        },
      },
    }));
  }

  async function handleSavePage(pageSlug: string) {
    setSaving(true);
    const pageOverrides = { ...(overrides[pageSlug] || {}) } as Record<string, Record<string, unknown>>;
    // Merge section styles into overrides under __style__ key per section
    const pageStyles = sectionStyles[pageSlug] || {};
    for (const [sectionId, style] of Object.entries(pageStyles)) {
      if (Object.keys(style).length > 0) {
        pageOverrides[sectionId] = {
          ...((pageOverrides[sectionId] || {}) as Record<string, unknown>),
          __style__: style,
        };
      }
    }
    await savePageContent(pageSlug, pageOverrides);
    setSaving(false);
    setSaved(true);
    setPreviewKey((k) => k + 1);
    setTimeout(() => setSaved(false), 2000);
  }

  const previewUrl = activePage ? getSiteUrl(activePage) : null;

  return (
    <div>
      {/* Preview toggle bar */}
      {activePage && previewUrl && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          {showPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewKey((k) => k + 1)}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          )}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--muted)]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
          </a>
        </div>
      )}

      <div className={showPreview && previewUrl ? "grid grid-cols-2 gap-6" : ""}>
        {/* Editor panel */}
        <div className="space-y-3">
          {template.pages.map((page) => {
            const isActive = activePage === page.slug;
            return (
              <Card key={page.slug}>
                <button
                  type="button"
                  onClick={() => setActivePage(isActive ? null : page.slug)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="font-medium">{page.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        /{page.slug === "landing" ? "" : page.slug} &middot; {getPageSections(page.slug).length} sections
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${
                      isActive ? "rotate-180" : ""
                    }`}
                  />
                </button>

            {isActive && (
              <CardContent className="space-y-3 border-t border-[var(--border)] pt-4">
                {(() => {
                  const sections = getPageSections(page.slug);
                  return (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(page.slug)}
                    >
                      <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {sections.map((section) => {
                            const sectionKey = `${page.slug}:${section.id}`;
                            const isExpanded = expandedSection === sectionKey;
                            const mergedProps = getMergedProps(page.slug, section.id, section.type);

                            return (
                              <SortableSectionItem
                                key={section.id}
                                section={section}
                                pageSlug={page.slug}
                                isExpanded={isExpanded}
                                onToggleExpand={() => setExpandedSection(isExpanded ? null : sectionKey)}
                                onRemove={() => removeSection(page.slug, section.id)}
                              >
                                <div className="p-4">
                                  {/* Content / Style tabs */}
                                  <div className="mb-4 flex gap-1 rounded-md bg-[var(--muted)] p-1">
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab((prev) => ({ ...prev, [sectionKey]: "content" }))}
                                      className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                                        (activeTab[sectionKey] || "content") === "content"
                                          ? "bg-white text-[var(--foreground)] shadow-sm"
                                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                      }`}
                                    >
                                      <PanelTop className="mr-1.5 inline h-3 w-3" />
                                      Content
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab((prev) => ({ ...prev, [sectionKey]: "style" }))}
                                      className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                                        activeTab[sectionKey] === "style"
                                          ? "bg-white text-[var(--foreground)] shadow-sm"
                                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                      }`}
                                    >
                                      <Paintbrush className="mr-1.5 inline h-3 w-3" />
                                      Style
                                    </button>
                                  </div>

                                  {(activeTab[sectionKey] || "content") === "content" ? (
                                    <div className="space-y-4">
                                      <SectionFields
                                        sectionType={section.type}
                                        props={mergedProps}
                                        onChange={(field, value) =>
                                          updateField(page.slug, section.id, field, value)
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <SectionStyleEditor
                                      style={getSectionStyle(page.slug, section.id)}
                                      onChange={(style) => updateSectionStyle(page.slug, section.id, style)}
                                    />
                                  )}
                                </div>
                              </SortableSectionItem>
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  );
                })()}

                {/* Add Section */}
                {addingSectionTo === page.slug ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-3">
                    <Select
                      value={newSectionType}
                      onChange={(e) => setNewSectionType(e.target.value as SectionType)}
                      className="flex-1 text-sm"
                    >
                      {AVAILABLE_SECTIONS.map((s) => (
                        <option key={s.type} value={s.type}>{s.label}</option>
                      ))}
                    </Select>
                    <Button size="sm" onClick={() => addSection(page.slug, newSectionType)}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAddingSectionTo(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingSectionTo(page.slug); setNewSectionType("hero"); }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-3 text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <Plus className="h-4 w-4" /> Add Section
                  </button>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={() => handleSavePage(page.slug)} disabled={saving}>
                    {saving ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : saved ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saved ? "Saved!" : `Save ${page.title} Page`}
                  </Button>
                  {saved && (
                    <span className="text-sm text-green-600">Changes published</span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
          })}

          {/* Custom pages */}
          {customPages.map((cp) => (
            <Card key={cp.slug}>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    {renamingPage === cp.slug ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          placeholder="Page title"
                          className="h-7 w-32 text-xs"
                        />
                        <Input
                          value={renameSlug}
                          onChange={(e) => setRenameSlug(e.target.value)}
                          placeholder="slug"
                          className="h-7 w-24 text-xs"
                        />
                        <Button size="sm" onClick={() => handleRenamePage(cp.slug)} disabled={saving}>
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRenamingPage(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{cp.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">/{cp.slug}</p>
                      </>
                    )}
                  </div>
                </div>
                {renamingPage !== cp.slug && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setRenamingPage(cp.slug); setRenameTitle(cp.title); setRenameSlug(cp.slug); }}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Rename page"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(cp.slug)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:text-red-500"
                      title="Delete page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Create new page */}
          {showNewPageForm ? (
            <Card>
              <div className="flex items-center gap-2 px-5 py-4">
                <Input
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      // auto-generate slug as they type
                    }
                  }}
                  placeholder="Page title (e.g. Programs)"
                  className="text-sm"
                />
                <Input
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="slug (auto)"
                  className="w-36 text-sm"
                />
                <Button size="sm" onClick={handleCreatePage} disabled={saving || !newPageTitle.trim()}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Create
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowNewPageForm(false); setNewPageTitle(""); setNewPageSlug(""); }}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewPageForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] py-4 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <FilePlus className="h-4 w-4" /> Create New Page
            </button>
          )}
        </div>

        {/* Preview panel */}
        {showPreview && previewUrl && (
          <div className="sticky top-4 h-[calc(100vh-8rem)]">
            <div className="h-full overflow-hidden rounded-lg border border-[var(--border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Preview</span>
                <span className="truncate text-xs text-[var(--muted-foreground)]">{previewUrl}</span>
              </div>
              <iframe
                key={previewKey}
                src={previewUrl}
                className="h-[calc(100%-2.5rem)] w-full"
                title="Page preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Field Editors ─────────────────────────────

function SectionFields({
  sectionType,
  props,
  onChange,
}: {
  sectionType: string;
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  switch (sectionType) {
    case "hero":
      return <HeroFields props={props} onChange={onChange} />;
    case "features":
      return <FeaturesFields props={props} onChange={onChange} />;
    case "cta":
      return <CtaFields props={props} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsFields props={props} onChange={onChange} />;
    case "stats":
      return <StatsFields props={props} onChange={onChange} />;
    case "faq":
      return <FaqFields props={props} onChange={onChange} />;
    case "gallery":
      return <GalleryFields props={props} onChange={onChange} />;
    case "events-list":
      return <EventsFields props={props} onChange={onChange} />;
    case "contact-form":
      return (
        <p className="text-sm text-[var(--muted-foreground)]">
          Contact form is auto-generated from template settings.
        </p>
      );
    case "directory-grid":
      return (
        <p className="text-sm text-[var(--muted-foreground)]">
          Directory pulls from your member database automatically.
        </p>
      );
    default:
      return null;
  }
}

// ─── Hero ──────────────────────────────────────────────

function HeroFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <Field label="Subheading" value={String(props.subheading || "")} onChange={(v) => onChange("subheading", v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={String(props.ctaText || "")} onChange={(v) => onChange("ctaText", v)} />
        <Field label="Button Link" value={String(props.ctaLink || "")} onChange={(v) => onChange("ctaLink", v)} />
      </div>
      <Field label="Background Image URL" value={String(props.backgroundImage || "")} onChange={(v) => onChange("backgroundImage", v)} placeholder="https://... or /images/hero.jpg" />
    </div>
  );
}

// ─── Features ──────────────────────────────────────────

function FeaturesFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  const items = (props.items || []) as { icon: string; title: string; description: string }[];

  function updateItem(index: number, field: string, value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange("items", updated);
  }

  function addItem() {
    onChange("items", [...items, { icon: "Star", title: "New Feature", description: "Description here" }]);
  }

  function removeItem(index: number) {
    onChange("items", items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <div className="space-y-2">
        <Label className="text-xs">Feature Items</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-md border border-[var(--border)] p-3">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Icon (e.g. Users)" value={item.icon} onChange={(e) => updateItem(i, "icon", e.target.value)} className="text-xs" />
                <Input placeholder="Title" value={item.title} onChange={(e) => updateItem(i, "title", e.target.value)} className="text-xs" />
              </div>
              <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="text-xs" />
            </div>
            <button type="button" onClick={() => removeItem(i)} className="self-start rounded p-1 text-[var(--muted-foreground)] hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add Feature
        </Button>
      </div>
    </div>
  );
}

// ─── CTA ───────────────────────────────────────────────

function CtaFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <Field label="Description" value={String(props.description || "")} onChange={(v) => onChange("description", v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={String(props.ctaText || "")} onChange={(v) => onChange("ctaText", v)} />
        <Field label="Button Link" value={String(props.ctaLink || "")} onChange={(v) => onChange("ctaLink", v)} />
      </div>
    </div>
  );
}

// ─── Testimonials ──────────────────────────────────────

function TestimonialsFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  const items = (props.items || []) as { quote: string; author: string; role?: string }[];

  function updateItem(index: number, field: string, value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange("items", updated);
  }

  function addItem() {
    onChange("items", [...items, { quote: "Quote here", author: "Author Name", role: "Role" }]);
  }

  function removeItem(index: number) {
    onChange("items", items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <div className="space-y-2">
        <Label className="text-xs">Testimonials</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-md border border-[var(--border)] p-3">
            <div className="flex-1 space-y-2">
              <Textarea placeholder="Quote" value={item.quote} onChange={(e) => updateItem(i, "quote", e.target.value)} rows={2} className="text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Author" value={item.author} onChange={(e) => updateItem(i, "author", e.target.value)} className="text-xs" />
                <Input placeholder="Role (optional)" value={item.role || ""} onChange={(e) => updateItem(i, "role", e.target.value)} className="text-xs" />
              </div>
            </div>
            <button type="button" onClick={() => removeItem(i)} className="self-start rounded p-1 text-[var(--muted-foreground)] hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add Testimonial
        </Button>
      </div>
    </div>
  );
}

// ─── Stats ─────────────────────────────────────────────

function StatsFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  const items = (props.items || []) as { value: string; label: string }[];

  function updateItem(index: number, field: string, value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange("items", updated);
  }

  function addItem() {
    onChange("items", [...items, { value: "0", label: "New Stat" }]);
  }

  function removeItem(index: number) {
    onChange("items", items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <div className="space-y-2">
        <Label className="text-xs">Statistics</Label>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Value (e.g. 500+)" value={item.value} onChange={(e) => updateItem(i, "value", e.target.value)} className="w-32 text-xs" />
            <Input placeholder="Label" value={item.label} onChange={(e) => updateItem(i, "label", e.target.value)} className="flex-1 text-xs" />
            <button type="button" onClick={() => removeItem(i)} className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add Stat
        </Button>
      </div>
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────

function FaqFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  const items = (props.items || []) as { question: string; answer: string }[];

  function updateItem(index: number, field: string, value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange("items", updated);
  }

  function addItem() {
    onChange("items", [...items, { question: "New question?", answer: "Answer here." }]);
  }

  function removeItem(index: number) {
    onChange("items", items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <div className="space-y-2">
        <Label className="text-xs">Questions & Answers</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-md border border-[var(--border)] p-3">
            <div className="flex-1 space-y-2">
              <Input placeholder="Question" value={item.question} onChange={(e) => updateItem(i, "question", e.target.value)} className="text-xs" />
              <Textarea placeholder="Answer" value={item.answer} onChange={(e) => updateItem(i, "answer", e.target.value)} rows={2} className="text-xs" />
            </div>
            <button type="button" onClick={() => removeItem(i)} className="self-start rounded p-1 text-[var(--muted-foreground)] hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add FAQ Item
        </Button>
      </div>
    </div>
  );
}

// ─── Gallery ───────────────────────────────────────────

function GalleryFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  const images = (props.images || []) as string[];

  function updateImage(index: number, value: string) {
    const updated = images.map((img, i) => (i === index ? value : img));
    onChange("images", updated);
  }

  function addImage() {
    onChange("images", [...images, ""]);
  }

  function removeImage(index: number) {
    onChange("images", images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <div className="space-y-2">
        <Label className="text-xs">Image URLs</Label>
        {images.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="https://... image URL" value={img} onChange={(e) => updateImage(i, e.target.value)} className="flex-1 text-xs" />
            <button type="button" onClick={() => removeImage(i)} className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addImage}>
          <Plus className="h-3.5 w-3.5" /> Add Image
        </Button>
      </div>
    </div>
  );
}

// ─── Events ────────────────────────────────────────────

function EventsFields({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading" value={String(props.heading || "")} onChange={(v) => onChange("heading", v)} />
      <p className="text-xs text-[var(--muted-foreground)]">
        Events are pulled from your database. The heading above is editable.
      </p>
    </div>
  );
}

// ─── Section Style Editor ─────────────────────────────

function SectionStyleEditor({
  style,
  onChange,
}: {
  style: SectionStyle;
  onChange: (style: Partial<SectionStyle>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Background Color</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={style.backgroundColor || "#ffffff"}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-[var(--border)]"
            />
            <Input
              value={style.backgroundColor || ""}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
              className="flex-1 text-xs"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Text Color</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={style.textColor || "#000000"}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-[var(--border)]"
            />
            <Input
              value={style.textColor || ""}
              onChange={(e) => onChange({ textColor: e.target.value })}
              placeholder="#000000"
              className="flex-1 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Padding Top</Label>
          <Select
            value={style.padding?.top || ""}
            onChange={(e) => onChange({ padding: { top: e.target.value, bottom: style.padding?.bottom || "3rem" } })}
            className="mt-1 text-xs"
          >
            <option value="">Default</option>
            <option value="1rem">Small (1rem)</option>
            <option value="2rem">Medium (2rem)</option>
            <option value="3rem">Large (3rem)</option>
            <option value="4rem">XL (4rem)</option>
            <option value="6rem">2XL (6rem)</option>
            <option value="8rem">3XL (8rem)</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Padding Bottom</Label>
          <Select
            value={style.padding?.bottom || ""}
            onChange={(e) => onChange({ padding: { top: style.padding?.top || "3rem", bottom: e.target.value } })}
            className="mt-1 text-xs"
          >
            <option value="">Default</option>
            <option value="1rem">Small (1rem)</option>
            <option value="2rem">Medium (2rem)</option>
            <option value="3rem">Large (3rem)</option>
            <option value="4rem">XL (4rem)</option>
            <option value="6rem">2XL (6rem)</option>
            <option value="8rem">3XL (8rem)</option>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Max Width</Label>
        <Select
          value={style.maxWidth || ""}
          onChange={(e) => onChange({ maxWidth: (e.target.value || undefined) as SectionStyle["maxWidth"] })}
          className="mt-1 text-xs"
        >
          <option value="">Default</option>
          <option value="sm">Small (48rem)</option>
          <option value="md">Medium (64rem)</option>
          <option value="lg">Large (80rem)</option>
          <option value="xl">Extra Large (90rem)</option>
          <option value="full">Full Width</option>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Background Image URL</Label>
        <Input
          value={style.backgroundImage || ""}
          onChange={(e) => onChange({ backgroundImage: e.target.value || undefined })}
          placeholder="https://... or /images/bg.jpg"
          className="mt-1 text-xs"
        />
      </div>

      {style.backgroundImage && (
        <div>
          <Label className="text-xs">Background Overlay</Label>
          <Input
            value={style.backgroundOverlay || ""}
            onChange={(e) => onChange({ backgroundOverlay: e.target.value || undefined })}
            placeholder="rgba(0,0,0,0.5)"
            className="mt-1 text-xs"
          />
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Semi-transparent overlay over the background image (e.g. rgba(0,0,0,0.5))
          </p>
        </div>
      )}

      <div>
        <Label className="text-xs">Border Radius</Label>
        <Select
          value={style.borderRadius || ""}
          onChange={(e) => onChange({ borderRadius: e.target.value || undefined })}
          className="mt-1 text-xs"
        >
          <option value="">None</option>
          <option value="0.5rem">Small</option>
          <option value="1rem">Medium</option>
          <option value="1.5rem">Large</option>
          <option value="2rem">XL</option>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Font Override</Label>
        <Select
          value={style.fontFamily || ""}
          onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
          className="mt-1 text-xs"
        >
          <option value="">Use global font</option>
          {AVAILABLE_FONTS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label className="text-xs">Custom CSS Class</Label>
        <Input
          value={style.customClassName || ""}
          onChange={(e) => onChange({ customClassName: e.target.value || undefined })}
          placeholder="my-custom-class"
          className="mt-1 text-xs"
        />
        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
          Add a custom Tailwind or CSS class for advanced styling
        </p>
      </div>
    </div>
  );
}

// ─── Generic Field ─────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="mt-1" placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" placeholder={placeholder} />
      )}
    </div>
  );
}
