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
} from "lucide-react";
import { SnapshotControls } from "./snapshot-controls";
import { MediaLibrary } from "./media-library";
import { AssetProvider } from "./asset-context";
import Image from "next/image";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mark dirty on any change
  function markDirty() {
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

  // Listen for iframe ready
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "MEMBERWISE_PREVIEW_READY") {
        setPreviewReady(true);
        // Send initial state
        setTimeout(sendPreviewUpdate, 100);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendPreviewUpdate]);

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
      <div className="flex w-[400px] min-w-[360px] flex-col border-r border-[var(--border)]">
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
            <MediaLibrary compact />
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
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
              <Eye className="h-3 w-3" />
              Live Preview
            </div>
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

        {/* Preview iframe */}
        <div className="flex flex-1 items-start justify-center overflow-auto p-4">
          {previewUrl ? (
            <div
              className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg transition-all duration-300"
              style={{
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
      </div>
    </div>
    </AssetProvider>
  );
}
