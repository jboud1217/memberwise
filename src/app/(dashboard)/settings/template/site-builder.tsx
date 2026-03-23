"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { saveSiteGlobals, saveSiteDocument } from "@/actions/template";
import { updateTheme } from "@/actions/onboarding";
import { THEMES, isDarkTheme } from "@/lib/themes";
import { TEMPLATES } from "@/lib/templates";
import { selectTemplate } from "@/actions/template";
import { PageEditor } from "./page-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  SiteDocument,
  SiteHeader,
  SiteFooter,
  SiteFonts,
  NavLink,
  SocialLink,
  PageDocument,
} from "@/lib/types/site-document";
import { AVAILABLE_FONTS } from "@/lib/types/site-document";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Save,
  CheckCircle,
  Plus,
  X,
  Menu,
  PanelBottom,
  Type,
  Palette,
  Code,
  Layout,
  Eye,
  AlertCircle,
  Globe,
  Undo2,
  Image as ImageIcon,
  FileText,
  MousePointer2,
  Maximize2,
  GripVertical,
  ArrowLeft,
  Copy,
  Trash2,
  Sparkles,
} from "lucide-react";
import { SnapshotControls } from "./snapshot-controls";
import { MediaLibrary } from "./media-library";
import { AssetProvider } from "./asset-context";
import { AIVisualAssistant } from "./ai-visual-assistant";
import { SECTION_TYPE_INFO, SECTION_CATEGORIES } from "./section-editors";
import type { AIEditOperation } from "@/actions/ai";
import type { SectionType } from "@/lib/types/site-document";
import Image from "next/image";
import { Search } from "lucide-react";

// ─── Types ──────────────────────────────────────────

interface SiteBuilderProps {
  siteDoc: SiteDocument | null;
  siteUrl: string | null;
  currentTemplate: string;
  currentTheme: string;
  siteName: string;
  lastUpdated?: string | null;
}

const VIEWPORTS = [
  { name: "Desktop", icon: Monitor, width: "100%" },
  { name: "Tablet", icon: Tablet, width: "768px" },
  { name: "Mobile", icon: Smartphone, width: "375px" },
] as const;

const THEME_VARS: { key: string; label: string }[] = [
  { key: "--primary", label: "Primary" },
  { key: "--primary-foreground", label: "Primary Text" },
  { key: "--background", label: "Background" },
  { key: "--foreground", label: "Text" },
  { key: "--muted", label: "Muted BG" },
  { key: "--muted-foreground", label: "Muted Text" },
  { key: "--accent", label: "Accent" },
  { key: "--border", label: "Borders" },
  { key: "--card", label: "Card BG" },
  { key: "--card-foreground", label: "Card Text" },
];

type PanelId = "pages" | "template" | "theme" | "header" | "footer" | "typography" | "colors" | "css" | "media" | "snapshots";

// ─── Accordion Panel ────────────────────────────────

