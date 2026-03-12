"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import type { SectionDocument } from "@/lib/types/site-document";

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
  "directory-grid": { label: "Member Directory", description: "Searchable member grid", icon: "👥", category: "data" },
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
      <Field label="Background Image URL">
        <Input
          value={(props.backgroundImage as string) || ""}
          onChange={(e) => onChange({ ...props, backgroundImage: e.target.value })}
          placeholder="https://... or paste from Media Library"
          className="text-xs"
        />
      </Field>
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
      <Field label="Image URL">
        <Input
          value={(props.imageUrl as string) || ""}
          onChange={(e) => onChange({ ...props, imageUrl: e.target.value })}
          placeholder="https://... or paste from Media Library"
          className="text-xs"
        />
      </Field>
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
            <Field label="Image URL">
              <Input value={item.image || ""} onChange={(e) => update({ image: e.target.value })} placeholder="https://..." className="text-xs" />
            </Field>
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
            <Field label="Photo URL">
              <Input value={member.image || ""} onChange={(e) => update({ image: e.target.value })} placeholder="https://..." className="text-xs" />
            </Field>
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
            <Field label="Logo Image URL">
              <Input value={logo.src} onChange={(e) => update({ src: e.target.value })} placeholder="https://..." className="text-xs" />
            </Field>
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
                <Input value={item.icon || ""} onChange={(e) => update({ icon: e.target.value })} placeholder="Star" className="text-xs" />
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
            <Field label="Image URL">
              <Input value={item.src} onChange={(e) => update({ src: e.target.value })} placeholder="https://... or paste from Media Library" className="text-xs" />
            </Field>
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
