"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical, Search, ChevronDown, Upload, Trash2, Image as ImageIcon, FolderOpen, Link as LinkIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { SectionDocument } from "@/lib/types/site-document";
import { useAssets } from "./asset-context";
import { Spinner } from "@/components/ui/spinner";

// ─── Shared Helpers ──────────────────────────────────

type Props = Record<string, unknown>;
type OnChange = (props: Props) => void;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-[var(--muted-foreground)]">{label}</Label>
      {children}
    </div>
  );
}

// ─── Curated icon list (popular Lucide icons) ───────
const ICON_LIST = [
  "Star", "Heart", "Users", "Shield", "Zap", "Globe", "Mail", "Phone", "MapPin", "Clock",
  "Calendar", "Camera", "Image", "Video", "Music", "Headphones", "Mic", "Speaker",
  "BookOpen", "FileText", "Folder", "Archive", "Download", "Upload", "Link", "Share2",
  "Send", "MessageCircle", "MessageSquare", "Bell", "BellRing", "AlertCircle", "Info",
  "HelpCircle", "CheckCircle", "XCircle", "Award", "Trophy", "Target", "Flag",
  "Bookmark", "Tag", "Hash", "AtSign", "Search", "Filter", "Settings", "Sliders",
  "BarChart3", "PieChart", "TrendingUp", "Activity", "LineChart", "LayoutGrid",
  "Home", "Building", "Store", "Briefcase", "GraduationCap", "Lightbulb", "Palette",
  "Paintbrush", "Pencil", "Code", "Terminal", "Database", "Server", "Cloud", "Wifi",
  "Lock", "Unlock", "Key", "Eye", "EyeOff", "Fingerprint", "ShieldCheck",
  "CreditCard", "DollarSign", "Wallet", "Receipt", "ShoppingCart", "ShoppingBag", "Package",
  "Truck", "Plane", "Car", "Navigation", "Compass", "Map", "Route",
  "Sun", "Moon", "CloudRain", "Snowflake", "Flame", "Leaf", "TreePine", "Mountain",
  "Rocket", "Sparkles", "Wand2", "Crown", "Gem", "Gift", "PartyPopper", "Cake",
  "ThumbsUp", "ThumbsDown", "SmilePlus", "Laugh", "Frown", "HandMetal",
  "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "ChevronRight", "ExternalLink",
  "Play", "Pause", "SkipForward", "Volume2", "Maximize", "Minimize",
  "Plus", "Minus", "X", "Check", "MoreHorizontal", "Menu", "Grid", "List",
  "Cpu", "Smartphone", "Monitor", "Printer", "Watch", "Gamepad2",
  "Utensils", "Coffee", "Wine", "Pizza", "Apple", "Cookie",
  "Dog", "Cat", "Bird", "Bug", "Fish",
  "Handshake", "UsersRound", "UserPlus", "Contact", "CircleUser",
];

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CurrentIcon = (LucideIcons as any)[value] || LucideIcons.Star;
  const filtered = search
    ? ICON_LIST.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : ICON_LIST;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs transition-colors hover:bg-[var(--accent)]"
      >
        <CurrentIcon className="h-4 w-4 text-[var(--primary)]" />
        <span className="flex-1 text-left truncate text-[var(--foreground)]">{value || "Select icon"}</span>
        <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              autoFocus
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-7 pr-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="grid max-h-[200px] grid-cols-7 gap-0.5 overflow-y-auto">
            {filtered.map((name) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const Icon = (LucideIcons as any)[name];
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                  title={name}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    value === name
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-7 py-4 text-center text-xs text-[var(--muted-foreground)]">No icons found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image Field with Inline Asset Browser ──────────
function ImageField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { assets, loaded, loading, uploading, loadAssets, uploadFiles, removeAsset } = useAssets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(() => {
    setShowBrowser(true);
    if (!loaded) loadAssets();
  }, [loaded, loadAssets]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const uploaded = await uploadFiles(files);
    if (uploaded.length > 0) {
      onChange(uploaded[0].url);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Field label={label || "Image"}>
      <div className="space-y-2">
        {/* Selected image preview */}
        {value && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute right-1 top-1 flex gap-1">
              <button
                type="button"
                onClick={() => { setShowBrowser(true); if (!loaded) loadAssets(); }}
                className="rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
                title="Change image"
              >
                <FolderOpen className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* No image selected — show upload zone */}
        {!value && !showBrowser && (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-5 transition-colors cursor-pointer ${
              dragOver
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-[var(--border)] hover:border-[var(--muted-foreground)] hover:bg-[var(--accent)]/30"
            }`}
            onClick={handleOpen}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            {uploading ? (
              <Spinner className="mb-1.5 h-5 w-5 text-[var(--primary)]" />
            ) : (
              <Upload className="mb-1.5 h-5 w-5 text-[var(--muted-foreground)]" />
            )}
            <p className="text-xs font-medium text-[var(--foreground)]">
              {uploading ? "Uploading..." : "Click to browse assets"}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
              or drag & drop an image here
            </p>
          </div>
        )}

        {/* Action buttons when no image and browser closed */}
        {!value && !showBrowser && (
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="h-7 flex-1 text-[11px]"
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload New
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="h-7 text-[11px]"
            >
              <LinkIcon className="mr-1 h-3 w-3" />
              URL
            </Button>
          </div>
        )}

        {/* URL input toggle */}
        {showUrlInput && !showBrowser && (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="text-xs"
            autoFocus
          />
        )}

        {/* Inline asset browser */}
        {showBrowser && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            {/* Browser header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <span className="text-[11px] font-semibold">Your Assets</span>
                <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                  {assets.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
                >
                  {uploading ? <Spinner className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrowser(false)}
                  className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Drop zone + grid */}
            <div
              className={`p-2 transition-colors ${dragOver ? "bg-[var(--primary)]/5" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {loading && assets.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <ImageIcon className="mb-2 h-6 w-6 text-[var(--muted-foreground)]" />
                  <p className="text-[11px] text-[var(--muted-foreground)]">No images uploaded yet</p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                    Upload or drag images here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto">
                  {assets.map((asset) => {
                    const isSelected = value === asset.url;
                    return (
                      <div
                        key={asset.filename}
                        className={`group relative cursor-pointer overflow-hidden rounded-md border transition-all ${
                          isSelected
                            ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30"
                            : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                        }`}
                        onClick={() => {
                          onChange(asset.url);
                          setShowBrowser(false);
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[var(--muted)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.url}
                            alt={asset.filename}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/20">
                              <div className="rounded-full bg-[var(--primary)] p-1">
                                <LucideIcons.Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                          {/* Delete button on hover */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAsset(asset.filename);
                              if (value === asset.url) onChange("");
                            }}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <div className="px-1.5 py-1">
                          <p className="truncate text-[9px] font-medium text-[var(--foreground)]">
                            {asset.filename.replace(/^\d+-/, "")}
                          </p>
                          <p className="text-[9px] text-[var(--muted-foreground)]">
                            {formatSize(asset.size)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* URL fallback */}
            <div className="border-t border-[var(--border)] px-2 py-2">
              <div className="flex items-center gap-1.5">
                <LinkIcon className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="h-7 text-[11px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

function ItemList<T extends Record<string, unknown>>({
  items,
  onUpdate,
  renderItem,
  createItem,
  addLabel,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (updates: Partial<T>) => void) => React.ReactNode;
  createItem: () => T;
  addLabel: string;
}) {
  function updateItem(index: number, updates: Partial<T>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    onUpdate(next);
  }
  function removeItem(index: number) {
    onUpdate(items.filter((_, i) => i !== index));
  }
  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onUpdate(next);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="group relative rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(i, i - 1)}
                disabled={i === 0}
                className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                title="Move up"
              >
                <GripVertical className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-medium text-[var(--muted-foreground)]">#{i + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {renderItem(item, i, (updates) => updateItem(i, updates))}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUpdate([...items, createItem()])}
        className="h-7 w-full text-xs"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </Button>
    </div>
  );
}

// ─── Section Type Labels & Descriptions ──────────────

export interface SectionTypeInfo {
  label: string;
  description: string;
  icon: string;
  category: "content" | "layout" | "interactive" | "data" | "widgets" | "utility";
}

export const SECTION_TYPE_INFO: Record<string, SectionTypeInfo> = {
  // Content
  hero: { label: "Hero Banner", description: "Large banner with heading and CTA", icon: "🖼️", category: "content" },
  "rich-text": { label: "Rich Text", description: "Freeform text content block", icon: "📝", category: "content" },
  "image-banner": { label: "Image Banner", description: "Full-width image with overlay", icon: "🌄", category: "content" },
  "video-embed": { label: "Video", description: "YouTube or Vimeo embed", icon: "🎬", category: "content" },
  cta: { label: "Call to Action", description: "Prominent action section", icon: "📢", category: "content" },
  "custom-html": { label: "Custom HTML", description: "Raw HTML / embed code", icon: "🧩", category: "content" },

  // Layout
  features: { label: "Features", description: "Grid of feature cards", icon: "✨", category: "layout" },
  cards: { label: "Cards", description: "Image + text card grid", icon: "🃏", category: "layout" },
  pricing: { label: "Pricing Table", description: "Pricing tiers comparison", icon: "💰", category: "layout" },
  team: { label: "Team", description: "Team member grid", icon: "👤", category: "layout" },
  "logo-cloud": { label: "Logo Cloud", description: "Partner / sponsor logos", icon: "🏢", category: "layout" },
  testimonials: { label: "Testimonials", description: "Customer quotes", icon: "💬", category: "layout" },
  stats: { label: "Statistics", description: "Key numbers display", icon: "📊", category: "layout" },
  timeline: { label: "Timeline", description: "Chronological milestones", icon: "📅", category: "layout" },
  gallery: { label: "Gallery", description: "Image grid", icon: "🖼️", category: "layout" },

  // Interactive / Data
  "contact-form": { label: "Contact Form", description: "Form with configurable fields", icon: "📋", category: "interactive" },
  "events-list": { label: "Events", description: "Upcoming event listings", icon: "📅", category: "data" },
  "interactive-calendar": { label: "Event Calendar", description: "Interactive calendar with event details", icon: "🗓️", category: "interactive" },
  faq: { label: "FAQ", description: "Accordion Q&A section", icon: "❓", category: "interactive" },

  // Widgets
  "social-feed": { label: "Social Feed", description: "Instagram, Facebook, or X feed", icon: "📱", category: "widgets" },
  "google-reviews": { label: "Google Reviews", description: "Customer reviews & ratings", icon: "⭐", category: "widgets" },
  "google-map": { label: "Map", description: "Google Maps embed", icon: "📍", category: "widgets" },
  "calendar-widget": { label: "Calendar", description: "Google/Outlook/Calendly calendar", icon: "📆", category: "widgets" },
  "newsletter-signup": { label: "Newsletter", description: "Email signup form", icon: "💌", category: "widgets" },
  countdown: { label: "Countdown", description: "Timer to a target date", icon: "⏰", category: "widgets" },
  "social-links": { label: "Social Links", description: "Social media link buttons", icon: "🔗", category: "widgets" },

  // Utility
  spacer: { label: "Spacer", description: "Vertical space", icon: "↕️", category: "utility" },
  divider: { label: "Divider", description: "Horizontal line separator", icon: "➖", category: "utility" },
};

export const SECTION_CATEGORIES = [
  { key: "content", label: "Content" },
  { key: "layout", label: "Layout" },
  { key: "interactive", label: "Interactive" },
  { key: "data", label: "Data" },
  { key: "widgets", label: "Widgets" },
  { key: "utility", label: "Utility" },
] as const;

// ─── Hero Editor ─────────────────────────────────────

function HeroEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input
          value={(props.heading as string) || ""}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          placeholder="Your headline"
          className="text-xs"
        />
      </Field>
      <Field label="Subheading">
        <Textarea
          value={(props.subheading as string) || ""}
          onChange={(e) => onChange({ ...props, subheading: e.target.value })}
          placeholder="Supporting text"
          rows={2}
          className="text-xs"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button Text">
          <Input
            value={(props.ctaText as string) || ""}
            onChange={(e) => onChange({ ...props, ctaText: e.target.value })}
            placeholder="Learn More"
            className="text-xs"
          />
        </Field>
        <Field label="Button Link">
          <Input
            value={(props.ctaLink as string) || ""}
            onChange={(e) => onChange({ ...props, ctaLink: e.target.value })}
            placeholder="/about"
            className="text-xs"
          />
        </Field>
      </div>
      <Field label="Size">
        <Select
          value={(props.size as string) || "medium"}
          onChange={(e) => onChange({ ...props, size: e.target.value })}
          className="text-xs"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </Select>
      </Field>
      <ImageField
        label="Background Image"
        value={(props.backgroundImage as string) || ""}
        onChange={(url) => onChange({ ...props, backgroundImage: url })}
      />
    </div>
  );
}

// ─── Rich Text Editor ───────────────────────────────

function RichTextSectionEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading (optional)">
        <Input
          value={(props.heading as string) || ""}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          placeholder="Optional heading"
          className="text-xs"
        />
      </Field>
      <Field label="Content (HTML)">
        <Textarea
          value={(props.content as string) || ""}
          onChange={(e) => onChange({ ...props, content: e.target.value })}
          placeholder="<p>Write your content here...</p>&#10;&#10;Supports: <h2>, <h3>, <p>, <ul>, <ol>, <a>, <strong>, <em>, <img>, <blockquote>"
          rows={10}
          className="text-xs font-mono"
        />
      </Field>
      <p className="text-[10px] text-[var(--muted-foreground)]">
        Supports HTML: headings, paragraphs, lists, links, images, bold, italic, blockquotes, etc.
      </p>
    </div>
  );
}

// ─── Image Banner Editor ────────────────────────────

function ImageBannerEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <ImageField
        label="Image"
        value={(props.imageUrl as string) || ""}
        onChange={(url) => onChange({ ...props, imageUrl: url })}
      />
      <Field label="Alt Text">
        <Input
          value={(props.alt as string) || ""}
          onChange={(e) => onChange({ ...props, alt: e.target.value })}
          placeholder="Image description"
          className="text-xs"
        />
      </Field>
      <Field label="Caption (optional)">
        <Input
          value={(props.caption as string) || ""}
          onChange={(e) => onChange({ ...props, caption: e.target.value })}
          placeholder="Photo credit or description"
          className="text-xs"
        />
      </Field>
      <Field label="Overlay Text (optional)">
        <Input
          value={(props.overlayText as string) || ""}
          onChange={(e) => onChange({ ...props, overlayText: e.target.value })}
          placeholder="Text over the image"
          className="text-xs"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Height">
          <Select
            value={(props.height as string) || "medium"}
            onChange={(e) => onChange({ ...props, height: e.target.value })}
            className="text-xs"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full Screen</option>
          </Select>
        </Field>
        <Field label="Overlay Position">
          <Select
            value={(props.overlayPosition as string) || "center"}
            onChange={(e) => onChange({ ...props, overlayPosition: e.target.value })}
            className="text-xs"
          >
            <option value="center">Center</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </Select>
        </Field>
      </div>
      <Field label="Link URL (optional)">
        <Input
          value={(props.linkUrl as string) || ""}
          onChange={(e) => onChange({ ...props, linkUrl: e.target.value })}
          placeholder="https://..."
          className="text-xs"
        />
      </Field>
    </div>
  );
}

// ─── Video Embed Editor ─────────────────────────────

function VideoEmbedEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading (optional)">
        <Input
          value={(props.heading as string) || ""}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className="text-xs"
        />
      </Field>
      <Field label="Description (optional)">
        <Textarea
          value={(props.description as string) || ""}
          onChange={(e) => onChange({ ...props, description: e.target.value })}
          rows={2}
          className="text-xs"
        />
      </Field>
      <Field label="Video URL">
        <Input
          value={(props.videoUrl as string) || ""}
          onChange={(e) => onChange({ ...props, videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          className="text-xs"
        />
      </Field>
    </div>
  );
}

// ─── Custom HTML Editor ─────────────────────────────

function CustomHtmlEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading (optional)">
        <Input
          value={(props.heading as string) || ""}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className="text-xs"
        />
      </Field>
      <Field label="HTML Code">
        <Textarea
          value={(props.html as string) || ""}
          onChange={(e) => onChange({ ...props, html: e.target.value })}
          placeholder="<div>Your custom HTML, embed code, or iframe...</div>"
          rows={8}
          className="text-xs font-mono"
        />
      </Field>
      <p className="text-[10px] text-amber-600">
        Be careful with custom HTML — make sure you trust the source of any embed code.
      </p>
    </div>
  );
}

// ─── Cards Editor ───────────────────────────────────

function CardsEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const items = (props.items as Array<{ image?: string; title: string; description: string; linkUrl?: string; linkText?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Columns">
        <Select value={String((props.columns as number) || 3)} onChange={(e) => onChange({ ...props, columns: parseInt(e.target.value) })} className="text-xs">
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </Select>
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Cards</Label>
      <ItemList
        items={items}
        onUpdate={(next) => onChange({ ...props, items: next })}
        createItem={() => ({ title: "New Card", description: "Card description", image: "", linkUrl: "", linkText: "" })}
        addLabel="Add Card"
        renderItem={(item, _, update) => (
          <div className="space-y-2">
            <ImageField label="Image" value={item.image || ""} onChange={(url) => update({ image: url })} />
            <Field label="Title">
              <Input value={item.title} onChange={(e) => update({ title: e.target.value })} className="text-xs" />
            </Field>
            <Field label="Description">
              <Textarea value={item.description} onChange={(e) => update({ description: e.target.value })} rows={2} className="text-xs" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Link URL">
                <Input value={item.linkUrl || ""} onChange={(e) => update({ linkUrl: e.target.value })} placeholder="/page" className="text-xs" />
              </Field>
              <Field label="Link Text">
                <Input value={item.linkText || ""} onChange={(e) => update({ linkText: e.target.value })} placeholder="Read more" className="text-xs" />
              </Field>
            </div>
          </div>
        )}
      />
    </div>
  );
}

// ─── Pricing Editor ─────────────────────────────────

function PricingEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const tiers = (props.tiers as Array<{
    name: string; price: string; period?: string; description?: string;
    features: string[]; ctaText?: string; ctaLink?: string; highlighted?: boolean;
  }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Pricing Tiers</Label>
      <ItemList
        items={tiers}
        onUpdate={(next) => onChange({ ...props, tiers: next })}
        createItem={() => ({
          name: "New Tier", price: "$0", period: "month", description: "",
          features: ["Feature 1"], ctaText: "Get Started", ctaLink: "/register", highlighted: false,
        })}
        addLabel="Add Tier"
        renderItem={(tier, _, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Name">
                <Input value={tier.name} onChange={(e) => update({ name: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Price">
                <Input value={tier.price} onChange={(e) => update({ price: e.target.value })} placeholder="$29" className="text-xs" />
              </Field>
              <Field label="Period">
                <Input value={tier.period || ""} onChange={(e) => update({ period: e.target.value })} placeholder="month" className="text-xs" />
              </Field>
            </div>
            <Field label="Description">
              <Input value={tier.description || ""} onChange={(e) => update({ description: e.target.value })} className="text-xs" />
            </Field>
            <Field label="Features (one per line)">
              <Textarea
                value={(tier.features || []).join("\n")}
                onChange={(e) => update({ features: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
                className="text-xs"
                placeholder={"Feature 1\nFeature 2\nFeature 3"}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Button Text">
                <Input value={tier.ctaText || ""} onChange={(e) => update({ ctaText: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Button Link">
                <Input value={tier.ctaLink || ""} onChange={(e) => update({ ctaLink: e.target.value })} className="text-xs" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={tier.highlighted || false} onChange={(e) => update({ highlighted: e.target.checked })} className="h-3.5 w-3.5 rounded" />
              Highlight as popular
            </label>
          </div>
        )}
      />
    </div>
  );
}

// ─── Team Editor ────────────────────────────────────

function TeamEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const members = (props.members as Array<{ name: string; role?: string; bio?: string; image?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Columns">
        <Select value={String((props.columns as number) || 3)} onChange={(e) => onChange({ ...props, columns: parseInt(e.target.value) })} className="text-xs">
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </Select>
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Team Members</Label>
      <ItemList
        items={members}
        onUpdate={(next) => onChange({ ...props, members: next })}
        createItem={() => ({ name: "New Member", role: "Title", bio: "", image: "" })}
        addLabel="Add Member"
        renderItem={(member, _, update) => (
          <div className="space-y-2">
            <ImageField label="Photo" value={member.image || ""} onChange={(url) => update({ image: url })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <Input value={member.name} onChange={(e) => update({ name: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Role / Title">
                <Input value={member.role || ""} onChange={(e) => update({ role: e.target.value })} className="text-xs" />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea value={member.bio || ""} onChange={(e) => update({ bio: e.target.value })} rows={2} className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Logo Cloud Editor ──────────────────────────────

function LogoCloudEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const logos = (props.logos as Array<{ src: string; alt?: string; url?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Our Partners" className="text-xs" />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={(props.grayscale as boolean) !== false} onChange={(e) => onChange({ ...props, grayscale: e.target.checked })} className="h-3.5 w-3.5 rounded" />
        Grayscale logos (color on hover)
      </label>
      <Label className="text-xs text-[var(--muted-foreground)]">Logos</Label>
      <ItemList
        items={logos}
        onUpdate={(next) => onChange({ ...props, logos: next })}
        createItem={() => ({ src: "", alt: "", url: "" })}
        addLabel="Add Logo"
        renderItem={(logo, _, update) => (
          <div className="space-y-2">
            <ImageField label="Logo Image" value={logo.src} onChange={(url) => update({ src: url })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Alt Text">
                <Input value={logo.alt || ""} onChange={(e) => update({ alt: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Link URL">
                <Input value={logo.url || ""} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." className="text-xs" />
              </Field>
            </div>
          </div>
        )}
      />
    </div>
  );
}

// ─── Timeline Editor ────────────────────────────────

function TimelineEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const events = (props.events as Array<{ date: string; title: string; description?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Timeline Events</Label>
      <ItemList
        items={events}
        onUpdate={(next) => onChange({ ...props, events: next })}
        createItem={() => ({ date: "2024", title: "New Milestone", description: "" })}
        addLabel="Add Milestone"
        renderItem={(event, _, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Date">
                <Input value={event.date} onChange={(e) => update({ date: e.target.value })} placeholder="2024" className="text-xs" />
              </Field>
              <div className="col-span-2">
                <Field label="Title">
                  <Input value={event.title} onChange={(e) => update({ title: e.target.value })} className="text-xs" />
                </Field>
              </div>
            </div>
            <Field label="Description">
              <Textarea value={event.description || ""} onChange={(e) => update({ description: e.target.value })} rows={2} className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Spacer Editor ──────────────────────────────────

function SpacerEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Height">
        <Select value={(props.height as string) || "4rem"} onChange={(e) => onChange({ ...props, height: e.target.value })} className="text-xs">
          <option value="1rem">Extra Small (1rem)</option>
          <option value="2rem">Small (2rem)</option>
          <option value="4rem">Medium (4rem)</option>
          <option value="6rem">Large (6rem)</option>
          <option value="8rem">Extra Large (8rem)</option>
          <option value="12rem">Huge (12rem)</option>
        </Select>
      </Field>
    </div>
  );
}

// ─── Divider Editor ─────────────────────────────────

function DividerEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Style">
        <Select value={((props as Record<string, unknown>).style as string) || "solid"} onChange={(e) => onChange({ ...props, style: e.target.value })} className="text-xs">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="gradient">Gradient Fade</option>
        </Select>
      </Field>
      <Field label="Width">
        <Select value={(props.width as string) || "medium"} onChange={(e) => onChange({ ...props, width: e.target.value })} className="text-xs">
          <option value="narrow">Narrow</option>
          <option value="medium">Medium</option>
          <option value="full">Full Width</option>
        </Select>
      </Field>
      <Field label="Color (optional)">
        <Input value={(props.color as string) || ""} onChange={(e) => onChange({ ...props, color: e.target.value })} placeholder="Leave empty for default" className="text-xs" />
      </Field>
    </div>
  );
}

// ─── Features Editor ─────────────────────────────────

function FeaturesEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const items = (props.items as Array<{ icon?: string; title: string; description: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Our Features" className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Feature Items</Label>
      <ItemList
        items={items}
        onUpdate={(next) => onChange({ ...props, items: next })}
        createItem={() => ({ icon: "Star", title: "New Feature", description: "Describe this feature" })}
        addLabel="Add Feature"
        renderItem={(item, _, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Icon">
                <IconPicker value={item.icon || "Star"} onChange={(icon) => update({ icon })} />
              </Field>
              <div className="col-span-2">
                <Field label="Title">
                  <Input value={item.title} onChange={(e) => update({ title: e.target.value })} className="text-xs" />
                </Field>
              </div>
            </div>
            <Field label="Description">
              <Textarea value={item.description} onChange={(e) => update({ description: e.target.value })} rows={2} className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── CTA Editor ──────────────────────────────────────

function CtaEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Description">
        <Textarea value={(props.description as string) || ""} onChange={(e) => onChange({ ...props, description: e.target.value })} rows={2} className="text-xs" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button Text">
          <Input value={(props.ctaText as string) || ""} onChange={(e) => onChange({ ...props, ctaText: e.target.value })} className="text-xs" />
        </Field>
        <Field label="Button Link">
          <Input value={(props.ctaLink as string) || ""} onChange={(e) => onChange({ ...props, ctaLink: e.target.value })} className="text-xs" />
        </Field>
      </div>
    </div>
  );
}

// ─── Testimonials Editor ─────────────────────────────

function TestimonialsEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const items = (props.items as Array<{ quote: string; author: string; role?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Testimonials</Label>
      <ItemList
        items={items}
        onUpdate={(next) => onChange({ ...props, items: next })}
        createItem={() => ({ quote: "Great experience!", author: "Name", role: "Title" })}
        addLabel="Add Testimonial"
        renderItem={(item, _, update) => (
          <div className="space-y-2">
            <Field label="Quote">
              <Textarea value={item.quote} onChange={(e) => update({ quote: e.target.value })} rows={2} className="text-xs" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Author">
                <Input value={item.author} onChange={(e) => update({ author: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Role">
                <Input value={item.role || ""} onChange={(e) => update({ role: e.target.value })} className="text-xs" />
              </Field>
            </div>
          </div>
        )}
      />
    </div>
  );
}

// ─── Stats Editor ────────────────────────────────────

function StatsEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const items = (props.items as Array<{ value: string; label: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Statistics</Label>
      <ItemList
        items={items}
        onUpdate={(next) => onChange({ ...props, items: next })}
        createItem={() => ({ value: "100+", label: "New Stat" })}
        addLabel="Add Stat"
        renderItem={(item, _, update) => (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Value">
              <Input value={item.value} onChange={(e) => update({ value: e.target.value })} className="text-xs" />
            </Field>
            <Field label="Label">
              <Input value={item.label} onChange={(e) => update({ label: e.target.value })} className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Contact Form Editor ─────────────────────────────

function ContactFormEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const fields = (props.fields as string[]) || ["name", "email", "message"];
  const allFields = ["name", "email", "phone", "company", "subject", "message"];
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" placeholder="Contact Us" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" placeholder="Get in touch with us" />
      </Field>
      <Field label="Button Text">
        <Input value={(props.buttonText as string) || ""} onChange={(e) => onChange({ ...props, buttonText: e.target.value })} className="text-xs" placeholder="Send Message" />
      </Field>
      <Field label="Success Message">
        <Input value={(props.successMessage as string) || ""} onChange={(e) => onChange({ ...props, successMessage: e.target.value })} className="text-xs" placeholder="Thank you for your message!" />
      </Field>
      <Field label="Form Fields">
        <div className="space-y-1.5">
          {allFields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={fields.includes(field)}
                onChange={(e) => {
                  const next = e.target.checked ? [...fields, field] : fields.filter((f) => f !== field);
                  onChange({ ...props, fields: next });
                }}
                className="h-3.5 w-3.5 rounded"
              />
              <span className="capitalize">{field}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Events List Editor ──────────────────────────────

function EventsListEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" placeholder="Optional description" />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={(props.showPast as boolean) || false} onChange={(e) => onChange({ ...props, showPast: e.target.checked })} className="h-3.5 w-3.5 rounded" />
        Show past events
      </label>
      <Field label="Max events to show">
        <Input type="number" value={(props.limit as number) || 10} onChange={(e) => onChange({ ...props, limit: parseInt(e.target.value) || 10 })} className="text-xs" min={1} max={50} />
      </Field>
    </div>
  );
}

// ─── Directory Grid Editor ───────────────────────────

function DirectoryGridEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" placeholder="Member Directory" />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={(props.showSearch as boolean) !== false} onChange={(e) => onChange({ ...props, showSearch: e.target.checked })} className="h-3.5 w-3.5 rounded" />
        Show search bar
      </label>
      <Field label="Columns">
        <Select value={String((props.columns as number) || 3)} onChange={(e) => onChange({ ...props, columns: parseInt(e.target.value) })} className="text-xs">
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </Select>
      </Field>
    </div>
  );
}

// ─── FAQ Editor ──────────────────────────────────────

function FaqEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const items = (props.items as Array<{ question: string; answer: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Questions</Label>
      <ItemList
        items={items}
        onUpdate={(next) => onChange({ ...props, items: next })}
        createItem={() => ({ question: "New question?", answer: "Answer here..." })}
        addLabel="Add Question"
        renderItem={(item, _, update) => (
          <div className="space-y-2">
            <Field label="Question">
              <Input value={item.question} onChange={(e) => update({ question: e.target.value })} className="text-xs" />
            </Field>
            <Field label="Answer">
              <Textarea value={item.answer} onChange={(e) => update({ answer: e.target.value })} rows={2} className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Gallery Editor ──────────────────────────────────

function GalleryEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const images = (props.images as Array<{ src: string; alt?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Columns">
        <Select value={String((props.columns as number) || 3)} onChange={(e) => onChange({ ...props, columns: parseInt(e.target.value) })} className="text-xs">
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </Select>
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Images</Label>
      <ItemList
        items={images}
        onUpdate={(next) => onChange({ ...props, images: next })}
        createItem={() => ({ src: "", alt: "" })}
        addLabel="Add Image"
        renderItem={(item, _, update) => (
          <div className="space-y-2">
            <ImageField label="Image" value={item.src} onChange={(url) => update({ src: url })} />
            <Field label="Alt Text">
              <Input value={item.alt || ""} onChange={(e) => update({ alt: e.target.value })} placeholder="Image description" className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Social Feed Editor ─────────────────────────────

function SocialFeedEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Follow Us" className="text-xs" />
      </Field>
      <Field label="Platform">
        <Select value={(props.platform as string) || "instagram"} onChange={(e) => onChange({ ...props, platform: e.target.value })} className="text-xs">
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">X (Twitter)</option>
        </Select>
      </Field>
      <Field label="Profile URL">
        <Input value={(props.profileUrl as string) || ""} onChange={(e) => onChange({ ...props, profileUrl: e.target.value })} placeholder="https://instagram.com/yourpage" className="text-xs" />
      </Field>
      <Field label="Embed Code">
        <Textarea value={(props.embedCode as string) || ""} onChange={(e) => onChange({ ...props, embedCode: e.target.value })} rows={4} className="text-xs font-mono" placeholder="Paste embed code from your social platform..." />
      </Field>
    </div>
  );
}

// ─── Google Reviews Editor ──────────────────────────

function GoogleReviewsEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const reviews = (props.reviews as Array<{ author: string; rating: number; text: string; date?: string }>) || [];
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="What Our Members Say" className="text-xs" />
      </Field>
      <Field label="Embed Code (or paste widget code from a reviews service)">
        <Textarea value={(props.embedCode as string) || ""} onChange={(e) => onChange({ ...props, embedCode: e.target.value })} rows={3} className="text-xs font-mono" placeholder="Paste embed code..." />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Overall Rating">
          <Input value={(props.overallRating as string) || ""} onChange={(e) => onChange({ ...props, overallRating: e.target.value })} placeholder="4.8" className="text-xs" />
        </Field>
        <Field label="Total Reviews">
          <Input value={(props.totalReviews as string) || ""} onChange={(e) => onChange({ ...props, totalReviews: e.target.value })} placeholder="127" className="text-xs" />
        </Field>
      </div>
      <Label className="text-xs text-[var(--muted-foreground)]">Manual Reviews (optional)</Label>
      <ItemList
        items={reviews}
        onUpdate={(next) => onChange({ ...props, reviews: next })}
        createItem={() => ({ author: "Name", rating: 5, text: "Great experience!", date: "" })}
        addLabel="Add Review"
        renderItem={(review, _, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Author">
                <Input value={review.author} onChange={(e) => update({ author: e.target.value })} className="text-xs" />
              </Field>
              <Field label="Rating (1-5)">
                <Input type="number" min={1} max={5} value={review.rating} onChange={(e) => update({ rating: parseInt(e.target.value) || 5 })} className="text-xs" />
              </Field>
            </div>
            <Field label="Review Text">
              <Textarea value={review.text} onChange={(e) => update({ text: e.target.value })} rows={2} className="text-xs" />
            </Field>
            <Field label="Date">
              <Input value={review.date || ""} onChange={(e) => update({ date: e.target.value })} placeholder="2 weeks ago" className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Google Map Editor ──────────────────────────────

function GoogleMapEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Find Us" className="text-xs" />
      </Field>
      <Field label="Address">
        <Input value={(props.address as string) || ""} onChange={(e) => onChange({ ...props, address: e.target.value })} placeholder="123 Main St, City, State" className="text-xs" />
      </Field>
      <Field label="Google Maps Embed URL">
        <Input value={(props.embedUrl as string) || ""} onChange={(e) => onChange({ ...props, embedUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?pb=..." className="text-xs" />
      </Field>
      <p className="text-[10px] text-[var(--muted-foreground)]">
        Go to Google Maps &rarr; Share &rarr; Embed a map &rarr; Copy the src URL from the iframe.
      </p>
      <Field label="Height">
        <Select value={(props.height as string) || "medium"} onChange={(e) => onChange({ ...props, height: e.target.value })} className="text-xs">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </Select>
      </Field>
    </div>
  );
}

// ─── Calendar Widget Editor ─────────────────────────

function CalendarWidgetEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Our Calendar" className="text-xs" />
      </Field>
      <Field label="Provider">
        <Select value={(props.provider as string) || "google"} onChange={(e) => onChange({ ...props, provider: e.target.value })} className="text-xs">
          <option value="google">Google Calendar</option>
          <option value="outlook">Outlook</option>
          <option value="calendly">Calendly</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Calendar Embed URL">
        <Input value={(props.calendarUrl as string) || ""} onChange={(e) => onChange({ ...props, calendarUrl: e.target.value })} placeholder="https://calendar.google.com/calendar/embed?src=..." className="text-xs" />
      </Field>
      <Field label="Or paste embed code">
        <Textarea value={(props.embedCode as string) || ""} onChange={(e) => onChange({ ...props, embedCode: e.target.value })} rows={3} className="text-xs font-mono" placeholder="<iframe ...>" />
      </Field>
    </div>
  );
}

// ─── Interactive Calendar Editor ─────────────────────

function InteractiveCalendarEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Event Calendar" className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} placeholder="Browse our upcoming and past events" className="text-xs" />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={(props.showPastEvents as boolean) !== false} onChange={(e) => onChange({ ...props, showPastEvents: e.target.checked })} className="h-3.5 w-3.5 rounded" />
        Show past events section
      </label>
      <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-3">
        <p className="text-[10px] text-[var(--muted-foreground)]">
          This section automatically displays published events from your Events module in an interactive monthly calendar. Click any event to see details. Past events show photos, future events show registration info.
        </p>
      </div>
    </div>
  );
}

// ─── Newsletter Signup Editor ───────────────────────

function NewsletterSignupEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Stay Updated" className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} placeholder="Get the latest news..." className="text-xs" />
      </Field>
      <Field label="Button Text">
        <Input value={(props.buttonText as string) || ""} onChange={(e) => onChange({ ...props, buttonText: e.target.value })} placeholder="Subscribe" className="text-xs" />
      </Field>
      <Field label="Success Message">
        <Input value={(props.successMessage as string) || ""} onChange={(e) => onChange({ ...props, successMessage: e.target.value })} placeholder="Thanks for subscribing!" className="text-xs" />
      </Field>
      <Field label="Mailchimp / ConvertKit Embed Code (optional)">
        <Textarea value={(props.embedCode as string) || ""} onChange={(e) => onChange({ ...props, embedCode: e.target.value })} rows={3} className="text-xs font-mono" placeholder="Paste embed code from your email service..." />
      </Field>
    </div>
  );
}

// ─── Countdown Editor ───────────────────────────────

function CountdownEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Coming Soon" className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Target Date & Time">
        <Input type="datetime-local" value={(props.targetDate as string) || ""} onChange={(e) => onChange({ ...props, targetDate: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Expired Message">
        <Input value={(props.expiredMessage as string) || ""} onChange={(e) => onChange({ ...props, expiredMessage: e.target.value })} placeholder="This event has passed!" className="text-xs" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button Text">
          <Input value={(props.ctaText as string) || ""} onChange={(e) => onChange({ ...props, ctaText: e.target.value })} placeholder="Register Now" className="text-xs" />
        </Field>
        <Field label="Button Link">
          <Input value={(props.ctaLink as string) || ""} onChange={(e) => onChange({ ...props, ctaLink: e.target.value })} placeholder="/register" className="text-xs" />
        </Field>
      </div>
    </div>
  );
}

// ─── Social Links Editor ────────────────────────────

function SocialLinksEditor({ props, onChange }: { props: Props; onChange: OnChange }) {
  const links = (props.links as Array<{ platform: string; url: string; label?: string }>) || [];
  const platforms = ["Facebook", "Instagram", "Twitter", "X", "LinkedIn", "YouTube", "TikTok", "Pinterest", "GitHub", "Discord", "Twitch", "Reddit", "Snapchat", "WhatsApp", "Telegram"];
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input value={(props.heading as string) || ""} onChange={(e) => onChange({ ...props, heading: e.target.value })} placeholder="Follow Us" className="text-xs" />
      </Field>
      <Field label="Subheading">
        <Input value={(props.subheading as string) || ""} onChange={(e) => onChange({ ...props, subheading: e.target.value })} className="text-xs" />
      </Field>
      <Field label="Layout">
        <Select value={(props.layout as string) || "horizontal"} onChange={(e) => onChange({ ...props, layout: e.target.value })} className="text-xs">
          <option value="horizontal">Horizontal</option>
          <option value="grid">Grid</option>
        </Select>
      </Field>
      <Label className="text-xs text-[var(--muted-foreground)]">Social Links</Label>
      <ItemList
        items={links}
        onUpdate={(next) => onChange({ ...props, links: next })}
        createItem={() => ({ platform: "Instagram", url: "", label: "" })}
        addLabel="Add Link"
        renderItem={(link, _, update) => (
          <div className="space-y-2">
            <Field label="Platform">
              <Select value={link.platform} onChange={(e) => update({ platform: e.target.value })} className="text-xs">
                {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="URL">
              <Input value={link.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." className="text-xs" />
            </Field>
            <Field label="Custom Label (optional)">
              <Input value={link.label || ""} onChange={(e) => update({ label: e.target.value })} placeholder="Leave empty to use platform name" className="text-xs" />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

// ─── Editor Dispatcher ───────────────────────────────

const EDITORS: Record<string, React.ComponentType<{ props: Props; onChange: OnChange }>> = {
  hero: HeroEditor,
  "rich-text": RichTextSectionEditor,
  "image-banner": ImageBannerEditor,
  "video-embed": VideoEmbedEditor,
  "custom-html": CustomHtmlEditor,
  features: FeaturesEditor,
  cards: CardsEditor,
  pricing: PricingEditor,
  team: TeamEditor,
  "logo-cloud": LogoCloudEditor,
  timeline: TimelineEditor,
  cta: CtaEditor,
  testimonials: TestimonialsEditor,
  stats: StatsEditor,
  "contact-form": ContactFormEditor,
  "events-list": EventsListEditor,
  "directory-grid": DirectoryGridEditor,
  faq: FaqEditor,
  gallery: GalleryEditor,
  "social-feed": SocialFeedEditor,
  "google-reviews": GoogleReviewsEditor,
  "google-map": GoogleMapEditor,
  "calendar-widget": CalendarWidgetEditor,
  "interactive-calendar": InteractiveCalendarEditor,
  "newsletter-signup": NewsletterSignupEditor,
  countdown: CountdownEditor,
  "social-links": SocialLinksEditor,
  spacer: SpacerEditor,
  divider: DividerEditor,
};

export function SectionEditor({
  section,
  onChange,
}: {
  section: SectionDocument;
  onChange: (props: Props) => void;
}) {
  const Editor = EDITORS[section.type];
  if (!Editor) {
    return <p className="text-xs text-[var(--muted-foreground)]">No editor for section type &quot;{section.type}&quot;</p>;
  }
  return <Editor props={section.props} onChange={onChange} />;
}