function AccordionPanel({
  id,
  icon: Icon,
  title,
  activePanel,
  onToggle,
  children,
  badge,
}: {
  id: PanelId;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  activePanel: PanelId | null;
  onToggle: (id: PanelId) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const isOpen = activePanel === id;
  return (
    <div className="border-b border-[var(--border)]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--accent)]/50"
      >
        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
        <span className="flex-1 text-sm font-medium">{title}</span>
        {badge}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────

export function SiteBuilder({
  siteDoc,
  siteUrl,
  currentTemplate,
  currentTheme,
  siteName,
  lastUpdated,
}: SiteBuilderProps) {
  // ─── Draft state ──────────────────────────
  const [header, setHeader] = useState<SiteHeader>(
    siteDoc?.global.header || { layout: "left-aligned", showLogo: true, navLinks: [], style: {} }
  );
  const [footer, setFooter] = useState<SiteFooter>(
    siteDoc?.global.footer || { layout: "simple", style: {} }
  );
  const [fonts, setFonts] = useState<SiteFonts>(
    siteDoc?.global.fonts || { heading: "Inter", body: "Inter" }
  );
  const [themeVars, setThemeVars] = useState<Record<string, string>>(
    siteDoc?.global.theme?.variables || {}
  );
  const [customCss, setCustomCss] = useState(siteDoc?.global.customCss || "");
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [pages, setPages] = useState<PageDocument[]>(siteDoc?.pages || []);

  // ─── UI state ─────────────────────────────
  const [activePanel, setActivePanel] = useState<PanelId | null>("pages");
  const [viewport, setViewport] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [visualEditMode, setVisualEditMode] = useState(false);
  const [insertAtPosition, setInsertAtPosition] = useState<{ pageSlug: string; position: number } | null>(null);
  const [visualInsertPosition, setVisualInsertPosition] = useState<number | null>(null);
  const [aiFocusSectionId, setAiFocusSectionId] = useState<string | null>(null);
  const [pagesBeforeAI, setPagesBeforeAI] = useState<PageDocument[] | null>(null);
  const [imageEditTarget, setImageEditTarget] = useState<{ sectionId: string; propPath: string } | null>(null);
  const [iframeZoom, setIframeZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ─── Undo/Redo history ──────────────────
  const undoStackRef = useRef<PageDocument[][]>([]);
  const redoStackRef = useRef<PageDocument[][]>([]);
  const lastPagesRef = useRef<string>("");

  function pushUndo() {
    const snapshot = JSON.stringify(pages);
    if (snapshot === lastPagesRef.current) return; // No change
    undoStackRef.current.push(JSON.parse(lastPagesRef.current || snapshot));
    redoStackRef.current = []; // Clear redo on new change
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    lastPagesRef.current = snapshot;
  }

  // Mark dirty on any change
  function markDirty() {
    pushUndo();
    setDirty(true);
    setPublished(false);
  }

  // ─── postMessage to iframe ────────────────
  const sendPreviewUpdate = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !previewReady) return;
    const theme = THEMES.find((t) => t.id === selectedTheme);
    const mergedVars = { ...(theme?.variables || {}), ...themeVars };
    iframeRef.current.contentWindow.postMessage(
      {
        type: "MEMBERWISE_PREVIEW_UPDATE",
        payload: {
          themeVariables: mergedVars,
          fonts,
          customCss,
          header,
          footer,
          pages,
        },
      },
      "*"
    );
  }, [selectedTheme, themeVars, fonts, customCss, header, footer, pages, previewReady]);

  // Debounced preview updates
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(sendPreviewUpdate, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sendPreviewUpdate]);

  // Initialize undo snapshot
  useEffect(() => {
    if (pages.length > 0 && !lastPagesRef.current) {
      lastPagesRef.current = JSON.stringify(pages);
    }
  }, [pages]);

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (!visualEditMode) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return;

      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+Z — Undo
      if (metaOrCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undoStackRef.current.length > 0) {
          const current = JSON.parse(JSON.stringify(pages));
          redoStackRef.current.push(current);
          const prev = undoStackRef.current.pop()!;
          lastPagesRef.current = JSON.stringify(prev);
          setPages(prev);
          setDirty(true);
          setPublished(false);
        }
        return;
      }

      // Cmd+Shift+Z or Cmd+Y — Redo
      if (metaOrCtrl && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        if (redoStackRef.current.length > 0) {
          const current = JSON.parse(JSON.stringify(pages));
          undoStackRef.current.push(current);
          const next = redoStackRef.current.pop()!;
          lastPagesRef.current = JSON.stringify(next);
          setPages(next);
          setDirty(true);
          setPublished(false);
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [visualEditMode, pages]);

  // Send visual mode state to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !previewReady) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "MEMBERWISE_VISUAL_MODE", enabled: visualEditMode },
      "*"
    );
  }, [visualEditMode, previewReady]);

  // ─── Visual edit mode helpers ───────────────
  function getCurrentPageSlug(): string {
    // Try to determine which page the iframe is showing
    try {
      const iframeUrl = iframeRef.current?.contentWindow?.location.pathname;
      if (iframeUrl === "/") return "landing";
      return iframeUrl?.replace(/^\//, "") || "landing";
    } catch {
      return pages[0]?.slug || "landing";
    }
  }

  function handleVisualSectionMove(sectionId: string, direction: "up" | "down") {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        const sections = [...page.sections];
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx === -1) return page;
        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sections.length) return page;
        [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
        return { ...page, sections };
      })
    );
    markDirty();
  }

  function handleVisualSectionDuplicate(sectionId: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        const sections = [...page.sections];
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx === -1) return page;
        const clone = {
          ...JSON.parse(JSON.stringify(sections[idx])),
          id: `${sections[idx].type}-${Date.now()}`,
        };
        sections.splice(idx + 1, 0, clone);
        return { ...page, sections };
      })
    );
    markDirty();
  }

  function handleVisualSectionDelete(sectionId: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return { ...page, sections: page.sections.filter((s) => s.id !== sectionId) };
      })
    );
    markDirty();
  }

  function handleVisualSectionReorder(sectionId: string, newIndex: number) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        const sections = [...page.sections];
        const oldIdx = sections.findIndex((s) => s.id === sectionId);
        if (oldIdx === -1) return page;
        const [moved] = sections.splice(oldIdx, 1);
        const adjustedIndex = newIndex > oldIdx ? newIndex - 1 : newIndex;
        sections.splice(adjustedIndex, 0, moved);
        return { ...page, sections };
      })
    );
    markDirty();
  }

  function handleVisualInlineEdit(sectionId: string, propPath: string, value: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            // Support nested paths like "items.0.icon" or "items.2.title"
            const parts = propPath.split(".");
            if (parts.length === 1) {
              return { ...s, props: { ...s.props, [propPath]: value } };
            }
            // Deep update for nested paths
            const newProps = JSON.parse(JSON.stringify(s.props));
            let target: Record<string, unknown> = newProps;
            for (let i = 0; i < parts.length - 1; i++) {
              const key = parts[i];
              const idx = Number(key);
              target = (Number.isNaN(idx) ? target[key] : (target as unknown as unknown[])[idx]) as Record<string, unknown>;
              if (!target) return s;
            }
            target[parts[parts.length - 1]] = value;
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Array item manipulation ──────────────────
  function handleArrayDelete(sectionId: string, arrayName: string, itemIndex: number) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const newProps = JSON.parse(JSON.stringify(s.props));
            const arr = newProps[arrayName];
            if (!Array.isArray(arr) || itemIndex < 0 || itemIndex >= arr.length) return s;
            if (arr.length <= 1) return s; // Don't delete the last item
            arr.splice(itemIndex, 1);
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  function handleArrayDuplicate(sectionId: string, arrayName: string, itemIndex: number) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const newProps = JSON.parse(JSON.stringify(s.props));
            const arr = newProps[arrayName];
            if (!Array.isArray(arr) || itemIndex < 0 || itemIndex >= arr.length) return s;
            const clone = JSON.parse(JSON.stringify(arr[itemIndex]));
            arr.splice(itemIndex + 1, 0, clone);
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  function handleArrayMove(sectionId: string, arrayName: string, fromIndex: number, toIndex: number) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const newProps = JSON.parse(JSON.stringify(s.props));
            const arr = newProps[arrayName];
            if (!Array.isArray(arr) || fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return s;
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Image edit: signal media library to open ──────────────────
  function handleImageEdit(sectionId: string, propPath: string) {
    setImageEditTarget({ sectionId, propPath });
    setActivePanel("media");
  }

  // ─── Background position update ──────────────────
  function handleBgPosition(sectionId: string, position: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            // Update backgroundPosition in section style or hero props
            if (s.type === "hero") {
              return { ...s, props: { ...s.props, backgroundPosition: position } };
            }
            return {
              ...s,
              style: { ...(s.style || {}), backgroundPosition: position },
            };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Section spacing update ──────────────────
  function handleSpacingEdit(sectionId: string, paddingTop: string, paddingBottom: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              style: {
                ...(s.style || {}),
                padding: {
                  ...(s.style?.padding || {}),
                  top: paddingTop,
                  bottom: paddingBottom,
                },
              },
            };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Link edit: update multiple props at once ──────────────────
  function handleLinkEdit(sectionId: string, updates: { propPath: string; value: string }[]) {
    for (const update of updates) {
      handleVisualInlineEdit(sectionId, update.propPath, update.value);
    }
  }

  // ─── Section visibility toggle ──────────────────
  function handleToggleVisibility(sectionId: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, visible: s.visible === false ? true : false };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Section copy/paste ──────────────────
  const clipboardRef = useRef<PageDocument["sections"][number] | null>(null);

  function handleSectionCopy(sectionId: string) {
    const slug = getCurrentPageSlug();
    const page = pages.find((p) => p.slug === slug);
    const section = page?.sections.find((s) => s.id === sectionId);
    if (section) {
      clipboardRef.current = JSON.parse(JSON.stringify(section));
    }
  }

  function handleSectionPaste(afterSectionId: string) {
    if (!clipboardRef.current) return;
    const slug = getCurrentPageSlug();
    const cloned = JSON.parse(JSON.stringify(clipboardRef.current));
    cloned.id = `${cloned.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        const sections = [...page.sections];
        const idx = sections.findIndex((s) => s.id === afterSectionId);
        if (idx >= 0) {
          sections.splice(idx + 1, 0, cloned);
        } else {
          sections.push(cloned);
        }
        return { ...page, sections };
      })
    );
    markDirty();
  }

  // ─── Animation update ──────────────────
  function handleAnimationUpdate(sectionId: string, animation: string, delay: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              style: {
                ...(s.style || {}),
                animation: animation as typeof s.style.animation,
                animationDelay: delay === "0" ? undefined : `${delay}ms`,
              },
            };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Array add new item ──────────────────
  function handleArrayAdd(sectionId: string, arrayName: string) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const newProps = JSON.parse(JSON.stringify(s.props));
            const arr = newProps[arrayName];
            if (!Array.isArray(arr) || arr.length === 0) return s;
            // Clone the last item as a template for the new one
            const template = JSON.parse(JSON.stringify(arr[arr.length - 1]));
            // Clear text content in the template
            for (const key of Object.keys(template)) {
              if (typeof template[key] === "string" && !key.includes("icon") && !key.includes("image") && !key.includes("color")) {
                if (key.includes("url") || key.includes("href") || key.includes("link") || key.includes("Link")) {
                  template[key] = "#";
                } else {
                  template[key] = `New ${key.charAt(0).toUpperCase() + key.slice(1)}`;
                }
              }
            }
            arr.push(template);
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Element style update (inline formatting) ──────────────────
  function handleElementStyle(sectionId: string, propPath: string, styles: Record<string, string>) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            // Store element-level styles under props._elementStyles[propPath]
            const newProps = { ...s.props };
            const elementStyles = (newProps._elementStyles as Record<string, Record<string, string>>) || {};
            elementStyles[propPath] = { ...(elementStyles[propPath] || {}), ...styles };
            newProps._elementStyles = elementStyles;
            return { ...s, props: newProps };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── Section style update ──────────────────
  function handleStyleUpdate(sectionId: string, updates: Record<string, string>) {
    const slug = getCurrentPageSlug();
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        return {
          ...page,
          sections: page.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const newStyle = { ...(s.style || {}) };
            for (const [key, value] of Object.entries(updates)) {
              if (key === "backgroundGradient") {
                // Parse JSON gradient or clear it
                if (value) {
                  try {
                    (newStyle as Record<string, unknown>)[key] = JSON.parse(value);
                  } catch {
                    (newStyle as Record<string, unknown>)[key] = undefined;
                  }
                } else {
                  (newStyle as Record<string, unknown>)[key] = undefined;
                }
              } else {
                (newStyle as Record<string, unknown>)[key] = value;
              }
            }
            return { ...s, style: newStyle as typeof s.style };
          }),
        };
      })
    );
    markDirty();
  }

  // ─── AI operations handler ──────────────────
  function handleAIOperations(operations: AIEditOperation[], pageSlug: string) {
    // Save current state for undo
    setPagesBeforeAI(JSON.parse(JSON.stringify(pages)));

    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== pageSlug) return page;
        let sections = [...page.sections];

        for (const op of operations) {
          if (op.op === "update" && op.sectionId) {
            sections = sections.map((s) => {
              if (s.id !== op.sectionId) return s;
              return {
                ...s,
                props: op.props ? { ...s.props, ...op.props } : s.props,
                style: op.style ? { ...s.style, ...op.style } : s.style,
              };
            });
          }
          if (op.op === "add" && op.section) {
            const newSection = {
              id: `${op.section.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: op.section.type as PageDocument["sections"][number]["type"],
              props: op.section.props,
              style: (op.section.style || {}) as PageDocument["sections"][number]["style"],
              visible: true,
            };
            const pos = op.position ?? sections.length;
            sections.splice(pos, 0, newSection);
          }
          if (op.op === "remove" && op.sectionId) {
            sections = sections.filter((s) => s.id !== op.sectionId);
          }
        }

        return { ...page, sections };
      })
    );
    markDirty();
  }

  function handleAIUndo() {
    if (pagesBeforeAI) {
      setPages(pagesBeforeAI);
      setPagesBeforeAI(null);
      markDirty();
    }
  }

  // ─── Visual quick-add section handler ──────────────
  function handleVisualAddSection(sectionType: string) {
    const slug = getCurrentPageSlug();
    const position = visualInsertPosition ?? -1;
    const defaultProps = getVisualDefaultProps(sectionType);

    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page;
        const newSection = {
          id: `${sectionType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: sectionType as PageDocument["sections"][number]["type"],
          props: defaultProps,
          style: {} as PageDocument["sections"][number]["style"],
          visible: true,
        };
        const sections = [...page.sections];
        if (position >= 0 && position <= sections.length) {
          sections.splice(position, 0, newSection);
        } else {
          sections.push(newSection);
        }
        return { ...page, sections };
      })
    );
    markDirty();
    setVisualInsertPosition(null);
  }

  // Listen for iframe ready + section clicks + visual editing messages
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "MEMBERWISE_PREVIEW_READY") {
        setPreviewReady(true);
        // Send initial state
        setTimeout(sendPreviewUpdate, 100);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_CLICK") {
        const sectionId = e.data.sectionId;
        if (!visualEditMode) {
          setActivePanel("pages");
          setSelectedSectionId(sectionId);
          // Reset after a tick so subsequent clicks on the same section re-trigger
          setTimeout(() => setSelectedSectionId(null), 500);
        }
      }
      // ─── Visual editing messages ──────────────
      if (e.data?.type === "MEMBERWISE_SECTION_MOVE") {
        handleVisualSectionMove(e.data.sectionId, e.data.direction);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_DUPLICATE") {
        handleVisualSectionDuplicate(e.data.sectionId);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_DELETE") {
        handleVisualSectionDelete(e.data.sectionId);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_REORDER") {
        handleVisualSectionReorder(e.data.sectionId, e.data.newIndex);
      }
      if (e.data?.type === "MEMBERWISE_INLINE_EDIT") {
        handleVisualInlineEdit(e.data.sectionId, e.data.propPath, e.data.value);
      }
      if (e.data?.type === "MEMBERWISE_IMAGE_EDIT") {
        handleImageEdit(e.data.sectionId, e.data.propPath);
      }
      if (e.data?.type === "MEMBERWISE_ARRAY_DELETE") {
        handleArrayDelete(e.data.sectionId, e.data.arrayName, e.data.itemIndex);
      }
      if (e.data?.type === "MEMBERWISE_ARRAY_DUPLICATE") {
        handleArrayDuplicate(e.data.sectionId, e.data.arrayName, e.data.itemIndex);
      }
      if (e.data?.type === "MEMBERWISE_BG_POSITION") {
        handleBgPosition(e.data.sectionId, e.data.position);
      }
      if (e.data?.type === "MEMBERWISE_SPACING_EDIT") {
        handleSpacingEdit(e.data.sectionId, e.data.paddingTop, e.data.paddingBottom);
      }
      if (e.data?.type === "MEMBERWISE_LINK_EDIT") {
        handleLinkEdit(e.data.sectionId, e.data.updates);
      }
      if (e.data?.type === "MEMBERWISE_STYLE_UPDATE") {
        handleStyleUpdate(e.data.sectionId, e.data.updates);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_TOGGLE_VISIBILITY") {
        handleToggleVisibility(e.data.sectionId);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_COPY") {
        handleSectionCopy(e.data.sectionId);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_PASTE") {
        handleSectionPaste(e.data.sectionId);
      }
      if (e.data?.type === "MEMBERWISE_ANIMATION_UPDATE") {
        handleAnimationUpdate(e.data.sectionId, e.data.animation, e.data.delay);
      }
      if (e.data?.type === "MEMBERWISE_ARRAY_ADD") {
        handleArrayAdd(e.data.sectionId, e.data.arrayName);
      }
      if (e.data?.type === "MEMBERWISE_ARRAY_MOVE") {
        handleArrayMove(e.data.sectionId, e.data.arrayName, e.data.fromIndex, e.data.toIndex);
      }
      if (e.data?.type === "MEMBERWISE_ELEMENT_STYLE") {
        handleElementStyle(e.data.sectionId, e.data.propPath, e.data.styles);
      }
      if (e.data?.type === "MEMBERWISE_SECTION_EDIT") {
        // Exit visual mode and open the section editor
        setVisualEditMode(false);
        setActivePanel("pages");
        setSelectedSectionId(e.data.sectionId);
        setTimeout(() => setSelectedSectionId(null), 500);
      }
      if (e.data?.type === "MEMBERWISE_INSERT_SECTION") {
        if (visualEditMode) {
          // Stay in visual mode — show floating quick-add panel
          setVisualInsertPosition(e.data.position);
        } else {
          // Fallback: exit visual mode and open section picker at position
          const slug = getCurrentPageSlug();
          setActivePanel("pages");
          setInsertAtPosition({ pageSlug: slug, position: e.data.position });
        }
      }
      if (e.data?.type === "MEMBERWISE_UNDO") {
        if (undoStackRef.current.length > 0) {
          const current = JSON.parse(JSON.stringify(pages));
          redoStackRef.current.push(current);
          const prev = undoStackRef.current.pop()!;
          lastPagesRef.current = JSON.stringify(prev);
          setPages(prev);
          markDirty();
        }
      }
      if (e.data?.type === "MEMBERWISE_REDO") {
        if (redoStackRef.current.length > 0) {
          const current = JSON.parse(JSON.stringify(pages));
          undoStackRef.current.push(current);
          const next = redoStackRef.current.pop()!;
          lastPagesRef.current = JSON.stringify(next);
          setPages(next);
          markDirty();
        }
      }
      if (e.data?.type === "MEMBERWISE_EXIT_VISUAL_MODE") {
        setVisualEditMode(false);
      }
      if (e.data?.type === "MEMBERWISE_VIEWPORT_CHANGE") {
        const bpMap: Record<string, number> = { desktop: 0, tablet: 1, mobile: 2 };
        const idx = bpMap[e.data.breakpoint] ?? 0;
        setViewport(idx);
      }
      if (e.data?.type === "MEMBERWISE_ZOOM_CHANGE") {
        setIframeZoom(e.data.zoom ?? 100);
      }
      if (e.data?.type === "MEMBERWISE_AI_ASSIST") {
        // Open AI assistant focused on a specific section
        setAiFocusSectionId(e.data.sectionId || null);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendPreviewUpdate, visualEditMode]);

  function togglePanel(id: PanelId) {
    setActivePanel((prev) => (prev === id ? null : id));
  }

  // ─── Publish all changes ──────────────────
  async function handlePublish() {
    setPublishing(true);
    try {
      // If template changed, select new template first
      if (selectedTemplate !== currentTemplate) {
        await selectTemplate(selectedTemplate, selectedTheme);
      }

      // Save theme if changed
      if (selectedTheme !== currentTheme) {
        await updateTheme(selectedTheme);
      }

      // Save full document (globals + pages) in one shot
      if (siteDoc) {
        const updatedDoc: SiteDocument = {
          ...siteDoc,
          sourceTemplateId: selectedTemplate,
          lastModified: new Date().toISOString(),
          global: {
            ...siteDoc.global,
            header,
            footer,
            fonts,
            customCss: customCss || undefined,
            theme: { baseThemeId: selectedTheme, variables: themeVars },
          },
          pages,
        };
        await saveSiteDocument(updatedDoc);
      } else {
        // Fallback: save globals only (no siteDoc yet)
        await saveSiteGlobals({
          header,
          footer,
          fonts,
          customCss: customCss || undefined,
          theme: { baseThemeId: selectedTheme, variables: themeVars },
        });
      }

      setDirty(false);
      setPublished(true);
      setTimeout(() => setPublished(false), 3000);

      // Refresh iframe to show saved state
      if (iframeRef.current) {
        setPreviewReady(false);
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (err) {
      console.error("Publish failed:", err);
    }
    setPublishing(false);
  }

  function refreshPreview() {
    setPreviewReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  // ─── Header helpers ───────────────────────
  function addNavLink() {
    setHeader((h) => ({ ...h, navLinks: [...h.navLinks, { label: "New Link", href: "/" }] }));
    markDirty();
  }
  function updateNavLink(i: number, updates: Partial<NavLink>) {
    setHeader((h) => ({ ...h, navLinks: h.navLinks.map((l, idx) => (idx === i ? { ...l, ...updates } : l)) }));
    markDirty();
  }
  function removeNavLink(i: number) {
    setHeader((h) => ({ ...h, navLinks: h.navLinks.filter((_, idx) => idx !== i) }));
    markDirty();
  }

  // ─── Footer helpers ───────────────────────
  function addSocialLink() {
    setFooter((f) => ({ ...f, socialLinks: [...(f.socialLinks || []), { platform: "Website", url: "" }] }));
    markDirty();
  }
  function updateSocialLink(i: number, updates: Partial<SocialLink>) {
    setFooter((f) => ({
      ...f,
      socialLinks: (f.socialLinks || []).map((l, idx) => (idx === i ? { ...l, ...updates } : l)),
    }));
    markDirty();
  }
  function removeSocialLink(i: number) {
    setFooter((f) => ({ ...f, socialLinks: (f.socialLinks || []).filter((_, idx) => idx !== i) }));
    markDirty();
  }

  const previewUrl = siteUrl
    ? siteUrl.includes("?") ? `${siteUrl}&_preview=1` : `${siteUrl}?_preview=1`
    : null;

  return (
    <AssetProvider>
    <div className="-mx-4 -my-8 flex h-screen overflow-hidden bg-[var(--card)] sm:-mx-6 lg:-mx-8">
      {/* ─── Left: Editor Panel ──────────────────── */}
      <div
        className={cn(
          "flex flex-col border-r border-[var(--border)] transition-all duration-300",
          visualEditMode ? "w-0 min-w-0 overflow-hidden opacity-0" : "w-[400px] min-w-[360px]"
        )}
      >
        {/* Editor header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Layout className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Site Builder</span>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                <AlertCircle className="h-3 w-3" />
                Unsaved
              </span>
            )}
            {published && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                <CheckCircle className="h-3 w-3" />
                Published
              </span>
            )}
          </div>
        </div>

        {/* Scrollable accordion panels */}
        <div className="flex-1 overflow-y-auto">
          {/* ─── Pages ─────────────────────── */}
          <AccordionPanel
            id="pages"
            icon={FileText}
            title="Pages & Content"
            activePanel={activePanel}
            onToggle={togglePanel}
            badge={
              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                {pages.length} page{pages.length !== 1 ? "s" : ""}
              </span>
            }
          >
            <div className="-mx-4 -my-4">
              <PageEditor
                pages={pages}
                onPagesChange={(next) => { setPages(next); markDirty(); }}
                onDirty={markDirty}
                selectedSectionId={selectedSectionId}
                onSectionSelect={setSelectedSectionId}
                insertAtPosition={insertAtPosition}
                onInsertHandled={() => setInsertAtPosition(null)}
              />
            </div>
          </AccordionPanel>

          {/* ─── Template ─────────────────────── */}
          <AccordionPanel
            id="template"
            icon={Layout}
            title="Layout Template"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    markDirty();
                  }}
                  className={cn(
                    "overflow-hidden rounded-lg border-2 text-left transition-all",
                    selectedTemplate === template.id
                      ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  )}
                >
                  <div className="relative aspect-[16/10] bg-[var(--muted)] overflow-hidden">
                    <Image
                      src={template.previewImage}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium">{template.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                      {template.pages.length} pages
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </AccordionPanel>

          {/* ─── Theme ────────────────────────── */}
          <AccordionPanel
            id="theme"
            icon={Palette}
            title="Theme"
            activePanel={activePanel}
            onToggle={togglePanel}
            badge={
              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                {THEMES.find((t) => t.id === selectedTheme)?.name || selectedTheme}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const dark = isDarkTheme(theme.id);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      // Apply theme vars as base
                      setThemeVars((prev) => {
                        const base = { ...theme.variables };
                        // Keep any user overrides that differ from the old theme
                        return base;
                      });
                      markDirty();
                    }}
                    className={cn(
                      "overflow-hidden rounded-lg border-2 text-left transition-all",
                      selectedTheme === theme.id
                        ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                    )}
                  >
                    <div
                      className="p-2"
                      style={{
                        backgroundColor: theme.variables["--background"],
                        color: theme.variables["--foreground"],
                        ...(dark ? { colorScheme: "dark" as const } : {}),
                      }}
                    >
                      <div
                        className="mb-1.5 h-4 rounded-sm"
                        style={{ backgroundColor: theme.variables["--primary"] }}
                      />
                      <div
                        className="mb-1.5 rounded border p-1"
                        style={{
                          backgroundColor: theme.variables["--card"],
                          borderColor: theme.variables["--border"],
                        }}
                      >
                        <div
                          className="mb-0.5 h-1 w-3/4 rounded-full"
                          style={{ backgroundColor: theme.variables["--foreground"], opacity: 0.5 }}
                        />
                        <div
                          className="h-1 w-1/2 rounded-full"
                          style={{ backgroundColor: theme.variables["--muted-foreground"], opacity: 0.3 }}
                        />
                      </div>
                      <div className="flex gap-1">
                        {["--primary", "--accent", "--muted"].map((key) => (
                          <div
                            key={key}
                            className="h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: theme.variables[key] }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-[var(--background)] px-2 py-1.5">
                      <p className="text-[11px] font-medium">{theme.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </AccordionPanel>

          {/* ─── Header ───────────────────────── */}
          <AccordionPanel
            id="header"
            icon={Menu}
            title="Header & Navigation"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Layout</Label>
                <Select
                  value={header.layout}
                  onChange={(e) => {
                    setHeader((h) => ({ ...h, layout: e.target.value as SiteHeader["layout"] }));
                    markDirty();
                  }}
                  className="mt-1 text-xs"
                >
                  <option value="left-aligned">Logo Left, Nav Right</option>
                  <option value="centered">Centered</option>
                  <option value="logo-center">Logo Center, Nav Below</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={header.showLogo}
                  onChange={(e) => {
                    setHeader((h) => ({ ...h, showLogo: e.target.checked }));
                    markDirty();
                  }}
                  className="h-3.5 w-3.5 rounded"
                />
                Show Logo
              </label>

              <div>
                <Label className="text-xs">Navigation Links</Label>
                <div className="mt-1.5 space-y-1.5">
                  {header.navLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        value={link.label}
                        onChange={(e) => updateNavLink(i, { label: e.target.value })}
                        placeholder="Label"
                        className="w-24 text-xs"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => updateNavLink(i, { href: e.target.value })}
                        placeholder="/page"
                        className="flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeNavLink(i)}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addNavLink} className="h-7 text-xs">
                    <Plus className="h-3 w-3" /> Add Link
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">CTA Button</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <Input
                    value={header.ctaButton?.label || ""}
                    onChange={(e) => {
                      setHeader((h) => ({
                        ...h,
                        ctaButton: e.target.value
                          ? { label: e.target.value, href: h.ctaButton?.href || "/portal" }
                          : undefined,
                      }));
                      markDirty();
                    }}
                    placeholder="Button text"
                    className="text-xs"
                  />
                  <Input
                    value={header.ctaButton?.href || ""}
                    onChange={(e) => {
                      setHeader((h) => ({
                        ...h,
                        ctaButton: h.ctaButton ? { ...h.ctaButton, href: e.target.value } : undefined,
                      }));
                      markDirty();
                    }}
                    placeholder="/portal"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </AccordionPanel>

          {/* ─── Footer ───────────────────────── */}
          <AccordionPanel
            id="footer"
            icon={PanelBottom}
            title="Footer"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Layout</Label>
                <Select
                  value={footer.layout}
                  onChange={(e) => {
                    setFooter((f) => ({ ...f, layout: e.target.value as SiteFooter["layout"] }));
                    markDirty();
                  }}
                  className="mt-1 text-xs"
                >
                  <option value="simple">Simple</option>
                  <option value="columns">Multi-column</option>
                  <option value="minimal">Minimal</option>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Copyright</Label>
                <Input
                  value={footer.copyright || ""}
                  onChange={(e) => {
                    setFooter((f) => ({ ...f, copyright: e.target.value }));
                    markDirty();
                  }}
                  placeholder={`© ${new Date().getFullYear()} ${siteName}`}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Social Links</Label>
                <div className="mt-1.5 space-y-1.5">
                  {(footer.socialLinks || []).map((link, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Select
                        value={link.platform}
                        onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                        className="w-24 text-xs"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter / X</option>
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Website">Website</option>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(i)}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSocialLink} className="h-7 text-xs">
                    <Plus className="h-3 w-3" /> Add Social Link
                  </Button>
                </div>
              </div>
            </div>
          </AccordionPanel>

          {/* ─── Typography ───────────────────── */}
          <AccordionPanel
            id="typography"
            icon={Type}
            title="Typography"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Heading Font</Label>
                <Select
                  value={fonts.heading}
                  onChange={(e) => {
                    setFonts((f) => ({ ...f, heading: e.target.value }));
                    markDirty();
                  }}
                  className="mt-1 text-xs"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-base" style={{ fontFamily: fonts.heading }}>
                  The quick brown fox
                </p>
              </div>
              <div>
                <Label className="text-xs">Body Font</Label>
                <Select
                  value={fonts.body}
                  onChange={(e) => {
                    setFonts((f) => ({ ...f, body: e.target.value }));
                    markDirty();
                  }}
                  className="mt-1 text-xs"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-sm" style={{ fontFamily: fonts.body }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </AccordionPanel>

          {/* ─── Colors ───────────────────────── */}
          <AccordionPanel
            id="colors"
            icon={Palette}
            title="Color Overrides"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <div className="space-y-2">
              {THEME_VARS.map((v) => (
                <div key={v.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeVars[v.key] || "#888888"}
                    onChange={(e) => {
                      setThemeVars((prev) => ({ ...prev, [v.key]: e.target.value }));
                      markDirty();
                    }}
                    className="h-7 w-7 cursor-pointer rounded border border-[var(--border)]"
                  />
                  <div className="flex-1">
                    <span className="text-xs">{v.label}</span>
                  </div>
                  <Input
                    value={themeVars[v.key] || ""}
                    onChange={(e) => {
                      setThemeVars((prev) => ({ ...prev, [v.key]: e.target.value }));
                      markDirty();
                    }}
                    placeholder="auto"
                    className="w-24 text-xs"
                  />
                  {themeVars[v.key] && (
                    <button
                      type="button"
                      onClick={() => {
                        setThemeVars((prev) => {
                          const next = { ...prev };
                          delete next[v.key];
                          return next;
                        });
                        markDirty();
                      }}
                      className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </AccordionPanel>

          {/* ─── Custom CSS ───────────────────── */}
          <AccordionPanel
            id="css"
            icon={Code}
            title="Custom CSS"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <Textarea
              value={customCss}
              onChange={(e) => {
                setCustomCss(e.target.value);
                markDirty();
              }}
              placeholder={`.my-hero {\n  background: linear-gradient(...);\n}`}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">
              Injected globally into your public site.
            </p>
          </AccordionPanel>

          {/* ─── Media Library ────────────────── */}
          <AccordionPanel
            id="media"
            icon={ImageIcon}
            title="Media Library"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <MediaLibrary
              compact
              onSelect={imageEditTarget ? (url) => {
                handleVisualInlineEdit(imageEditTarget.sectionId, imageEditTarget.propPath, url);
                setImageEditTarget(null);
                if (visualEditMode) setActivePanel(null);
              } : undefined}
            />
            {imageEditTarget && (
              <div style={{ padding: "8px 12px", background: "#eef2ff", borderRadius: 6, marginTop: 8, fontSize: 12, color: "#4f46e5", fontWeight: 500 }}>
                Select an image to update the section. <button onClick={() => setImageEditTarget(null)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}>Cancel</button>
              </div>
            )}
          </AccordionPanel>

          {/* ─── Snapshots ────────────────────── */}
          <AccordionPanel
            id="snapshots"
            icon={Undo2}
            title="Version History"
            activePanel={activePanel}
            onToggle={togglePanel}
          >
            <SnapshotControls lastUpdated={lastUpdated} />
          </AccordionPanel>
        </div>

        {/* ─── Publish bar ───────────────────── */}
        <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <Button
            onClick={handlePublish}
            disabled={publishing || (!dirty && !published)}
            className={cn(
              "w-full shadow-md transition-all",
              dirty
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                : ""
            )}
          >
            {publishing ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : published ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {publishing ? "Publishing..." : published ? "Published!" : "Publish Changes"}
          </Button>
          {dirty && (
            <p className="mt-1.5 text-center text-[10px] text-[var(--muted-foreground)]">
              Changes are previewed live but not published until you click Publish
            </p>
          )}
        </div>
      </div>

      {/* ─── Right: Preview Panel ────────────────── */}
      <div className="flex flex-1 flex-col bg-[var(--muted)]">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
          <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)] p-0.5">
            {VIEWPORTS.map((vp, i) => (
              <button
                key={vp.name}
                onClick={() => setViewport(i)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  viewport === i
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                <vp.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{vp.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {!visualEditMode && (
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                <Eye className="h-3 w-3" />
                Live Preview
              </div>
            )}
            {visualEditMode && (
              <>
                <button
                  onClick={() => setVisualEditMode(false)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Exit Visual Editor
                </button>
                <div className="flex items-center gap-0.5 rounded-lg bg-[var(--muted)] p-0.5">
                  <button
                    onClick={() => {
                      if (undoStackRef.current.length > 0) {
                        const current = JSON.parse(JSON.stringify(pages));
                        redoStackRef.current.push(current);
                        const prev = undoStackRef.current.pop()!;
                        lastPagesRef.current = JSON.stringify(prev);
                        setPages(prev);
                        setDirty(true);
                      }
                    }}
                    disabled={undoStackRef.current.length === 0}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (⌘Z)"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (redoStackRef.current.length > 0) {
                        const current = JSON.parse(JSON.stringify(pages));
                        undoStackRef.current.push(current);
                        const next = redoStackRef.current.pop()!;
                        lastPagesRef.current = JSON.stringify(next);
                        setPages(next);
                        setDirty(true);
                      }
                    }}
                    disabled={redoStackRef.current.length === 0}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (⌘⇧Z)"
                  >
                    <Undo2 className="h-3.5 w-3.5 -scale-x-100" />
                  </button>
                </div>
                {dirty && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    {publishing ? (
                      <Spinner className="h-3.5 w-3.5" />
                    ) : published ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {publishing ? "Publishing..." : published ? "Published!" : "Publish"}
                  </button>
                )}
              </>
            )}
            {!visualEditMode && (
              <button
                onClick={() => setVisualEditMode(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                title="Visual Editor — edit directly on the preview"
              >
                <MousePointer2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visual Edit</span>
              </button>
            )}
            <button
              onClick={refreshPreview}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              title="Refresh preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                title="Open live site"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Visual mode info bar */}
        {visualEditMode && (
          <div className="flex items-center gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600">
              <MousePointer2 className="h-3.5 w-3.5" />
              Visual Editor
            </div>
            <div className="h-3 w-px bg-indigo-200" />
            <p className="text-[10px] text-indigo-500">
              Click to select &bull; Click text to edit &bull; Right-click for menu &bull; ⌘Z/⌘⇧Z undo/redo &bull; ⌘C/⌘V copy/paste &bull; H toggle visibility &bull; <Sparkles className="inline h-3 w-3" /> AI at bottom
            </p>
            {dirty && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
          </div>
        )}

        {/* Preview iframe */}
        <div className={cn(
          "flex flex-1 items-start justify-center overflow-auto",
          visualEditMode ? "p-0" : "p-4"
        )}>
          {previewUrl ? (
            <div
              className={cn(
                "relative overflow-hidden bg-white transition-all duration-300",
                visualEditMode
                  ? "h-full w-full"
                  : "rounded-xl border border-[var(--border)] shadow-lg"
              )}
              style={visualEditMode ? {
                transform: iframeZoom !== 100 ? `scale(${iframeZoom / 100})` : undefined,
                transformOrigin: "top center",
                width: VIEWPORTS[viewport].width === "100%" && iframeZoom === 100 ? undefined : (iframeZoom !== 100 ? `${100 / (iframeZoom / 100)}%` : VIEWPORTS[viewport].width),
                maxWidth: "100%",
                height: iframeZoom !== 100 ? `${100 / (iframeZoom / 100)}vh` : undefined,
                margin: VIEWPORTS[viewport].width !== "100%" ? "0 auto" : undefined,
                transition: "width 300ms ease",
              } : {
                width: VIEWPORTS[viewport].width,
                maxWidth: "100%",
                height: "calc(100vh - 160px)",
              }}
            >
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="h-full w-full"
                onLoad={() => {
                  // iframe reloaded, preview might need to re-handshake
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Globe className="mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="text-sm font-medium">No site URL configured</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Set up a subdomain or custom domain in Domain settings to preview your site.
              </p>
            </div>
          )}
        </div>

        {/* Quick-add section panel (floating overlay in visual mode) */}
        {visualEditMode && visualInsertPosition !== null && (
          <VisualQuickAddPanel
            onAdd={handleVisualAddSection}
            onClose={() => setVisualInsertPosition(null)}
          />
        )}

        {/* AI Visual Assistant (visible in visual edit mode) */}
        {visualEditMode && (
          <AIVisualAssistant
            pages={pages}
            currentPageSlug={getCurrentPageSlug()}
            onApplyOperations={handleAIOperations}
            onUndo={handleAIUndo}
            canUndo={!!pagesBeforeAI}
            focusSectionId={aiFocusSectionId}
            onClearFocus={() => setAiFocusSectionId(null)}
          />
        )}
      </div>
    </div>
    </AssetProvider>
  );
}

// ─── Visual Quick-Add Section Panel ──────────────────

function VisualQuickAddPanel({
  onAdd,
  onClose,
}: {
  onAdd: (type: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 z-[71] w-[480px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold">Add Section</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setActiveCategory("all");
              }}
              placeholder="Search sections..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-8 pr-3 text-xs outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {!search && (
          <div className="flex flex-wrap gap-1 px-4 pt-2">
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

        <div className="grid max-h-[320px] grid-cols-2 gap-1.5 overflow-y-auto p-4">
          {filteredTypes.length === 0 ? (
            <p className="col-span-2 py-6 text-center text-xs text-[var(--muted-foreground)]">
              No sections match your search
            </p>
          ) : (
            filteredTypes.map(([type, info]) => (
              <button
                key={type}
                onClick={() => onAdd(type)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--accent)] hover:shadow-sm"
              >
                <span className="text-base shrink-0">{info.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium leading-tight">{info.label}</p>
                  <p className="truncate text-[9px] leading-tight text-[var(--muted-foreground)]">
                    {info.description}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Visual Default Props ────────────────────────────

function getVisualDefaultProps(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { heading: "Your Headline", subheading: "Supporting text goes here.", ctaText: "Learn More", ctaLink: "#", size: "medium" },
    features: { heading: "Features", items: [{ icon: "Star", title: "Feature One", description: "Description." }, { icon: "Zap", title: "Feature Two", description: "Description." }, { icon: "Shield", title: "Feature Three", description: "Description." }] },
    cta: { heading: "Ready to get started?", description: "Join us today.", ctaText: "Get Started", ctaLink: "#" },
    testimonials: { heading: "What People Say", items: [{ quote: "Great experience!", author: "John Doe", role: "Member" }] },
    stats: { heading: "By the Numbers", items: [{ value: "100+", label: "Members" }, { value: "50+", label: "Events" }, { value: "95%", label: "Satisfaction" }] },
    "contact-form": { heading: "Contact Us", description: "We'd love to hear from you.", fields: ["name", "email", "message"] },
    "events-list": { heading: "Upcoming Events", showPast: false, limit: 10 },
    faq: { heading: "FAQ", items: [{ question: "Your question?", answer: "Your answer." }] },
    gallery: { heading: "Gallery", columns: 3, images: [] },
    "rich-text": { heading: "", content: "<p>Start writing your content here.</p>" },
    "image-banner": { imageUrl: "", alt: "", height: "medium" },
    "video-embed": { heading: "", videoUrl: "" },
    "custom-html": { heading: "", html: "" },
    cards: { heading: "Cards", columns: 3, items: [{ title: "Card Title", description: "Description.", image: "", linkText: "Learn more" }] },
    pricing: { heading: "Membership Tiers", subheading: "Choose the plan that works for you.", tiers: [{ name: "Basic", price: "$25", period: "year", features: ["Community access"], ctaText: "Join" }] },
    team: { heading: "Our Team", columns: 3, members: [{ name: "Jane Doe", role: "President", bio: "" }] },
    "logo-cloud": { heading: "Our Partners", grayscale: true, logos: [] },
    timeline: { heading: "Our History", events: [{ date: "2024", title: "Founded", description: "Our organization was established." }] },
    "interactive-calendar": { heading: "Event Calendar", subheading: "Browse our upcoming and past events", showPastEvents: true },
    "newsletter-signup": { heading: "Stay Updated", subheading: "Get the latest news.", buttonText: "Subscribe" },
    countdown: { heading: "Coming Soon", targetDate: "" },
    "social-links": { heading: "Connect With Us", links: [] },
    spacer: { height: "4rem" },
    divider: { style: "solid", width: "medium" },
  };
  return defaults[type] || {};
}
