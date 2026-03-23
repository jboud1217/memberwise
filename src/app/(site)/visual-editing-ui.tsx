"use client";

import { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import type { SectionDocument } from "@/lib/types/site-document";

// ─── Prop mapping for inline text editing ──────────────

const EDITABLE_PROP_MAP: Record<string, { heading?: string; subheading?: string; ctaText?: string }> = {
  hero: { heading: "heading", subheading: "subheading", ctaText: "ctaText" },
  features: { heading: "heading" },
  cta: { heading: "heading", subheading: "description", ctaText: "ctaText" },
  testimonials: { heading: "heading" },
  stats: { heading: "heading", subheading: "subheading" },
  faq: { heading: "heading", subheading: "description" },
  pricing: { heading: "heading", subheading: "subheading" },
  team: { heading: "heading", subheading: "subheading" },
  "rich-text": { heading: "heading" },
  "image-banner": { heading: "heading", subheading: "subheading" },
  cards: { heading: "heading", subheading: "subheading" },
  "logo-cloud": { heading: "heading", subheading: "subheading" },
  timeline: { heading: "heading", subheading: "subheading" },
  "newsletter-signup": { heading: "heading", subheading: "description" },
  countdown: { heading: "heading", subheading: "subheading" },
  "contact-form": { heading: "heading", subheading: "subheading" },
  gallery: { heading: "heading" },
  "google-reviews": { heading: "heading" },
  "events-list": { heading: "heading", subheading: "subheading" },
  "directory-grid": { heading: "heading" },
  "video-embed": { heading: "heading", subheading: "description" },
  "google-map": { heading: "heading" },
  "calendar-widget": { heading: "heading" },
  "interactive-calendar": { heading: "heading", subheading: "subheading" },
  "social-feed": { heading: "heading" },
  "social-links": { heading: "heading", subheading: "subheading" },
};

function sendToParent(type: string, data: Record<string, unknown> = {}) {
  if (window.parent !== window) {
    window.parent.postMessage({ type, ...data }, "*");
  }
}

// ─── SVG Icon helper ─────────────────────────────────

function SvgIcon({ d, size = 16, className }: { d: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

// ─── Floating Toolbar ────────────────────────────────

interface FloatingToolbarProps {
  sectionId: string;
  sectionType: string;
  isFirst: boolean;
  isLast: boolean;
  isHidden?: boolean;
}

export function FloatingToolbar({ sectionId, sectionType, isFirst, isLast, isHidden }: FloatingToolbarProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: -42,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
        padding: 3,
        fontFamily: "system-ui, -apple-system, sans-serif",
        whiteSpace: "nowrap" as const,
      }}
    >
      <ToolbarButton
        icon="M12 19V5M5 12l7-7 7 7"
        label="Move Up"
        disabled={isFirst}
        onClick={() => sendToParent("MEMBERWISE_SECTION_MOVE", { sectionId, direction: "up" })}
      />
      <ToolbarButton
        icon="M12 5v14M19 12l-7 7-7-7"
        label="Move Down"
        disabled={isLast}
        onClick={() => sendToParent("MEMBERWISE_SECTION_MOVE", { sectionId, direction: "down" })}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6v4H9V2z"
        label="Duplicate"
        onClick={() => { sendToParent("MEMBERWISE_SECTION_DUPLICATE", { sectionId }); showToast("Section duplicated", "success"); }}
      />
      <ToolbarButton
        icon="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M16 3h2a2 2 0 012 2v12a2 2 0 01-2 2"
        label="Copy Section (⌘C)"
        onClick={() => { sendToParent("MEMBERWISE_SECTION_COPY", { sectionId }); showToast("Section copied", "success"); }}
      />
      <ToolbarButton
        icon={isHidden ? "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z"}
        label={isHidden ? "Show Section" : "Hide Section"}
        onClick={() => { sendToParent("MEMBERWISE_SECTION_TOGGLE_VISIBILITY", { sectionId }); showToast("Visibility toggled", "info"); }}
      />
      <ToolbarButton
        icon="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        label="Edit Properties"
        onClick={() => sendToParent("MEMBERWISE_SECTION_EDIT", { sectionId })}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        label="Ask AI"
        highlight
        onClick={() => sendToParent("MEMBERWISE_AI_ASSIST", { sectionId })}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
        label="Delete"
        danger
        onClick={() => { sendToParent("MEMBERWISE_SECTION_DELETE", { sectionId }); showToast("Section deleted", "success"); }}
      />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  disabled,
  danger,
  highlight,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "none",
        background: highlight ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
        color: disabled ? "#d1d5db" : highlight ? "#fff" : danger ? "#ef4444" : "#374151",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms, color 150ms, transform 150ms",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (highlight) {
            e.currentTarget.style.transform = "scale(1.1)";
          } else {
            e.currentTarget.style.background = danger ? "#fef2f2" : "#f3f4f6";
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        if (!highlight) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <SvgIcon d={icon} size={16} />
    </button>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 2px" }} />;
}

// ─── Insertion Point ("+" between sections) ──────────

interface InsertionPointProps {
  position: number;
}

export function InsertionPoint({ position }: InsertionPointProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        height: hovered ? 48 : 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "height 200ms ease",
        cursor: "pointer",
        zIndex: 40,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        sendToParent("MEMBERWISE_INSERT_SECTION", { position });
      }}
    >
      {/* Horizontal line */}
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          height: 2,
          background: hovered ? "var(--primary, #6366f1)" : "transparent",
          borderRadius: 1,
          transition: "background 200ms",
        }}
      />
      {/* Plus button */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 28,
          height: 28,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hovered ? "var(--primary, #6366f1)" : "transparent",
          color: hovered ? "#fff" : "transparent",
          border: hovered ? "none" : "2px dashed transparent",
          boxShadow: hovered ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
          transition: "all 200ms ease",
          fontFamily: "system-ui",
          fontSize: 18,
          fontWeight: 300,
          lineHeight: 1,
        }}
      >
        +
      </div>
    </div>
  );
}

// ─── Section Label Badge ─────────────────────────────

export function SectionLabel({ type, selected }: { type: string; selected: boolean }) {
  const displayName = type
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 50,
        background: selected ? "var(--primary, #6366f1)" : "rgba(0,0,0,0.65)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 4,
        pointerEvents: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: "0.01em",
        backdropFilter: selected ? "none" : "blur(8px)",
      }}
    >
      {displayName}
    </div>
  );
}

// ─── Drag Handle ─────────────────────────────────────

export function DragHandle() {
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 4,
        cursor: "grab",
        fontFamily: "system-ui",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Drag to reorder"
    >
      <SvgIcon d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" size={14} />
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.02em" }}>DRAG</span>
    </div>
  );
}

// ─── Drop Indicator ──────────────────────────────────

export function DropIndicator() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--primary, #6366f1)",
        borderRadius: 2,
        zIndex: 100,
        boxShadow: "0 0 8px rgba(99,102,241,0.5)",
      }}
    />
  );
}

// ─── Context Menu ───────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  sectionId: string;
  sectionType: string;
  sectionIndex: number;
  isFirst: boolean;
  isLast: boolean;
}

export function useContextMenu(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  sections: SectionDocument[]
) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (!visualMode || !portalTarget) {
      setMenu(null);
      return;
    }

    function handleContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.contentEditable === "true") return;
      if (target.closest("[data-visual-ui]")) return;

      const sectionEl = target.closest("[data-section-id]");
      if (!sectionEl) return;

      e.preventDefault();
      const sectionId = sectionEl.getAttribute("data-section-id")!;
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      const idx = sections.indexOf(section);
      setMenu({
        x: e.clientX,
        y: e.clientY,
        sectionId,
        sectionType: section.type,
        sectionIndex: idx,
        isFirst: idx === 0,
        isLast: idx === sections.length - 1,
      });
    }

    function handleClick() {
      setMenu(null);
    }

    portalTarget.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("contextmenu", handleClick);
    return () => {
      portalTarget.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleClick);
    };
  }, [visualMode, portalTarget, sections]);

  return { menu, closeMenu: () => setMenu(null) };
}

export function ContextMenu({ menu, onClose }: { menu: ContextMenuState; onClose: () => void }) {
  const items = [
    { label: "Move Up", shortcut: "⌘↑", icon: "M12 19V5M5 12l7-7 7 7", disabled: menu.isFirst, action: () => sendToParent("MEMBERWISE_SECTION_MOVE", { sectionId: menu.sectionId, direction: "up" }) },
    { label: "Move Down", shortcut: "⌘↓", icon: "M12 5v14M19 12l-7 7-7-7", disabled: menu.isLast, action: () => sendToParent("MEMBERWISE_SECTION_MOVE", { sectionId: menu.sectionId, direction: "down" }) },
    { divider: true },
    { label: "Edit Properties", shortcut: "Enter", icon: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z", action: () => sendToParent("MEMBERWISE_SECTION_EDIT", { sectionId: menu.sectionId }) },
    { label: "Duplicate", shortcut: "⌘D", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6v4H9V2z", action: () => { sendToParent("MEMBERWISE_SECTION_DUPLICATE", { sectionId: menu.sectionId }); showToast("Section duplicated", "success"); } },
    { label: "Copy Section", shortcut: "⌘C", icon: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M16 3h2a2 2 0 012 2v12a2 2 0 01-2 2", action: () => { sendToParent("MEMBERWISE_SECTION_COPY", { sectionId: menu.sectionId }); showToast("Section copied", "success"); } },
    { label: "Paste Below", shortcut: "⌘V", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6v4H9V2zM12 11v6M9 14h6", action: () => { sendToParent("MEMBERWISE_SECTION_PASTE", { sectionId: menu.sectionId }); showToast("Section pasted", "success"); } },
    { label: "Ask AI", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", highlight: true, action: () => sendToParent("MEMBERWISE_AI_ASSIST", { sectionId: menu.sectionId }) },
    { divider: true },
    { label: "Toggle Visibility", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z", action: () => sendToParent("MEMBERWISE_SECTION_TOGGLE_VISIBILITY", { sectionId: menu.sectionId }) },
    { label: "Insert Above", icon: "M12 5v14M5 12h14", action: () => sendToParent("MEMBERWISE_INSERT_SECTION", { position: menu.sectionIndex }) },
    { label: "Insert Below", icon: "M12 5v14M5 12h14", action: () => sendToParent("MEMBERWISE_INSERT_SECTION", { position: menu.sectionIndex + 1 }) },
    { divider: true },
    { label: "Delete", shortcut: "⌫", icon: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2", danger: true, action: () => { sendToParent("MEMBERWISE_SECTION_DELETE", { sectionId: menu.sectionId }); showToast("Section deleted", "success"); } },
  ] as const;

  // Keep menu within viewport
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: menu.x, y: menu.y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const x = menu.x + rect.width > window.innerWidth ? menu.x - rect.width : menu.x;
    const y = menu.y + rect.height > window.innerHeight ? menu.y - rect.height : menu.y;
    setPos({ x: Math.max(4, x), y: Math.max(4, y) });
  }, [menu.x, menu.y]);

  return (
    <div
      ref={menuRef}
      data-visual-ui="context-menu"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 10000,
        minWidth: 200,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: "4px 0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        animation: "mw-ctx-fade 100ms ease",
      }}
    >
      <style>{`@keyframes mw-ctx-fade { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div style={{ padding: "4px 12px 6px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {menu.sectionType.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
      </div>
      {items.map((item, i) => {
        if ("divider" in item) {
          return <div key={i} style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />;
        }
        return (
          <button
            key={i}
            disabled={"disabled" in item && item.disabled}
            onClick={() => {
              item.action();
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 12px",
              border: "none",
              background: "transparent",
              color: "disabled" in item && item.disabled ? "#d1d5db" : "danger" in item ? "#ef4444" : "highlight" in item ? "#7c3aed" : "#374151",
              cursor: "disabled" in item && item.disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              fontSize: 13,
              fontWeight: "highlight" in item ? 500 : 400,
              fontFamily: "inherit",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => {
              if (!("disabled" in item && item.disabled)) {
                e.currentTarget.style.background = "danger" in item ? "#fef2f2" : "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <SvgIcon d={item.icon} size={14} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {"shortcut" in item && item.shortcut && (
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inline Editing Handler ──────────────────────────

export function useInlineEditing(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  sections: SectionDocument[],
  selectedSectionId?: string | null,
  onOpenIconPicker?: (target: HTMLElement, sectionId: string, propPath: string, currentIcon: string) => void,
  onOpenImageEdit?: (sectionId: string, propPath: string) => void,
  onOpenLinkEditor?: (sectionId: string, linkPath: string, textPath: string, currentUrl: string, currentText: string, rect: DOMRect) => void
) {
  const activeEditRef = useRef<HTMLElement | null>(null);

  // ─── Array item overlay controls ──────────────────
  useEffect(() => {
    if (!visualMode || !portalTarget) return;

    let currentOverlay: HTMLElement | null = null;
    let currentArrayItem: HTMLElement | null = null;

    function showArrayOverlay(arrayItem: HTMLElement) {
      if (currentArrayItem === arrayItem) return;
      removeOverlay();
      currentArrayItem = arrayItem;

      const sectionEl = arrayItem.closest("[data-section-id]");
      if (!sectionEl) return;
      const sectionId = sectionEl.getAttribute("data-section-id")!;
      const arrayName = arrayItem.getAttribute("data-array-item")!;
      const itemIndex = parseInt(arrayItem.getAttribute("data-item-index") || "0", 10);

      const overlay = document.createElement("div");
      overlay.setAttribute("data-visual-ui", "array-controls");
      overlay.style.cssText = `
        position:absolute; top:4px; right:4px; z-index:100;
        display:flex; gap:2px; padding:2px;
        background:rgba(255,255,255,0.95); border-radius:6px;
        box-shadow:0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
        font-family:system-ui,-apple-system,sans-serif;
        animation:mw-ctx-fade 100ms ease;
      `;

      // Count items in this array
      const allItems = sectionEl.querySelectorAll(`[data-array-item="${arrayName}"]`);
      const totalItems = allItems.length;
      const isFirst = itemIndex === 0;
      const isLast = itemIndex === totalItems - 1;

      function makeOverlayBtn(title: string, svg: string, color: string, hoverBg: string): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.title = title;
        btn.innerHTML = svg;
        btn.style.cssText = `
          width:26px; height:26px; border:none; border-radius:4px;
          background:transparent; color:${color}; cursor:pointer;
          display:flex; align-items:center; justify-content:center; padding:0;
          transition:background 100ms;
        `;
        btn.onmouseenter = () => { btn.style.background = hoverBg; };
        btn.onmouseleave = () => { btn.style.background = "transparent"; };
        return btn;
      }

      // Move up button
      if (!isFirst) {
        const moveUpBtn = makeOverlayBtn("Move up",
          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
          "#6366f1", "#eef2ff");
        moveUpBtn.onclick = (e) => {
          e.stopPropagation();
          sendToParent("MEMBERWISE_ARRAY_MOVE", { sectionId, arrayName, fromIndex: itemIndex, toIndex: itemIndex - 1 });
          removeOverlay();
        };
        overlay.appendChild(moveUpBtn);
      }

      // Move down button
      if (!isLast) {
        const moveDownBtn = makeOverlayBtn("Move down",
          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`,
          "#6366f1", "#eef2ff");
        moveDownBtn.onclick = (e) => {
          e.stopPropagation();
          sendToParent("MEMBERWISE_ARRAY_MOVE", { sectionId, arrayName, fromIndex: itemIndex, toIndex: itemIndex + 1 });
          removeOverlay();
        };
        overlay.appendChild(moveDownBtn);
      }

      // Duplicate item button
      const dupBtn = makeOverlayBtn("Duplicate item",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
        "#374151", "#f3f4f6");
      dupBtn.onclick = (e) => {
        e.stopPropagation();
        sendToParent("MEMBERWISE_ARRAY_DUPLICATE", { sectionId, arrayName, itemIndex });
        removeOverlay();
      };
      overlay.appendChild(dupBtn);

      // Delete item button
      const deleteBtn = makeOverlayBtn("Remove item",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
        "#ef4444", "#fef2f2");
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        sendToParent("MEMBERWISE_ARRAY_DELETE", { sectionId, arrayName, itemIndex });
        removeOverlay();
      };
      overlay.appendChild(deleteBtn);

      // Ensure the array item is positioned
      const pos = window.getComputedStyle(arrayItem).position;
      if (pos === "static") arrayItem.style.position = "relative";

      arrayItem.appendChild(overlay);
      currentOverlay = overlay;
    }

    function removeOverlay() {
      if (currentOverlay) {
        currentOverlay.remove();
        currentOverlay = null;
      }
      currentArrayItem = null;
    }

    function handleMouseOverArray(e: Event) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-visual-ui]")) return;
      const arrayItem = target.closest("[data-array-item]") as HTMLElement;
      if (arrayItem) {
        showArrayOverlay(arrayItem);
      }
    }

    function handleMouseOutArray(e: Event) {
      const target = e.target as HTMLElement;
      const relatedTarget = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (currentArrayItem && !currentArrayItem.contains(relatedTarget)) {
        removeOverlay();
      }
    }

    portalTarget.addEventListener("mouseover", handleMouseOverArray);
    portalTarget.addEventListener("mouseout", handleMouseOutArray);

    return () => {
      portalTarget.removeEventListener("mouseover", handleMouseOverArray);
      portalTarget.removeEventListener("mouseout", handleMouseOutArray);
      removeOverlay();
    };
  }, [visualMode, portalTarget, selectedSectionId]);

  // ─── Main inline editing logic ────────────────────
  useEffect(() => {
    if (!visualMode || !portalTarget) return;

    function startEditing(e: Event) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-visual-ui]")) return;

      const sectionEl = target.closest("[data-section-id]");
      if (!sectionEl) return;

      const sectionId = sectionEl.getAttribute("data-section-id");
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      // Helper: select section when editing starts
      function selectSection() {
        // Dispatch a custom event so preview-listener can select the section
        sectionEl!.dispatchEvent(new CustomEvent("visual-select-section", { bubbles: true, detail: { sectionId } }));
      }

      // ─── Icon click: open icon picker ─────────
      const iconEl = target.closest("[data-editable-icon]") as HTMLElement;
      if (iconEl) {
        e.preventDefault();
        e.stopPropagation();
        selectSection();
        const propPath = iconEl.getAttribute("data-prop-path") || "";
        const currentIcon = iconEl.getAttribute("data-editable-icon") || "Star";
        onOpenIconPicker?.(iconEl, sectionId!, propPath, currentIcon);
        return;
      }

      // ─── Image click: open image editor ─────────
      const imageEl = target.closest("[data-editable-image]") as HTMLElement;
      if (imageEl) {
        e.preventDefault();
        e.stopPropagation();
        selectSection();
        const propPath = imageEl.getAttribute("data-editable-image")!;
        onOpenImageEdit?.(sectionId!, propPath);
        return;
      }

      // ─── Link click: open link editor ─────────
      const linkEl = target.closest("[data-editable-link]") as HTMLElement;
      if (linkEl) {
        e.preventDefault();
        e.stopPropagation();
        selectSection();
        const linkPath = linkEl.getAttribute("data-editable-link")!;
        const textPath = linkEl.getAttribute("data-link-text-path") || linkPath.replace("Link", "Text");
        const currentUrl = linkEl.getAttribute("href") || "";
        const textEl = linkEl.querySelector("[data-editable-text]");
        const currentText = textEl?.textContent || linkEl.textContent || "";
        onOpenLinkEditor?.(sectionId!, linkPath, textPath, currentUrl, currentText, linkEl.getBoundingClientRect());
        return;
      }

      // ─── Text with data-editable-text: inline edit ─────────
      const editableText = target.closest("[data-editable-text]") as HTMLElement;
      if (editableText && editableText.contentEditable !== "true") {
        e.preventDefault();
        e.stopPropagation();
        selectSection();
        makeEditable(editableText, sectionId!, editableText.getAttribute("data-editable-text")!);
        return;
      }

      // ─── Legacy: heading/subheading by tag ─────────
      const tag = target.tagName.toLowerCase();
      if (!["h1", "h2", "h3", "h4", "p"].includes(tag)) return;
      if (target.contentEditable === "true") return;
      if (target.hasAttribute("data-editable-text")) return;

      const map = EDITABLE_PROP_MAP[section.type];
      if (!map) return;

      e.preventDefault();
      e.stopPropagation();
      selectSection();

      const propName = getPropForElement(target, section.type);
      if (propName) {
        makeEditable(target, sectionId!, propName);
      }
    }

    function makeEditable(target: HTMLElement, sectionId: string, propPath: string) {
      target.contentEditable = "true";
      target.focus();
      activeEditRef.current = target;

      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      target.style.outline = "2px solid var(--primary, #6366f1)";
      target.style.outlineOffset = "4px";
      target.style.borderRadius = "2px";

      // Show inline formatting toolbar
      const toolbar = createFormattingToolbar(target, sectionId, propPath);

      function handleBlur(e: Event) {
        // Don't blur if clicking inside the formatting toolbar
        const related = (e as FocusEvent).relatedTarget as HTMLElement | null;
        if (related && toolbar.contains(related)) {
          target.focus();
          return;
        }

        target.contentEditable = "false";
        target.style.outline = "";
        target.style.outlineOffset = "";
        target.style.borderRadius = "";
        activeEditRef.current = null;
        toolbar.remove();

        sendToParent("MEMBERWISE_INLINE_EDIT", {
          sectionId,
          propPath,
          value: target.textContent || "",
        });

        // Also send style updates if any were applied
        const styles: Record<string, string> = {};
        if (target.style.fontSize) styles.fontSize = target.style.fontSize;
        if (target.style.fontWeight) styles.fontWeight = target.style.fontWeight;
        if (target.style.fontStyle) styles.fontStyle = target.style.fontStyle;
        if (target.style.textAlign) styles.textAlign = target.style.textAlign;
        if (target.style.textDecorationLine) styles.textDecorationLine = target.style.textDecorationLine;
        if (target.style.textTransform) styles.textTransform = target.style.textTransform;
        if (target.style.color) styles.color = target.style.color;
        if (target.style.backgroundColor) styles.backgroundColor = target.style.backgroundColor;
        if (target.style.lineHeight) styles.lineHeight = target.style.lineHeight;
        if (target.style.letterSpacing) styles.letterSpacing = target.style.letterSpacing;
        if (Object.keys(styles).length > 0) {
          sendToParent("MEMBERWISE_ELEMENT_STYLE", {
            sectionId,
            propPath,
            styles,
          });
        }

        target.removeEventListener("blur", handleBlur);
        target.removeEventListener("keydown", handleKeydown);
      }

      function handleKeydown(e: Event) {
        const ke = e as KeyboardEvent;
        if (ke.key === "Enter" && !ke.shiftKey) {
          ke.preventDefault();
          target.blur();
        }
        if (ke.key === "Escape") {
          toolbar.remove();
          target.blur();
        }
      }

      target.addEventListener("blur", handleBlur);
      target.addEventListener("keydown", handleKeydown);
    }

    function createFormattingToolbar(target: HTMLElement, sectionId: string, propPath: string): HTMLElement {
      const toolbar = document.createElement("div");
      toolbar.setAttribute("data-visual-ui", "format-toolbar");
      toolbar.style.cssText = `
        position:fixed; z-index:10002;
        display:flex; align-items:center; gap:1px;
        background:#fff; border-radius:8px; padding:3px;
        box-shadow:0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
        font-family:system-ui,-apple-system,sans-serif;
        animation:mw-popover-in 150ms ease;
        max-width:calc(100vw - 16px);
        flex-wrap:wrap;
      `;

      // Position above the element
      const rect = target.getBoundingClientRect();
      toolbar.style.top = `${Math.max(4, rect.top - 44)}px`;
      toolbar.style.left = `${rect.left + rect.width / 2}px`;
      toolbar.style.transform = "translateX(-50%)";

      const computed = window.getComputedStyle(target);
      let currentSize = Math.round(parseFloat(computed.fontSize));
      const currentWeight = parseInt(computed.fontWeight) || 400;
      const currentAlign = computed.textAlign || "left";

      // Font size controls
      const sizeDown = fmtBtn("−", "Decrease size (Ctrl+[)", () => {
        currentSize = Math.max(8, currentSize - 1);
        target.style.fontSize = `${currentSize}px`;
        sizeLabel.textContent = `${currentSize}`;
      });
      const sizeLabel = document.createElement("span");
      sizeLabel.textContent = `${currentSize}`;
      sizeLabel.style.cssText = "font-size:10px;color:#374151;min-width:20px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;";
      const sizeUp = fmtBtn("+", "Increase size (Ctrl+])", () => {
        currentSize = Math.min(120, currentSize + 1);
        target.style.fontSize = `${currentSize}px`;
        sizeLabel.textContent = `${currentSize}`;
      });
      toolbar.appendChild(sizeDown);
      toolbar.appendChild(sizeLabel);
      toolbar.appendChild(sizeUp);

      toolbar.appendChild(fmtDivider());

      // Bold toggle
      const boldBtn = fmtBtn("B", "Bold (Ctrl+B)", () => {
        const isBold = parseInt(target.style.fontWeight || computed.fontWeight) >= 700;
        target.style.fontWeight = isBold ? "400" : "700";
        updateToggle(boldBtn, !isBold);
      });
      boldBtn.style.fontWeight = "700";
      updateToggle(boldBtn, currentWeight >= 700);
      toolbar.appendChild(boldBtn);

      // Italic toggle
      const isItalic = computed.fontStyle === "italic" || target.style.fontStyle === "italic";
      const italicBtn = fmtBtn("I", "Italic (Ctrl+I)", () => {
        const nowItalic = target.style.fontStyle === "italic";
        target.style.fontStyle = nowItalic ? "normal" : "italic";
        updateToggle(italicBtn, !nowItalic);
      });
      italicBtn.style.fontStyle = "italic";
      updateToggle(italicBtn, isItalic);
      toolbar.appendChild(italicBtn);

      // Underline toggle
      const hasUnderline = computed.textDecorationLine.includes("underline") || target.style.textDecorationLine === "underline";
      const underlineBtn = fmtBtn("U", "Underline (Ctrl+U)", () => {
        const nowUnderline = target.style.textDecorationLine === "underline";
        target.style.textDecorationLine = nowUnderline ? "none" : "underline";
        updateToggle(underlineBtn, !nowUnderline);
      });
      underlineBtn.style.textDecoration = "underline";
      updateToggle(underlineBtn, hasUnderline);
      toolbar.appendChild(underlineBtn);

      // Strikethrough toggle
      const hasStrike = computed.textDecorationLine.includes("line-through") || target.style.textDecorationLine === "line-through";
      const strikeBtn = fmtBtn("S", "Strikethrough", () => {
        const nowStrike = target.style.textDecorationLine === "line-through";
        target.style.textDecorationLine = nowStrike ? "none" : "line-through";
        updateToggle(strikeBtn, !nowStrike);
      });
      strikeBtn.style.textDecoration = "line-through";
      updateToggle(strikeBtn, hasStrike);
      toolbar.appendChild(strikeBtn);

      toolbar.appendChild(fmtDivider());

      // Text alignment
      const alignments = [
        { value: "left", icon: "M3 6h18M3 12h10M3 18h14" },
        { value: "center", icon: "M3 6h18M7 12h10M5 18h14" },
        { value: "right", icon: "M3 6h18M11 12h10M7 18h14" },
      ];
      alignments.forEach((a) => {
        const btn = document.createElement("button");
        btn.tabIndex = -1;
        btn.title = `Align ${a.value}`;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${a.icon}"/></svg>`;
        btn.style.cssText = `
          width:28px;height:28px;border:none;border-radius:4px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;padding:0;
          background:${currentAlign === a.value ? "#eef2ff" : "transparent"};
          color:${currentAlign === a.value ? "#4f46e5" : "#374151"};
          transition:background 100ms;
        `;
        btn.onmouseenter = () => { if (currentAlign !== a.value) btn.style.background = "#f3f4f6"; };
        btn.onmouseleave = () => { if (currentAlign !== a.value) btn.style.background = "transparent"; };
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => {
          target.style.textAlign = a.value;
          const allBtns = toolbar.querySelectorAll("[data-align]");
          allBtns.forEach((b) => {
            (b as HTMLElement).style.background = "transparent";
            (b as HTMLElement).style.color = "#374151";
          });
          btn.style.background = "#eef2ff";
          btn.style.color = "#4f46e5";
        };
        btn.setAttribute("data-align", a.value);
        toolbar.appendChild(btn);
      });

      toolbar.appendChild(fmtDivider());

      // Text color
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = rgbToHex(computed.color) || "#000000";
      colorInput.title = "Text color";
      colorInput.style.cssText = "width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;padding:0;cursor:pointer;";
      colorInput.onmousedown = (e) => e.stopPropagation();
      colorInput.oninput = () => {
        target.style.color = colorInput.value;
      };
      toolbar.appendChild(colorInput);

      // Highlight / background color
      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = rgbToHex(computed.backgroundColor) || "#ffffff";
      bgInput.title = "Highlight color";
      bgInput.style.cssText = "width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;padding:0;cursor:pointer;margin-left:2px;background:linear-gradient(135deg,#fef08a,#fbbf24);";
      bgInput.onmousedown = (e) => e.stopPropagation();
      bgInput.oninput = () => {
        target.style.backgroundColor = bgInput.value;
      };
      toolbar.appendChild(bgInput);

      toolbar.appendChild(fmtDivider());

      // Line height control - compact dropdown
      const lhSelect = document.createElement("select");
      lhSelect.title = "Line height";
      const currentLH = computed.lineHeight === "normal" ? "1.5" : (parseFloat(computed.lineHeight) / parseFloat(computed.fontSize)).toFixed(1);
      const lhOptions = ["1.0", "1.2", "1.4", "1.5", "1.6", "1.8", "2.0", "2.5"];
      lhOptions.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        if (v === currentLH) opt.selected = true;
        lhSelect.appendChild(opt);
      });
      lhSelect.style.cssText = "width:42px;height:28px;border:1px solid #e5e7eb;border-radius:4px;font-size:10px;padding:0 2px;cursor:pointer;background:#f9fafb;color:#374151;text-align:center;appearance:none;";
      lhSelect.onmousedown = (e) => e.stopPropagation();
      lhSelect.onchange = () => {
        target.style.lineHeight = lhSelect.value;
      };
      const lhWrapper = document.createElement("div");
      lhWrapper.title = "Line height";
      lhWrapper.style.cssText = "display:flex;align-items:center;gap:2px;";
      const lhIcon = document.createElement("span");
      lhIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>`;
      lhWrapper.appendChild(lhIcon);
      lhWrapper.appendChild(lhSelect);
      toolbar.appendChild(lhWrapper);

      // Letter spacing control
      const lsSelect = document.createElement("select");
      lsSelect.title = "Letter spacing";
      const currentLS = computed.letterSpacing === "normal" ? "0" : parseFloat(computed.letterSpacing).toFixed(0);
      const lsOptions = ["-2", "-1", "0", "0.5", "1", "2", "3", "4", "6"];
      lsOptions.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = `${v}px`;
        if (v === currentLS) opt.selected = true;
        lsSelect.appendChild(opt);
      });
      lsSelect.style.cssText = "width:48px;height:28px;border:1px solid #e5e7eb;border-radius:4px;font-size:10px;padding:0 2px;cursor:pointer;background:#f9fafb;color:#374151;text-align:center;appearance:none;";
      lsSelect.onmousedown = (e) => e.stopPropagation();
      lsSelect.onchange = () => {
        target.style.letterSpacing = `${lsSelect.value}px`;
      };
      const lsWrapper = document.createElement("div");
      lsWrapper.title = "Letter spacing";
      lsWrapper.style.cssText = "display:flex;align-items:center;gap:2px;";
      const lsIcon = document.createElement("span");
      lsIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round"><path d="M7 8L3 12l4 4M17 8l4 4-4 4M14 4l-4 16"/></svg>`;
      lsWrapper.appendChild(lsIcon);
      lsWrapper.appendChild(lsSelect);
      toolbar.appendChild(lsWrapper);

      toolbar.appendChild(fmtDivider());

      // Text transform buttons
      const transforms: { value: string; label: string; title: string }[] = [
        { value: "uppercase", label: "AA", title: "UPPERCASE" },
        { value: "capitalize", label: "Aa", title: "Capitalize" },
        { value: "lowercase", label: "aa", title: "lowercase" },
        { value: "none", label: "—", title: "Normal" },
      ];
      const currentTransform = computed.textTransform || "none";
      transforms.forEach((t) => {
        const btn = fmtBtn(t.label, t.title, () => {
          target.style.textTransform = t.value;
          toolbar.querySelectorAll("[data-transform]").forEach((b) => updateToggle(b as HTMLButtonElement, false));
          updateToggle(btn, true);
        });
        btn.style.fontSize = "9px";
        btn.style.letterSpacing = "0.5px";
        btn.setAttribute("data-transform", t.value);
        updateToggle(btn, currentTransform === t.value);
        toolbar.appendChild(btn);
      });

      // Handle keyboard shortcuts while editing
      target.addEventListener("keydown", (e: Event) => {
        const ke = e as KeyboardEvent;
        if ((ke.ctrlKey || ke.metaKey) && ke.key === "b") {
          ke.preventDefault();
          boldBtn.click();
        }
        if ((ke.ctrlKey || ke.metaKey) && ke.key === "i") {
          ke.preventDefault();
          italicBtn.click();
        }
        if ((ke.ctrlKey || ke.metaKey) && ke.key === "u") {
          ke.preventDefault();
          underlineBtn.click();
        }
        if ((ke.ctrlKey || ke.metaKey) && ke.key === "[") {
          ke.preventDefault();
          sizeDown.click();
        }
        if ((ke.ctrlKey || ke.metaKey) && ke.key === "]") {
          ke.preventDefault();
          sizeUp.click();
        }
      });

      document.body.appendChild(toolbar);

      // Reposition if off screen
      requestAnimationFrame(() => {
        const tRect = toolbar.getBoundingClientRect();
        if (tRect.right > window.innerWidth - 8) {
          toolbar.style.left = `${window.innerWidth - tRect.width - 8}px`;
          toolbar.style.transform = "none";
        }
        if (tRect.left < 8) {
          toolbar.style.left = "8px";
          toolbar.style.transform = "none";
        }
      });

      // Persist additional styles on blur
      const origBlurStyles = { sectionId, propPath };
      target.setAttribute("data-fmt-section", origBlurStyles.sectionId);
      target.setAttribute("data-fmt-prop", origBlurStyles.propPath);

      return toolbar;
    }

    function updateToggle(btn: HTMLButtonElement, active: boolean) {
      btn.style.background = active ? "#eef2ff" : "transparent";
      btn.style.color = active ? "#4f46e5" : "#374151";
    }

    function fmtBtn(label: string, title: string, onClick: () => void): HTMLButtonElement {
      const btn = document.createElement("button");
      btn.tabIndex = -1;
      btn.textContent = label;
      btn.title = title;
      btn.style.cssText = `
        width:28px;height:28px;border:none;border-radius:4px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;padding:0;
        background:transparent;color:#374151;font-size:13px;font-weight:500;
        font-family:system-ui,-apple-system,sans-serif;
        transition:background 100ms;
      `;
      btn.onmouseenter = () => { btn.style.background = "#f3f4f6"; };
      btn.onmouseleave = () => { if (btn.style.background !== "rgb(238, 242, 255)") btn.style.background = "transparent"; };
      btn.onmousedown = (e) => e.preventDefault();
      btn.onclick = onClick;
      return btn;
    }

    function fmtDivider(): HTMLElement {
      const d = document.createElement("div");
      d.style.cssText = "width:1px;height:18px;background:#e5e7eb;margin:0 1px;";
      return d;
    }

    // Add cursor hints for editable elements
    function handleMouseOver(e: Event) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-visual-ui]")) return;

      const sectionEl = target.closest("[data-section-id]");
      if (!sectionEl) return;

      // Icon hover
      const iconEl = target.closest("[data-editable-icon]") as HTMLElement;
      if (iconEl) {
        iconEl.style.cursor = "pointer";
        iconEl.style.outline = "2px dashed var(--primary, #6366f1)";
        iconEl.style.outlineOffset = "2px";
        iconEl.style.borderRadius = "50%";
        iconEl.title = "Click to change icon";
        return;
      }

      // Image hover
      const imageEl = target.closest("[data-editable-image]") as HTMLElement;
      if (imageEl) {
        imageEl.style.cursor = "pointer";
        imageEl.style.outline = "2px dashed var(--primary, #6366f1)";
        imageEl.style.outlineOffset = "2px";
        imageEl.title = "Click to change image";
        return;
      }

      // Link hover
      const linkEl = target.closest("[data-editable-link]") as HTMLElement;
      if (linkEl) {
        linkEl.style.cursor = "pointer";
        linkEl.style.outline = "2px dashed var(--primary, #6366f1)";
        linkEl.style.outlineOffset = "2px";
        linkEl.style.borderRadius = "4px";
        linkEl.title = "Click to edit link";
        return;
      }

      // Text with data-editable-text
      const editableText = target.closest("[data-editable-text]") as HTMLElement;
      if (editableText && editableText.contentEditable !== "true") {
        editableText.style.cursor = "text";
        editableText.style.outline = "1px dashed rgba(99, 102, 241, 0.5)";
        editableText.style.outlineOffset = "2px";
        editableText.style.borderRadius = "2px";
        editableText.title = "Click to edit";
        return;
      }

      // Legacy heading/subheading
      const tag = target.tagName.toLowerCase();
      if (!["h1", "h2", "h3", "h4", "p"].includes(tag)) return;

      const sectionId = sectionEl.getAttribute("data-section-id");
      const section = sections.find((s) => s.id === sectionId);
      if (!section || !EDITABLE_PROP_MAP[section.type]) return;

      target.style.cursor = "text";
      target.title = "Click to edit";
    }

    function handleMouseOut(e: Event) {
      const target = e.target as HTMLElement;

      // Clean up icon hover
      const iconEl = target.closest("[data-editable-icon]") as HTMLElement;
      if (iconEl) {
        iconEl.style.cursor = "";
        iconEl.style.outline = "";
        iconEl.style.outlineOffset = "";
        iconEl.style.borderRadius = "";
        iconEl.title = "";
        return;
      }

      // Clean up image hover
      const imageEl = target.closest("[data-editable-image]") as HTMLElement;
      if (imageEl) {
        imageEl.style.cursor = "";
        imageEl.style.outline = "";
        imageEl.style.outlineOffset = "";
        imageEl.title = "";
        return;
      }

      // Clean up link hover
      const linkEl = target.closest("[data-editable-link]") as HTMLElement;
      if (linkEl) {
        linkEl.style.cursor = "";
        linkEl.style.outline = "";
        linkEl.style.outlineOffset = "";
        linkEl.style.borderRadius = "";
        linkEl.title = "";
        return;
      }

      // Clean up text hover
      const editableText = target.closest("[data-editable-text]") as HTMLElement;
      if (editableText && editableText.contentEditable !== "true") {
        editableText.style.cursor = "";
        editableText.style.outline = "";
        editableText.style.outlineOffset = "";
        editableText.style.borderRadius = "";
        editableText.title = "";
        return;
      }

      if (target.contentEditable !== "true") {
        target.style.cursor = "";
        target.title = "";
      }
    }

    portalTarget.addEventListener("click", startEditing, true);
    portalTarget.addEventListener("dblclick", startEditing, true);
    portalTarget.addEventListener("mouseover", handleMouseOver);
    portalTarget.addEventListener("mouseout", handleMouseOut);

    return () => {
      portalTarget.removeEventListener("click", startEditing, true);
      portalTarget.removeEventListener("dblclick", startEditing, true);
      portalTarget.removeEventListener("mouseover", handleMouseOver);
      portalTarget.removeEventListener("mouseout", handleMouseOut);

      if (activeEditRef.current) {
        activeEditRef.current.contentEditable = "false";
        activeEditRef.current.style.outline = "";
        activeEditRef.current = null;
      }
    };
  }, [visualMode, portalTarget, sections, selectedSectionId, onOpenIconPicker, onOpenImageEdit, onOpenLinkEditor]);
}

function getPropForElement(element: HTMLElement, sectionType: string): string | null {
  const map = EDITABLE_PROP_MAP[sectionType];
  if (!map) return null;

  const tag = element.tagName.toLowerCase();

  if (["h1", "h2", "h3"].includes(tag)) {
    return map.heading || null;
  }

  if (tag === "p" || tag === "h4") {
    return map.subheading || null;
  }

  return null;
}

// ─── Inline Icon Picker ─────────────────────────────

const INLINE_ICON_LIST = [
  "Star", "Heart", "Users", "Shield", "Zap", "Globe", "Mail", "Phone", "MapPin", "Clock",
  "Calendar", "Camera", "Image", "Video", "Music", "Headphones",
  "BookOpen", "FileText", "Folder", "Archive", "Download", "Upload", "Link", "Share2",
  "Send", "MessageCircle", "MessageSquare", "Bell", "BellRing", "AlertCircle", "Info",
  "HelpCircle", "CheckCircle", "XCircle", "Award", "Trophy", "Target", "Flag",
  "Bookmark", "Tag", "Hash", "AtSign", "Search", "Filter", "Settings", "Sliders",
  "BarChart3", "PieChart", "TrendingUp", "Activity",
  "Home", "Building", "Store", "Briefcase", "GraduationCap", "Lightbulb", "Palette",
  "Pencil", "Code", "Terminal", "Database", "Server", "Cloud", "Wifi",
  "Lock", "Unlock", "Key", "Eye", "ShieldCheck",
  "CreditCard", "DollarSign", "Wallet", "ShoppingCart", "Package",
  "Truck", "Plane", "Car", "Compass", "Map",
  "Sun", "Moon", "Flame", "Leaf", "TreePine", "Mountain",
  "Rocket", "Sparkles", "Crown", "Gem", "Gift", "PartyPopper",
  "ThumbsUp", "SmilePlus", "Handshake", "UsersRound", "UserPlus", "CircleUser",
  "Play", "Pause", "Check", "Plus", "Minus",
  "Cpu", "Smartphone", "Monitor",
  "Utensils", "Coffee", "Wine",
];

interface IconPickerState {
  target: HTMLElement;
  sectionId: string;
  propPath: string;
  currentIcon: string;
  rect: DOMRect;
}

export function InlineIconPicker({
  state,
  onSelect,
  onClose,
}: {
  state: IconPickerState;
  onSelect: (sectionId: string, propPath: string, icon: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(state.currentIcon);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Position the picker near the icon
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const r = state.rect;
    let x = r.left + r.width / 2 - 160; // center the 320px picker
    let y = r.bottom + 8;

    // Keep within viewport
    if (x + 320 > window.innerWidth) x = window.innerWidth - 328;
    if (x < 8) x = 8;
    if (y + 340 > window.innerHeight) y = r.top - 348;
    if (y < 8) y = 8;

    setPos({ x, y });
  }, [state.rect]);

  // Focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose]);

  const filtered = search
    ? INLINE_ICON_LIST.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : INLINE_ICON_LIST;

  return (
    <div
      ref={ref}
      data-visual-ui="icon-picker"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 10001,
        width: 320,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: 12,
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "mw-icon-picker-in 150ms ease",
      }}
    >
      <style>{`
        @keyframes mw-icon-picker-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Choose Icon</span>
        <button
          onClick={onClose}
          style={{
            width: 20, height: 20, border: "none", background: "transparent",
            color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 4, fontSize: 16, lineHeight: 1, padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
          <SvgIcon d="M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5zM16 16l4.5 4.5" size={14} />
        </div>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          style={{
            width: "100%",
            height: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            paddingLeft: 28,
            paddingRight: 8,
            fontSize: 12,
            outline: "none",
            background: "#f9fafb",
            color: "#374151",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.15)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {/* Icon Grid */}
      <div style={{ maxHeight: 240, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
        {filtered.map((name) => (
          <IconGridButton
            key={name}
            name={name}
            isSelected={selected === name}
            onClick={() => {
              setSelected(name);
              onSelect(state.sectionId, state.propPath, name);
              onClose();
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "16px 0", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
            No icons found
          </div>
        )}
      </div>
    </div>
  );
}

// Render individual icon buttons using Lucide React directly
function IconGridButton({ name, isSelected, onClick }: { name: string; isSelected: boolean; onClick: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;

  return (
    <button
      type="button"
      title={name}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        background: isSelected ? "#6366f1" : "transparent",
        color: isSelected ? "#fff" : "#6b7280",
        transition: "background 100ms, color 100ms",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.color = "#374151";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}

// ─── Visual Mode Styles ─────────────────────────────

export function VisualModeStyles() {
  return (
    <style>{`
      [data-visual-mode] [data-section-id] {
        position: relative;
        transition: outline-color 150ms ease;
      }
      [data-visual-mode] [data-section-id][contenteditable="true"] {
        cursor: text;
      }
      [data-visual-mode] [data-section-id]:hover {
        z-index: 1;
      }
      [data-visual-mode] [data-editable-icon]:hover {
        transform: scale(1.1);
        transition: transform 150ms ease, outline 150ms ease;
      }
      [data-visual-mode] [data-editable-text]:hover {
        outline: 1px dashed rgba(99,102,241,0.4);
        outline-offset: 2px;
        border-radius: 2px;
      }
      [data-visual-mode] [data-editable-image] {
        position: relative;
        transition: outline 150ms ease;
      }
      [data-visual-mode] [data-editable-image]:hover {
        outline: 2px dashed rgba(99,102,241,0.5);
        outline-offset: -2px;
        cursor: pointer;
      }
      [data-visual-mode] [data-editable-image]:hover::after {
        content: "Click to change image";
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: #fff;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
      }
      [data-visual-mode] [data-array-item] {
        transition: outline 150ms ease;
      }
      [data-visual-mode] [data-draggable-bg] {
        position: relative;
      }
      [data-visual-mode] [data-editable-link] {
        position: relative;
        transition: outline 150ms ease;
      }
      [data-visual-mode] [data-editable-link]:hover {
        outline: 2px dashed rgba(99,102,241,0.5);
        outline-offset: 2px;
        border-radius: 4px;
        cursor: pointer !important;
      }
      [data-visual-mode] [data-editable-link]:hover::after {
        content: "Click to edit link";
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: #fff;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
      }
      [data-visual-mode] [data-editable-icon] {
        cursor: pointer;
        transition: transform 150ms ease, outline 150ms ease;
      }
      [data-visual-mode] [data-editable-icon]:hover::after {
        content: "Click to change icon";
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: #fff;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
      }
      @keyframes mw-visual-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      @keyframes mw-popover-in {
        from { opacity: 0; transform: translateY(-4px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .mw-drag-active {
        cursor: move !important;
      }
      .mw-drag-active * {
        cursor: move !important;
        pointer-events: none !important;
      }
      [data-visual-mode] [data-section-id] .mw-spacing-handle {
        position: absolute;
        left: 0;
        right: 0;
        height: 8px;
        cursor: ns-resize;
        z-index: 60;
        opacity: 0;
        transition: opacity 150ms;
      }
      [data-visual-mode] [data-section-id]:hover .mw-spacing-handle,
      [data-visual-mode] [data-section-id] .mw-spacing-handle:hover {
        opacity: 1;
      }
      [data-visual-mode] [data-section-id] .mw-spacing-handle::after {
        content: "";
        position: absolute;
        left: 33%;
        right: 33%;
        height: 3px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--primary, #6366f1);
        border-radius: 2px;
        opacity: 0;
        transition: opacity 150ms;
      }
      [data-visual-mode] [data-section-id] .mw-spacing-handle:hover::after {
        opacity: 1;
      }
      /* Spacer section visual indicator */
      [data-visual-mode] [data-editable-spacer] {
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 4px,
          rgba(99,102,241,0.04) 4px,
          rgba(99,102,241,0.04) 8px
        );
        border: 1px dashed rgba(99,102,241,0.2);
        border-radius: 4px;
        transition: background 150ms;
      }
      [data-visual-mode] [data-editable-spacer]:hover {
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 4px,
          rgba(99,102,241,0.08) 4px,
          rgba(99,102,241,0.08) 8px
        );
        border-color: rgba(99,102,241,0.4);
      }
      /* Button elements in visual mode should show pointer */
      [data-visual-mode] [data-editable-text] {
        cursor: text !important;
      }
      [data-visual-mode] [data-editable-image] {
        cursor: pointer !important;
      }
      [data-visual-mode] [data-editable-link] {
        cursor: pointer !important;
      }
      /* Array item hover highlight */
      [data-visual-mode] [data-array-item]:hover {
        outline: 1px dashed rgba(99,102,241,0.3);
        outline-offset: -1px;
        border-radius: 4px;
      }
      /* Smooth transitions for content editable */
      [data-visual-mode] [contenteditable="true"] {
        outline: 2px solid var(--primary, #6366f1) !important;
        outline-offset: 4px !important;
        border-radius: 2px !important;
        min-width: 20px;
        min-height: 1em;
      }
      @keyframes mw-ctx-fade {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `}</style>
  );
}

// ─── Background Image Drag Repositioning ────────────

export function useBackgroundDrag(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!visualMode || !portalTarget) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startPosX = 50;
    let startPosY = 50;
    let currentTarget: HTMLElement | null = null;
    let bgDragBtn: HTMLElement | null = null;

    function showBgDragButton(sectionEl: HTMLElement) {
      if (bgDragBtn) bgDragBtn.remove();

      const btn = document.createElement("div");
      btn.setAttribute("data-visual-ui", "bg-drag");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg><span style="margin-left:4px;font-size:10px;font-weight:600">REPOSITION</span>`;
      btn.style.cssText = `
        position:absolute; bottom:8px; right:8px; z-index:60;
        display:flex; align-items:center; padding:4px 10px;
        background:rgba(0,0,0,0.75); color:#fff; border-radius:6px;
        cursor:move; font-family:system-ui,-apple-system,sans-serif;
        backdrop-filter:blur(8px); user-select:none;
        animation:mw-popover-in 150ms ease;
      `;
      btn.title = "Drag to reposition background image";

      btn.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentTarget = sectionEl;
        setDragging(true);

        // Parse current position
        const pos = sectionEl.getAttribute("data-bg-position") || "center";
        const match = pos.match(/(\d+)%\s+(\d+)%/);
        if (match) {
          startPosX = parseFloat(match[1]);
          startPosY = parseFloat(match[2]);
        } else {
          startPosX = 50;
          startPosY = 50;
        }

        sectionEl.classList.add("mw-drag-active");
        btn.style.background = "rgba(99,102,241,0.9)";
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg><span style="margin-left:4px;font-size:10px;font-weight:600">DRAGGING...</span>`;
      };

      sectionEl.appendChild(btn);
      bgDragBtn = btn;
    }

    function removeBgDragButton() {
      if (bgDragBtn) {
        bgDragBtn.remove();
        bgDragBtn = null;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging || !currentTarget) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = currentTarget.getBoundingClientRect();

      // Scale movement relative to element size, invert because moving mouse right
      // should shift the visible window right (decrease bg-position X)
      const newX = Math.max(0, Math.min(100, startPosX - (dx / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, startPosY - (dy / rect.height) * 100));

      const posStr = `${Math.round(newX)}% ${Math.round(newY)}%`;
      currentTarget.style.backgroundPosition = posStr;
      currentTarget.setAttribute("data-bg-position", posStr);
    }

    function handleMouseUp() {
      if (!isDragging || !currentTarget) return;
      isDragging = false;
      currentTarget.classList.remove("mw-drag-active");
      setDragging(false);

      const sectionEl = currentTarget.closest("[data-section-id]") || currentTarget;
      const sectionId = sectionEl.getAttribute("data-section-id");
      const pos = currentTarget.getAttribute("data-bg-position") || "50% 50%";

      if (sectionId) {
        sendToParent("MEMBERWISE_BG_POSITION", { sectionId, position: pos });
      }

      currentTarget = null;
      removeBgDragButton();
    }

    function handleSectionHover(e: Event) {
      if (isDragging) return;
      const target = e.target as HTMLElement;
      const sectionEl = target.closest("[data-section-id]");
      if (!sectionEl) return;

      const sectionId = sectionEl.getAttribute("data-section-id");
      if (sectionId !== selectedSectionId) return;

      // Check for draggable-bg within this section (could be section itself or inner element)
      const bgEl = sectionEl.querySelector("[data-draggable-bg]") as HTMLElement || (sectionEl.hasAttribute("data-draggable-bg") ? sectionEl : null);
      if (!bgEl) return;

      // Only show if not already showing
      if (!bgDragBtn || !bgEl.contains(bgDragBtn)) {
        showBgDragButton(bgEl);
      }
    }

    function handleSectionLeave(e: Event) {
      if (isDragging) return;
      const relatedTarget = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (bgDragBtn && relatedTarget && bgDragBtn.contains(relatedTarget)) return;
      const sectionEl = (e.target as HTMLElement).closest("[data-section-id]");
      if (sectionEl && relatedTarget && sectionEl.contains(relatedTarget)) return;
      removeBgDragButton();
    }

    portalTarget.addEventListener("mouseover", handleSectionHover);
    portalTarget.addEventListener("mouseout", handleSectionLeave);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      portalTarget.removeEventListener("mouseover", handleSectionHover);
      portalTarget.removeEventListener("mouseout", handleSectionLeave);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      removeBgDragButton();
    };
  }, [visualMode, portalTarget, selectedSectionId]);

  return { dragging };
}

// ─── Inline Link Editor Popover ─────────────────────

interface LinkEditorState {
  sectionId: string;
  linkPath: string;
  textPath: string;
  currentUrl: string;
  currentText: string;
  rect: DOMRect;
}

export function InlineLinkEditor({
  state,
  onSave,
  onClose,
}: {
  state: LinkEditorState;
  onSave: (sectionId: string, updates: { propPath: string; value: string }[]) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(state.currentUrl);
  const [text, setText] = useState(state.currentText);
  const [newTab, setNewTab] = useState(false);
  const [variant, setVariant] = useState<"default" | "outline" | "ghost" | "link">("default");
  const ref = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const r = state.rect;
    let x = r.left;
    let y = r.bottom + 8;
    if (x + 300 > window.innerWidth) x = window.innerWidth - 308;
    if (x < 8) x = 8;
    if (y + 160 > window.innerHeight) y = r.top - 168;
    if (y < 8) y = 8;
    setPos({ x, y });
  }, [state.rect]);

  useEffect(() => {
    setTimeout(() => urlRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose]);

  function handleSave() {
    const updates: { propPath: string; value: string }[] = [];
    if (url !== state.currentUrl) updates.push({ propPath: state.linkPath, value: url });
    if (text !== state.currentText) updates.push({ propPath: state.textPath, value: text });
    // Add target and variant as sibling props
    const basePath = state.linkPath.replace(/Link$/, "");
    if (newTab) updates.push({ propPath: `${basePath}Target`, value: "_blank" });
    if (variant !== "default") updates.push({ propPath: `${basePath}Variant`, value: variant });
    if (updates.length > 0) onSave(state.sectionId, updates);
    onClose();
  }

  return (
    <div
      ref={ref}
      data-visual-ui="link-editor"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 10001,
        width: 300,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: 12,
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "mw-popover-in 150ms ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SvgIcon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" size={14} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Edit Link</span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 20, height: 20, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 16, lineHeight: 1, padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >×</button>
      </div>

      {/* Text field */}
      <label style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 3 }}>Button Text</label>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: 32, border: "1px solid #e5e7eb", borderRadius: 6, paddingLeft: 8, paddingRight: 8, fontSize: 13, outline: "none", background: "#f9fafb", color: "#374151", boxSizing: "border-box", marginBottom: 8 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
      />

      {/* URL field */}
      <label style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 3 }}>URL</label>
      <input
        ref={urlRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        style={{ width: "100%", height: 32, border: "1px solid #e5e7eb", borderRadius: 6, paddingLeft: 8, paddingRight: 8, fontSize: 13, outline: "none", background: "#f9fafb", color: "#374151", boxSizing: "border-box", marginBottom: 8 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
      />

      {/* Open in new tab */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", marginBottom: 8, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={newTab}
          onChange={(e) => setNewTab(e.target.checked)}
          style={{ width: 14, height: 14, accentColor: "#6366f1" }}
        />
        Open in new tab
      </label>

      {/* Button style variant */}
      <label style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 3 }}>Style</label>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {(["default", "outline", "ghost", "link"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            style={{
              flex: 1, height: 28, border: "1px solid #e5e7eb", borderRadius: 5,
              fontSize: 10, fontWeight: 500, cursor: "pointer",
              background: variant === v ? "#eef2ff" : "#f9fafb",
              color: variant === v ? "#4f46e5" : "#374151",
              borderColor: variant === v ? "#6366f1" : "#e5e7eb",
              textTransform: "capitalize", transition: "all 100ms",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          width: "100%", height: 32, border: "none", borderRadius: 6,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "opacity 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        Save Link
      </button>
    </div>
  );
}

// ─── Section Spacing Drag Handles ───────────────────

export function useSpacingDrag(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget) return;

    let isDragging = false;
    let dragEdge: "top" | "bottom" = "top";
    let startY = 0;
    let startPadding = 0;
    let currentSection: HTMLElement | null = null;
    let label: HTMLElement | null = null;

    // Inject spacing handles into selected section
    const handles: HTMLElement[] = [];

    function addHandles() {
      removeHandles();
      if (!selectedSectionId) return;

      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      // Find the actual section element (could be inside section-wrapper)
      const innerSection = sectionEl.querySelector("section") || sectionEl;

      ["top", "bottom"].forEach((edge) => {
        const handle = document.createElement("div");
        handle.className = "mw-spacing-handle";
        handle.setAttribute("data-visual-ui", "spacing-handle");
        handle.style.cssText = edge === "top" ? "top:-4px;" : "bottom:-4px;";
        handle.title = `Drag to adjust ${edge} padding`;

        handle.onmousedown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          dragEdge = edge as "top" | "bottom";
          startY = e.clientY;
          currentSection = innerSection as HTMLElement;

          const computed = window.getComputedStyle(currentSection);
          startPadding = parseFloat(edge === "top" ? computed.paddingTop : computed.paddingBottom) || 0;

          // Show label
          label = document.createElement("div");
          label.setAttribute("data-visual-ui", "spacing-label");
          label.style.cssText = `
            position:fixed; left:50%; transform:translateX(-50%);
            ${edge === "top" ? "top:8px" : "bottom:8px"};
            z-index:10002; background:rgba(0,0,0,0.8); color:#fff;
            padding:3px 10px; border-radius:4px; font-size:11px;
            font-weight:600; font-family:system-ui,-apple-system,sans-serif;
            pointer-events:none; backdrop-filter:blur(4px);
          `;
          document.body.appendChild(label);
        };

        sectionEl.appendChild(handle);
        handles.push(handle);
      });
    }

    function removeHandles() {
      handles.forEach((h) => h.remove());
      handles.length = 0;
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging || !currentSection) return;
      const dy = e.clientY - startY;
      const multiplier = dragEdge === "top" ? -1 : 1;
      const newPadding = Math.max(0, Math.round(startPadding + dy * multiplier));

      if (dragEdge === "top") {
        currentSection.style.paddingTop = `${newPadding}px`;
      } else {
        currentSection.style.paddingBottom = `${newPadding}px`;
      }

      if (label) {
        label.textContent = `${dragEdge === "top" ? "Top" : "Bottom"} padding: ${newPadding}px`;
      }
    }

    function handleMouseUp() {
      if (!isDragging || !currentSection) return;
      isDragging = false;

      const computed = window.getComputedStyle(currentSection);
      const paddingTop = Math.round(parseFloat(computed.paddingTop) || 0);
      const paddingBottom = Math.round(parseFloat(computed.paddingBottom) || 0);

      if (selectedSectionId) {
        sendToParent("MEMBERWISE_SPACING_EDIT", {
          sectionId: selectedSectionId,
          paddingTop: `${paddingTop}px`,
          paddingBottom: `${paddingBottom}px`,
        });
      }

      if (label) {
        label.remove();
        label = null;
      }
      currentSection = null;
    }

    addHandles();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      removeHandles();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (label) label.remove();
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Section Style Quick Panel ──────────────────────
// Floating panel that appears next to selected section for quick style edits

interface SectionStyleState {
  sectionId: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  boxShadow: string;
  opacity: string;
  rect: DOMRect;
}

export function SectionStylePanel({
  state,
  onUpdate,
  onClose,
}: {
  state: SectionStyleState;
  onUpdate: (sectionId: string, updates: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [bgColor, setBgColor] = useState(state.backgroundColor || "");
  const [txtColor, setTxtColor] = useState(state.textColor || "");
  const [radius, setRadius] = useState(state.borderRadius || "0");
  const [shadow, setShadow] = useState(state.boxShadow || "none");
  const [opacity, setOpacity] = useState(state.opacity || "100");
  const ref = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const r = state.rect;
    // Position to the right of the section, or left if no space
    let x = r.right + 12;
    let y = r.top;
    if (x + 220 > window.innerWidth) x = r.left - 232;
    if (x < 8) x = 8;
    if (y + 340 > window.innerHeight) y = window.innerHeight - 348;
    if (y < 8) y = 8;
    setPos({ x, y });
  }, [state.rect]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-visual-ui]")) {
        onClose();
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose]);

  function emitUpdate(key: string, value: string) {
    onUpdate(state.sectionId, { [key]: value });
  }

  const SHADOW_OPTIONS = [
    { value: "none", label: "None" },
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "Extra Large" },
    { value: "2xl", label: "2XL" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 28, border: "1px solid #e5e7eb", borderRadius: 5,
    paddingLeft: 8, paddingRight: 8, fontSize: 11, outline: "none",
    background: "#f9fafb", color: "#374151", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 2,
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div
      ref={ref}
      data-visual-ui="style-panel"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 10001,
        width: 220,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: 12,
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "mw-popover-in 150ms ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <SvgIcon d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 007.92 12.446A9 9 0 1112 2.992z" size={13} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Section Style</span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 18, height: 18, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 14, lineHeight: 1, padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >×</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Background Color */}
        <div>
          <label style={labelStyle}>Background</label>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type="color"
              value={bgColor || "#ffffff"}
              onChange={(e) => {
                setBgColor(e.target.value);
                emitUpdate("backgroundColor", e.target.value);
              }}
              style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 5, cursor: "pointer", padding: 0 }}
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                emitUpdate("backgroundColor", e.target.value);
              }}
              placeholder="transparent"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label style={labelStyle}>Text Color</label>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type="color"
              value={txtColor || "#000000"}
              onChange={(e) => {
                setTxtColor(e.target.value);
                emitUpdate("textColor", e.target.value);
              }}
              style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 5, cursor: "pointer", padding: 0 }}
            />
            <input
              type="text"
              value={txtColor}
              onChange={(e) => {
                setTxtColor(e.target.value);
                emitUpdate("textColor", e.target.value);
              }}
              placeholder="inherit"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Border Radius */}
        <div>
          <label style={labelStyle}>Border Radius</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="range"
              min="0"
              max="32"
              value={parseInt(radius) || 0}
              onChange={(e) => {
                const v = `${e.target.value}px`;
                setRadius(v);
                emitUpdate("borderRadius", v);
              }}
              style={{ flex: 1, height: 4, accentColor: "#6366f1" }}
            />
            <span style={{ fontSize: 10, color: "#6b7280", minWidth: 32, textAlign: "right" }}>{parseInt(radius) || 0}px</span>
          </div>
        </div>

        {/* Box Shadow */}
        <div>
          <label style={labelStyle}>Shadow</label>
          <select
            value={shadow}
            onChange={(e) => {
              setShadow(e.target.value);
              emitUpdate("boxShadow", e.target.value);
            }}
            style={{ ...inputStyle, paddingRight: 4, appearance: "auto" as const }}
          >
            {SHADOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Opacity */}
        <div>
          <label style={labelStyle}>Opacity</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="range"
              min="10"
              max="100"
              value={parseInt(opacity) || 100}
              onChange={(e) => {
                setOpacity(e.target.value);
                emitUpdate("opacity", e.target.value);
              }}
              style={{ flex: 1, height: 4, accentColor: "#6366f1" }}
            />
            <span style={{ fontSize: 10, color: "#6b7280", minWidth: 28, textAlign: "right" }}>{parseInt(opacity) || 100}%</span>
          </div>
        </div>

        {/* Quick preset buttons */}
        <div>
          <label style={labelStyle}>Quick Presets</label>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[
              { label: "Light", bg: "#ffffff", text: "#111827" },
              { label: "Dark", bg: "#111827", text: "#f9fafb" },
              { label: "Primary", bg: "var(--primary)", text: "var(--primary-foreground)" },
              { label: "Muted", bg: "var(--muted)", text: "var(--foreground)" },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setBgColor(preset.bg);
                  setTxtColor(preset.text);
                  onUpdate(state.sectionId, { backgroundColor: preset.bg, textColor: preset.text });
                }}
                style={{
                  border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 8px",
                  fontSize: 9, fontWeight: 500, cursor: "pointer", background: "#f9fafb",
                  color: "#374151", transition: "all 100ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: preset.bg, border: "1px solid #d1d5db", marginRight: 4, verticalAlign: "middle" }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gradient editor */}
        <GradientEditor
          sectionId={state.sectionId}
          gradient={undefined}
          onUpdate={(sectionId, gradient) => {
            if (gradient) {
              onUpdate(sectionId, { backgroundGradient: JSON.stringify(gradient) });
            } else {
              onUpdate(sectionId, { backgroundGradient: "" });
            }
          }}
        />
      </div>
    </div>
  );
}

// ─── Floating style button (paintbrush) ─────────────

export function useStylePanel(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  const [styleState, setStyleState] = useState<SectionStyleState | null>(null);

  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) {
      setStyleState(null);
      return;
    }

    let styleBtn: HTMLElement | null = null;

    function addStyleButton() {
      removeStyleButton();
      if (!selectedSectionId) return;

      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      const btn = document.createElement("div");
      btn.setAttribute("data-visual-ui", "style-btn");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 007.92 12.446A9 9 0 1112 2.992z"/></svg>`;
      btn.title = "Section styles";
      btn.style.cssText = `
        position:absolute; top:8px; right:80px; z-index:50;
        width:28px; height:28px; display:flex; align-items:center; justify-content:center;
        background:rgba(99,102,241,0.9); color:#fff; border-radius:6px;
        cursor:pointer; backdrop-filter:blur(8px);
        animation:mw-popover-in 150ms ease;
        transition: transform 150ms;
      `;
      btn.onmouseenter = () => { btn.style.transform = "scale(1.1)"; };
      btn.onmouseleave = () => { btn.style.transform = ""; };
      btn.onclick = (e) => {
        e.stopPropagation();
        const innerSection = sectionEl.querySelector("section") || sectionEl;
        const computed = window.getComputedStyle(innerSection);
        setStyleState({
          sectionId: selectedSectionId!,
          backgroundColor: rgbToHex(computed.backgroundColor) || "",
          textColor: rgbToHex(computed.color) || "",
          borderRadius: computed.borderRadius || "0",
          boxShadow: "none",
          opacity: String(Math.round(parseFloat(computed.opacity) * 100)),
          rect: sectionEl.getBoundingClientRect(),
        });
      };

      sectionEl.appendChild(btn);
      styleBtn = btn;
    }

    function removeStyleButton() {
      if (styleBtn) {
        styleBtn.remove();
        styleBtn = null;
      }
    }

    addStyleButton();
    return () => removeStyleButton();
  }, [visualMode, portalTarget, selectedSectionId]);

  return { styleState, closeStylePanel: () => setStyleState(null) };
}

// ─── Dimension Overlay ──────────────────────────────
// Shows padding/height measurements on the selected section

export function useDimensionOverlay(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const overlays: HTMLElement[] = [];

    function showDimensions() {
      removeDimensions();
      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      const innerSection = sectionEl.querySelector("section") || sectionEl;
      const computed = window.getComputedStyle(innerSection);
      const paddingTop = Math.round(parseFloat(computed.paddingTop) || 0);
      const paddingBottom = Math.round(parseFloat(computed.paddingBottom) || 0);
      const height = Math.round(innerSection.getBoundingClientRect().height);

      // Top padding label
      if (paddingTop > 0) {
        const topLabel = createDimLabel(`${paddingTop}px`, "top");
        sectionEl.appendChild(topLabel);
        overlays.push(topLabel);
      }

      // Bottom padding label
      if (paddingBottom > 0) {
        const bottomLabel = createDimLabel(`${paddingBottom}px`, "bottom");
        sectionEl.appendChild(bottomLabel);
        overlays.push(bottomLabel);
      }

      // Height badge (bottom-left)
      const heightBadge = document.createElement("div");
      heightBadge.setAttribute("data-visual-ui", "dim-height");
      heightBadge.textContent = `${height}px`;
      heightBadge.style.cssText = `
        position:absolute; bottom:8px; left:8px; z-index:45;
        background:rgba(0,0,0,0.5); color:#fff; padding:2px 6px;
        border-radius:3px; font-size:9px; font-weight:500;
        font-family:ui-monospace,monospace; pointer-events:none;
        backdrop-filter:blur(4px); letter-spacing:0.02em;
      `;
      sectionEl.appendChild(heightBadge);
      overlays.push(heightBadge);
    }

    function createDimLabel(text: string, position: "top" | "bottom"): HTMLElement {
      const label = document.createElement("div");
      label.setAttribute("data-visual-ui", "dim-label");
      label.style.cssText = `
        position:absolute; ${position}:2px; left:50%; transform:translateX(-50%); z-index:45;
        background:rgba(99,102,241,0.7); color:#fff; padding:1px 6px;
        border-radius:2px; font-size:9px; font-weight:500;
        font-family:ui-monospace,monospace; pointer-events:none;
        white-space:nowrap;
      `;
      label.textContent = text;
      return label;
    }

    function removeDimensions() {
      overlays.forEach((o) => o.remove());
      overlays.length = 0;
    }

    // Show immediately and update on mutations
    showDimensions();
    const observer = new MutationObserver(() => {
      requestAnimationFrame(showDimensions);
    });
    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`);
    if (sectionEl) {
      observer.observe(sectionEl, { attributes: true, subtree: true, attributeFilter: ["style"] });
    }

    return () => {
      observer.disconnect();
      removeDimensions();
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Animation Picker ────────────────────────────────
// Shows an animation button on the selected section; clicking opens a picker panel

const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade In" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "blur-in", label: "Blur In" },
] as const;

interface AnimationPickerState {
  sectionId: string;
  animation: string;
  animationDelay: string;
  rect: DOMRect;
}

export function useAnimationPicker(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  const [animState, setAnimState] = useState<AnimationPickerState | null>(null);

  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) {
      setAnimState(null);
      return;
    }

    let animBtn: HTMLElement | null = null;

    function addAnimButton() {
      removeAnimButton();
      if (!selectedSectionId) return;

      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      const btn = document.createElement("div");
      btn.setAttribute("data-visual-ui", "anim-btn");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      btn.title = "Animation";
      btn.style.cssText = `
        position:absolute; top:8px; right:114px; z-index:50;
        width:28px; height:28px; display:flex; align-items:center; justify-content:center;
        background:rgba(16,185,129,0.9); color:#fff; border-radius:6px;
        cursor:pointer; backdrop-filter:blur(8px);
        animation:mw-popover-in 150ms ease;
        transition: transform 150ms;
      `;
      btn.onmouseenter = () => { btn.style.transform = "scale(1.1)"; };
      btn.onmouseleave = () => { btn.style.transform = ""; };
      btn.onclick = (e) => {
        e.stopPropagation();
        const anim = sectionEl.getAttribute("data-animate") || "none";
        const delay = sectionEl.getAttribute("data-animate-delay") || "0";
        setAnimState({
          sectionId: selectedSectionId!,
          animation: anim,
          animationDelay: delay,
          rect: sectionEl.getBoundingClientRect(),
        });
      };

      sectionEl.appendChild(btn);
      animBtn = btn;
    }

    function removeAnimButton() {
      if (animBtn) {
        animBtn.remove();
        animBtn = null;
      }
    }

    addAnimButton();
    return () => removeAnimButton();
  }, [visualMode, portalTarget, selectedSectionId]);

  return { animState, closeAnimPicker: () => setAnimState(null) };
}

export function AnimationPicker({
  state,
  onUpdate,
  onClose,
}: {
  state: AnimationPickerState;
  onUpdate: (sectionId: string, animation: string, delay: string) => void;
  onClose: () => void;
}) {
  const [anim, setAnim] = useState(state.animation);
  const [delay, setDelay] = useState(state.animationDelay);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: "0.04em", marginBottom: 4, display: "block",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "5px 8px", border: "1px solid #e5e7eb",
    borderRadius: 6, fontSize: 12, background: "#fff", outline: "none",
    color: "#111827", appearance: "auto" as const,
  };

  return (
    <div
      ref={panelRef}
      data-visual-ui="animation-picker"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: Math.min(state.rect.top, window.innerHeight - 220),
        left: Math.min(state.rect.right + 8, window.innerWidth - 230),
        zIndex: 10001,
        width: 220,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: 14,
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "mw-popover-in 150ms ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Animation</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}
        >
          <SvgIcon d="M18 6L6 18M6 6l12 12" size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelStyle}>Effect</label>
          <select
            value={anim}
            onChange={(e) => {
              setAnim(e.target.value);
              onUpdate(state.sectionId, e.target.value, delay);
            }}
            style={selectStyle}
          >
            {ANIMATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Delay (ms)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="range"
              min="0"
              max="2000"
              step="100"
              value={parseInt(delay) || 0}
              onChange={(e) => {
                setDelay(e.target.value);
                onUpdate(state.sectionId, anim, e.target.value);
              }}
              style={{ flex: 1, height: 4, accentColor: "#10b981" }}
            />
            <span style={{ fontSize: 10, color: "#6b7280", minWidth: 36, textAlign: "right" }}>{parseInt(delay) || 0}ms</span>
          </div>
        </div>

        {/* Live preview button */}
        {anim !== "none" && (
          <button
            onClick={() => {
              // Trigger a preview of the animation by toggling the data-animate attribute
              const sectionEl = document.querySelector(`[data-section-id="${state.sectionId}"]`) as HTMLElement;
              if (sectionEl) {
                const inner = sectionEl.querySelector("section") || sectionEl;
                inner.style.animation = "none";
                inner.offsetHeight; // Force reflow
                inner.style.animation = "";
                inner.setAttribute("data-animate", anim);
                inner.setAttribute("data-animate-delay", delay);
              }
            }}
            style={{
              border: "1px solid #d1fae5", borderRadius: 6, padding: "5px 10px",
              fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#ecfdf5",
              color: "#059669", transition: "all 100ms", textAlign: "center",
            }}
          >
            Preview Animation
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Gradient Editor (integrated into SectionStylePanel) ─────
// Provides a visual gradient builder

interface GradientEditorProps {
  sectionId: string;
  gradient?: { type: "linear" | "radial"; angle?: number; stops: { color: string; position: number }[] };
  onUpdate: (sectionId: string, gradient: { type: string; angle?: number; stops: { color: string; position: number }[] } | null) => void;
}

export function GradientEditor({ sectionId, gradient, onUpdate }: GradientEditorProps) {
  const [type, setType] = useState<"linear" | "radial">(gradient?.type || "linear");
  const [angle, setAngle] = useState(gradient?.angle ?? 180);
  const [stops, setStops] = useState(
    gradient?.stops || [
      { color: "#6366f1", position: 0 },
      { color: "#8b5cf6", position: 100 },
    ]
  );
  const [enabled, setEnabled] = useState(!!gradient);

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: "0.04em", marginBottom: 4, display: "block",
  };

  function emitGradient(newType?: string, newAngle?: number, newStops?: typeof stops) {
    const t = (newType || type) as "linear" | "radial";
    const a = newAngle ?? angle;
    const s = newStops || stops;
    onUpdate(sectionId, { type: t, angle: a, stops: s });
  }

  const gradientPreview = enabled
    ? type === "radial"
      ? `radial-gradient(circle, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`
      : `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`
    : "linear-gradient(135deg, #e5e7eb 0%, #f9fafb 100%)";

  return (
    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Gradient</label>
        <button
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            if (!next) {
              onUpdate(sectionId, null);
            } else {
              emitGradient();
            }
          }}
          style={{
            width: 32, height: 18, borderRadius: 9, border: "none",
            background: enabled ? "#6366f1" : "#d1d5db", cursor: "pointer",
            position: "relative", transition: "background 150ms",
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 2,
            left: enabled ? 16 : 2, transition: "left 150ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Preview */}
          <div style={{
            height: 32, borderRadius: 6, background: gradientPreview,
            border: "1px solid #e5e7eb",
          }} />

          {/* Type selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["linear", "radial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  emitGradient(t);
                }}
                style={{
                  flex: 1, padding: "3px 0", fontSize: 10, fontWeight: 600,
                  border: type === t ? "1px solid #6366f1" : "1px solid #e5e7eb",
                  borderRadius: 4, cursor: "pointer",
                  background: type === t ? "#eef2ff" : "#fff",
                  color: type === t ? "#4f46e5" : "#6b7280",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Angle (only for linear) */}
          {type === "linear" && (
            <div>
              <label style={labelStyle}>Angle</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range" min="0" max="360" value={angle}
                  onChange={(e) => {
                    const a = parseInt(e.target.value);
                    setAngle(a);
                    emitGradient(undefined, a);
                  }}
                  style={{ flex: 1, height: 4, accentColor: "#6366f1" }}
                />
                <span style={{ fontSize: 10, color: "#6b7280", minWidth: 28, textAlign: "right" }}>{angle}°</span>
              </div>
            </div>
          )}

          {/* Color stops */}
          <div>
            <label style={labelStyle}>Color Stops</label>
            {stops.map((stop, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[i] = { ...newStops[i], color: e.target.value };
                    setStops(newStops);
                    emitGradient(undefined, undefined, newStops);
                  }}
                  style={{ width: 24, height: 24, border: "1px solid #e5e7eb", borderRadius: 4, padding: 0, cursor: "pointer" }}
                />
                <input
                  type="range" min="0" max="100" value={stop.position}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[i] = { ...newStops[i], position: parseInt(e.target.value) };
                    setStops(newStops);
                    emitGradient(undefined, undefined, newStops);
                  }}
                  style={{ flex: 1, height: 4, accentColor: stop.color }}
                />
                <span style={{ fontSize: 9, color: "#6b7280", minWidth: 24, textAlign: "right" }}>{stop.position}%</span>
                {stops.length > 2 && (
                  <button
                    onClick={() => {
                      const newStops = stops.filter((_, j) => j !== i);
                      setStops(newStops);
                      emitGradient(undefined, undefined, newStops);
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0, lineHeight: 1 }}
                  >
                    <SvgIcon d="M18 6L6 18M6 6l12 12" size={10} />
                  </button>
                )}
              </div>
            ))}
            {stops.length < 5 && (
              <button
                onClick={() => {
                  const lastStop = stops[stops.length - 1];
                  const newStops = [...stops, { color: "#a855f7", position: Math.min(100, lastStop.position + 25) }];
                  setStops(newStops);
                  emitGradient(undefined, undefined, newStops);
                }}
                style={{
                  width: "100%", padding: "3px 0", fontSize: 10, fontWeight: 500,
                  border: "1px dashed #d1d5db", borderRadius: 4, cursor: "pointer",
                  background: "transparent", color: "#6b7280",
                }}
              >
                + Add Stop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Array Add Item Button ───────────────────────────
// Adds a "+" button after the last array item in a selected section

export function useArrayAddItem(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const addBtns: HTMLElement[] = [];

    function addButtons() {
      removeButtons();
      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      // Find all unique array containers in this section
      const arrayItems = sectionEl.querySelectorAll("[data-array-item]");
      if (arrayItems.length === 0) return;

      // Group by array name to find the last item of each array
      const arrays = new Map<string, HTMLElement>();
      arrayItems.forEach((item) => {
        const name = item.getAttribute("data-array-item")!;
        arrays.set(name, item as HTMLElement);
      });

      arrays.forEach((lastItem, arrayName) => {
        const parent = lastItem.parentElement;
        if (!parent) return;

        const btn = document.createElement("div");
        btn.setAttribute("data-visual-ui", "array-add");
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span style="margin-left:4px;font-size:10px;font-weight:600">Add Item</span>`;
        btn.style.cssText = `
          display:inline-flex; align-items:center; padding:6px 14px;
          background:rgba(99,102,241,0.1); color:#6366f1; border-radius:8px;
          cursor:pointer; font-family:system-ui,-apple-system,sans-serif;
          border:2px dashed rgba(99,102,241,0.3);
          margin:8px auto; transition:all 150ms;
          animation:mw-popover-in 150ms ease;
        `;
        btn.onmouseenter = () => {
          btn.style.background = "rgba(99,102,241,0.15)";
          btn.style.borderColor = "rgba(99,102,241,0.5)";
        };
        btn.onmouseleave = () => {
          btn.style.background = "rgba(99,102,241,0.1)";
          btn.style.borderColor = "rgba(99,102,241,0.3)";
        };
        btn.onclick = (e) => {
          e.stopPropagation();
          sendToParent("MEMBERWISE_ARRAY_ADD", {
            sectionId: selectedSectionId,
            arrayName,
          });
        };

        // Insert after the last item's parent container, or append to parent
        if (lastItem.nextSibling) {
          parent.insertBefore(btn, lastItem.nextSibling);
        } else {
          parent.appendChild(btn);
        }
        addBtns.push(btn);
      });
    }

    function removeButtons() {
      addBtns.forEach((b) => b.remove());
      addBtns.length = 0;
    }

    addButtons();

    // Re-add buttons when DOM changes (e.g., after adding/removing items)
    const observer = new MutationObserver(() => {
      requestAnimationFrame(addButtons);
    });
    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`);
    if (sectionEl) {
      observer.observe(sectionEl, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      removeButtons();
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Spacer/Divider Height Drag ─────────────────────
// Shows a drag handle on spacer sections to resize height visually

export function useSpacerResize(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    const spacer = sectionEl.querySelector("[data-editable-spacer]") as HTMLElement;
    if (!spacer) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    const handle = document.createElement("div");
    handle.setAttribute("data-visual-ui", "spacer-handle");
    handle.style.cssText = `
      position:absolute; bottom:-4px; left:50%; transform:translateX(-50%);
      width:80px; height:8px; cursor:ns-resize; z-index:60;
      background:var(--primary,#6366f1); border-radius:4px; opacity:0.7;
      transition:opacity 150ms;
    `;
    handle.onmouseenter = () => { handle.style.opacity = "1"; };
    handle.onmouseleave = () => { if (!isDragging) handle.style.opacity = "0.7"; };

    const label = document.createElement("div");
    label.setAttribute("data-visual-ui", "spacer-label");
    label.style.cssText = `
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      background:rgba(99,102,241,0.1); color:#6366f1; padding:4px 12px;
      border-radius:6px; font-size:11px; font-weight:600; pointer-events:none;
      font-family:system-ui,-apple-system,sans-serif;
      border:1px dashed rgba(99,102,241,0.3);
    `;
    label.textContent = spacer.style.height || "4rem";

    spacer.style.position = "relative";
    spacer.appendChild(handle);
    spacer.appendChild(label);

    function handleMouseDown(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startHeight = spacer.getBoundingClientRect().height;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      const newHeight = Math.max(16, startHeight + dy);
      spacer.style.height = `${newHeight}px`;
      label.textContent = `${Math.round(newHeight)}px`;
    }

    function handleMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      sendToParent("MEMBERWISE_INLINE_EDIT", {
        sectionId: selectedSectionId,
        propPath: "height",
        value: spacer.style.height,
      });
    }

    handle.addEventListener("mousedown", handleMouseDown);

    return () => {
      handle.remove();
      label.remove();
      handle.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Empty Section Helper ───────────────────────────
// Shows a helpful "click to edit" overlay on sections that have no visible editable content

export function useEmptySectionHelper(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    // Check if the section has any editable elements
    const editables = sectionEl.querySelectorAll(
      "[data-editable-text], [data-editable-image], [data-editable-link], [data-editable-icon], [data-array-item]"
    );

    // If there are editable elements, don't show the helper
    if (editables.length > 0) return;

    // Show a centered helper overlay
    const helper = document.createElement("div");
    helper.setAttribute("data-visual-ui", "empty-helper");
    helper.style.cssText = `
      position:absolute; inset:0; z-index:50;
      display:flex; align-items:center; justify-content:center;
      background:rgba(99,102,241,0.04); border:2px dashed rgba(99,102,241,0.2);
      border-radius:8px; pointer-events:none;
    `;
    helper.innerHTML = `
      <div style="text-align:center;font-family:system-ui,-apple-system,sans-serif;">
        <div style="font-size:24px;margin-bottom:6px;">⚙️</div>
        <div style="font-size:12px;font-weight:600;color:#6366f1;">Click the toolbar to edit properties</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Or press Enter to open the editor panel</div>
      </div>
    `;

    const pos = window.getComputedStyle(sectionEl).position;
    if (pos === "static") sectionEl.style.position = "relative";

    sectionEl.appendChild(helper);

    return () => {
      helper.remove();
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Divider Section Inline Controls ────────────────
// Shows clickable style/width pickers when a divider section is selected

export function useDividerControls(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null,
  sections?: { id: string; type: string }[]
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId || !sections) return;

    const section = sections.find((s) => s.id === selectedSectionId);
    if (!section || section.type !== "divider") return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    const panel = document.createElement("div");
    panel.setAttribute("data-visual-ui", "divider-controls");
    panel.style.cssText = `
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:60;
      display:flex; align-items:center; gap:4px; padding:4px;
      background:rgba(255,255,255,0.95); border-radius:8px;
      box-shadow:0 2px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      font-family:system-ui,-apple-system,sans-serif;
      animation:mw-popover-in 150ms ease;
    `;

    // Style buttons
    const styles = [
      { value: "solid", label: "━", title: "Solid" },
      { value: "dashed", label: "╌", title: "Dashed" },
      { value: "dotted", label: "┈", title: "Dotted" },
      { value: "gradient", label: "◟◞", title: "Gradient" },
    ];

    const styleGroup = document.createElement("div");
    styleGroup.style.cssText = "display:flex;gap:2px;";
    styles.forEach((s) => {
      const btn = document.createElement("button");
      btn.title = s.title;
      btn.textContent = s.label;
      btn.style.cssText = `
        width:32px;height:28px;border:1px solid #e5e7eb;border-radius:4px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;padding:0;
        background:#fff;color:#374151;font-size:12px;font-weight:600;
        font-family:monospace;transition:all 100ms;
      `;
      btn.onmouseenter = () => { btn.style.borderColor = "#6366f1"; btn.style.background = "#eef2ff"; };
      btn.onmouseleave = () => { btn.style.borderColor = "#e5e7eb"; btn.style.background = "#fff"; };
      btn.onclick = (e) => {
        e.stopPropagation();
        sendToParent("MEMBERWISE_INLINE_EDIT", { sectionId: selectedSectionId, propPath: "style", value: s.value });
      };
      styleGroup.appendChild(btn);
    });
    panel.appendChild(styleGroup);

    // Divider
    const sep1 = document.createElement("div");
    sep1.style.cssText = "width:1px;height:20px;background:#e5e7eb;margin:0 2px;";
    panel.appendChild(sep1);

    // Width buttons
    const widths = [
      { value: "narrow", label: "S", title: "Narrow" },
      { value: "medium", label: "M", title: "Medium" },
      { value: "full", label: "F", title: "Full width" },
    ];

    const widthGroup = document.createElement("div");
    widthGroup.style.cssText = "display:flex;gap:2px;";
    widths.forEach((w) => {
      const btn = document.createElement("button");
      btn.title = w.title;
      btn.textContent = w.label;
      btn.style.cssText = `
        width:28px;height:28px;border:1px solid #e5e7eb;border-radius:4px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;padding:0;
        background:#fff;color:#374151;font-size:10px;font-weight:700;
        transition:all 100ms;
      `;
      btn.onmouseenter = () => { btn.style.borderColor = "#6366f1"; btn.style.background = "#eef2ff"; };
      btn.onmouseleave = () => { btn.style.borderColor = "#e5e7eb"; btn.style.background = "#fff"; };
      btn.onclick = (e) => {
        e.stopPropagation();
        sendToParent("MEMBERWISE_INLINE_EDIT", { sectionId: selectedSectionId, propPath: "width", value: w.value });
      };
      widthGroup.appendChild(btn);
    });
    panel.appendChild(widthGroup);

    // Divider
    const sep2 = document.createElement("div");
    sep2.style.cssText = "width:1px;height:20px;background:#e5e7eb;margin:0 2px;";
    panel.appendChild(sep2);

    // Color picker
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#e5e7eb";
    colorInput.title = "Divider color";
    colorInput.style.cssText = "width:28px;height:28px;border:1px solid #e5e7eb;border-radius:4px;padding:0;cursor:pointer;";
    colorInput.onmousedown = (e) => e.stopPropagation();
    colorInput.oninput = () => {
      sendToParent("MEMBERWISE_INLINE_EDIT", { sectionId: selectedSectionId, propPath: "color", value: colorInput.value });
    };
    panel.appendChild(colorInput);

    const pos = window.getComputedStyle(sectionEl).position;
    if (pos === "static") sectionEl.style.position = "relative";

    sectionEl.appendChild(panel);

    return () => {
      panel.remove();
    };
  }, [visualMode, portalTarget, selectedSectionId, sections]);
}

// ─── Embed URL Inline Editor ────────────────────────
// Shows a URL input when video-embed/google-map/calendar-widget sections have no content

const EMBED_CONFIG: Record<string, { propPath: string; placeholder: string }> = {
  "video-embed": { propPath: "videoUrl", placeholder: "Paste YouTube or Vimeo URL..." },
  "google-map": { propPath: "embedUrl", placeholder: "Paste Google Maps embed URL..." },
  "calendar-widget": { propPath: "calendarUrl", placeholder: "Paste calendar embed URL..." },
};

export function useVideoUrlEditor(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null,
  sections?: { id: string; type: string }[]
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId || !sections) return;

    const section = sections.find((s) => s.id === selectedSectionId);
    if (!section) return;

    const config = EMBED_CONFIG[section.type];
    if (!config) return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    // Only show if there's no iframe (i.e., placeholder is showing)
    const iframe = sectionEl.querySelector("iframe");
    if (iframe) return;

    const panel = document.createElement("div");
    panel.setAttribute("data-visual-ui", "embed-url-editor");
    panel.style.cssText = `
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:60;
      display:flex; align-items:center; gap:6px; padding:8px 12px;
      background:rgba(255,255,255,0.95); border-radius:10px;
      box-shadow:0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      font-family:system-ui,-apple-system,sans-serif;
      animation:mw-popover-in 150ms ease;
      width:380px; max-width:calc(100% - 32px);
    `;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = config.placeholder;
    input.style.cssText = `
      flex:1;height:32px;border:1px solid #e5e7eb;border-radius:6px;
      padding:0 10px;font-size:12px;outline:none;background:#f9fafb;color:#374151;
    `;
    input.onfocus = () => { input.style.borderColor = "#6366f1"; };
    input.onblur = () => { input.style.borderColor = "#e5e7eb"; };
    input.onkeydown = (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        e.stopPropagation();
        sendToParent("MEMBERWISE_INLINE_EDIT", { sectionId: selectedSectionId, propPath: config.propPath, value: input.value.trim() });
      }
    };

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Add";
    saveBtn.style.cssText = `
      height:32px;padding:0 14px;border:none;border-radius:6px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
      font-size:12px;font-weight:600;cursor:pointer;transition:opacity 150ms;
    `;
    saveBtn.onmouseenter = () => { saveBtn.style.opacity = "0.9"; };
    saveBtn.onmouseleave = () => { saveBtn.style.opacity = "1"; };
    saveBtn.onclick = (e) => {
      e.stopPropagation();
      if (input.value.trim()) {
        sendToParent("MEMBERWISE_INLINE_EDIT", { sectionId: selectedSectionId, propPath: config.propPath, value: input.value.trim() });
      }
    };

    panel.appendChild(input);
    panel.appendChild(saveBtn);

    const pos = window.getComputedStyle(sectionEl).position;
    if (pos === "static") sectionEl.style.position = "relative";

    sectionEl.appendChild(panel);

    // Auto-focus
    setTimeout(() => input.focus(), 100);

    return () => {
      panel.remove();
    };
  }, [visualMode, portalTarget, selectedSectionId, sections]);
}

// Helper: convert rgb(r,g,b) to hex
function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "";
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "";
  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// ─── Toast Notification System ─────────────────────
// Non-blocking feedback messages for user actions

let toastContainer: HTMLElement | null = null;

export function showToast(message: string, type: "success" | "info" | "error" = "info") {
  if (typeof document === "undefined") return;

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.setAttribute("data-visual-ui", "toast-container");
    toastContainer.style.cssText = `
      position:fixed; bottom:20px; right:20px; z-index:100000;
      display:flex; flex-direction:column-reverse; gap:8px; pointer-events:none;
      font-family:system-ui,-apple-system,sans-serif;
    `;
    document.body.appendChild(toastContainer);
  }

  const iconMap = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  };

  const bgMap = { success: "#059669", info: "#6366f1", error: "#ef4444" };

  const toast = document.createElement("div");
  toast.innerHTML = `${iconMap[type]}<span style="margin-left:6px">${message}</span>`;
  toast.style.cssText = `
    display:flex; align-items:center; padding:8px 16px;
    background:${bgMap[type]}; color:#fff; border-radius:8px;
    font-size:12px; font-weight:500; pointer-events:auto;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    animation:mw-toast-in 200ms ease;
    max-width:320px; white-space:nowrap;
  `;

  // Inject animation keyframes if not already present
  if (!document.getElementById("mw-toast-styles")) {
    const style = document.createElement("style");
    style.id = "mw-toast-styles";
    style.textContent = `
      @keyframes mw-toast-in { from { opacity:0; transform:translateY(8px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes mw-toast-out { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(0.95); } }
    `;
    document.head.appendChild(style);
  }

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "mw-toast-out 200ms ease forwards";
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

// Wire toast into section operations
export function useToastNotifications(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
) {
  useEffect(() => {
    if (!visualMode) return;

    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "MEMBERWISE_TOAST") {
        showToast(e.data.message, e.data.toastType || "info");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualMode, portalTarget]);
}

// ─── Breadcrumb Bar ────────────────────────────────
// Shows element ancestry path when hovering/editing inline elements

export function useBreadcrumbs(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null,
  sections?: { id: string; type: string }[]
) {
  useEffect(() => {
    if (!visualMode || !portalTarget) return;

    let breadcrumbBar: HTMLElement | null = null;

    function buildPath(el: HTMLElement): { label: string; element: HTMLElement }[] {
      const path: { label: string; element: HTMLElement }[] = [];
      let current: HTMLElement | null = el;

      while (current && current !== portalTarget) {
        const sectionId = current.getAttribute("data-section-id");
        const editableText = current.getAttribute("data-editable-text");
        const editableImage = current.getAttribute("data-editable-image");
        const editableLink = current.getAttribute("data-editable-link");
        const arrayItem = current.getAttribute("data-array-item");

        if (sectionId) {
          const section = sections?.find((s) => s.id === sectionId);
          const typeName = (section?.type || "section").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
          path.unshift({ label: typeName, element: current });
        } else if (editableText) {
          path.unshift({ label: editableText.split(".").pop() || "text", element: current });
        } else if (editableImage) {
          path.unshift({ label: "image", element: current });
        } else if (editableLink) {
          path.unshift({ label: "link", element: current });
        } else if (arrayItem) {
          const idx = current.getAttribute("data-item-index") || "0";
          path.unshift({ label: `${arrayItem}[${idx}]`, element: current });
        }

        current = current.parentElement;
      }

      return path;
    }

    function showBreadcrumbs(target: HTMLElement) {
      removeBreadcrumbs();

      const path = buildPath(target);
      if (path.length <= 1) return;

      breadcrumbBar = document.createElement("div");
      breadcrumbBar.setAttribute("data-visual-ui", "breadcrumbs");
      breadcrumbBar.style.cssText = `
        position:fixed; bottom:8px; left:50%; transform:translateX(-50%);
        z-index:10003; display:flex; align-items:center; gap:0;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);
        border-radius:6px; padding:4px 10px;
        font-family:system-ui,-apple-system,sans-serif;
        font-size:11px; color:#fff;
        animation:mw-popover-in 100ms ease;
        max-width:calc(100vw - 32px); overflow:hidden;
      `;

      path.forEach((item, i) => {
        if (i > 0) {
          const sep = document.createElement("span");
          sep.textContent = " › ";
          sep.style.cssText = "color:rgba(255,255,255,0.4);margin:0 4px;flex-shrink:0;";
          breadcrumbBar!.appendChild(sep);
        }

        const crumb = document.createElement("span");
        crumb.textContent = item.label;
        crumb.style.cssText = `
          cursor:pointer; padding:1px 4px; border-radius:3px;
          transition:background 100ms; white-space:nowrap;
          color:${i === path.length - 1 ? "#a5b4fc" : "rgba(255,255,255,0.7)"};
          font-weight:${i === path.length - 1 ? "600" : "400"};
        `;
        crumb.onmouseenter = () => {
          crumb.style.background = "rgba(255,255,255,0.15)";
          item.element.style.outline = "2px solid #6366f1";
          item.element.style.outlineOffset = "2px";
        };
        crumb.onmouseleave = () => {
          crumb.style.background = "transparent";
          item.element.style.outline = "";
          item.element.style.outlineOffset = "";
        };
        crumb.onclick = (e) => {
          e.stopPropagation();
          // Select the section if clicking on it
          const sectionId = item.element.getAttribute("data-section-id");
          if (sectionId) {
            item.element.dispatchEvent(new CustomEvent("visual-select-section", { bubbles: true, detail: { sectionId } }));
            item.element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        };
        breadcrumbBar!.appendChild(crumb);
      });

      document.body.appendChild(breadcrumbBar);
    }

    function removeBreadcrumbs() {
      if (breadcrumbBar) {
        breadcrumbBar.remove();
        breadcrumbBar = null;
      }
    }

    function handleMouseOver(e: Event) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-visual-ui]")) return;
      const editable = target.closest("[data-editable-text], [data-editable-image], [data-editable-link], [data-editable-icon], [data-array-item]") as HTMLElement;
      if (editable) {
        showBreadcrumbs(editable);
      }
    }

    function handleMouseOut(e: Event) {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related && related.closest("[data-visual-ui='breadcrumbs']")) return;
      if (related && related.closest("[data-editable-text], [data-editable-image], [data-editable-link], [data-editable-icon], [data-array-item]")) return;
      removeBreadcrumbs();
    }

    portalTarget.addEventListener("mouseover", handleMouseOver);
    portalTarget.addEventListener("mouseout", handleMouseOut);

    return () => {
      portalTarget.removeEventListener("mouseover", handleMouseOver);
      portalTarget.removeEventListener("mouseout", handleMouseOut);
      removeBreadcrumbs();
    };
  }, [visualMode, portalTarget, selectedSectionId, sections]);
}

// ─── Copy/Paste Styles ─────────────────────────────
// Cmd+Alt+C to copy styles, Cmd+Alt+V to paste

let copiedStyles: Record<string, string> | null = null;

export function useCopyPasteStyles(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    function handleKeydown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).contentEditable === "true") return;
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+Alt+C — copy section styles
      if (metaOrCtrl && e.altKey && e.key === "c") {
        e.preventDefault();
        const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
        if (!sectionEl) return;

        const inner = sectionEl.querySelector("section") || sectionEl;
        const computed = window.getComputedStyle(inner);
        copiedStyles = {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          fontFamily: computed.fontFamily,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
        };
        showToast("Style copied", "success");
        return;
      }

      // Cmd+Alt+V — paste section styles
      if (metaOrCtrl && e.altKey && e.key === "v") {
        e.preventDefault();
        if (!copiedStyles) {
          showToast("No style to paste", "error");
          return;
        }
        sendToParent("MEMBERWISE_STYLE_UPDATE", {
          sectionId: selectedSectionId,
          updates: {
            backgroundColor: copiedStyles.backgroundColor,
            textColor: copiedStyles.color,
            borderRadius: copiedStyles.borderRadius,
          },
        });
        showToast("Style pasted", "success");
        return;
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Keyboard Shortcut Cheatsheet ──────────────────
// Cmd+/ shows an overlay with all available shortcuts

export function KeyboardShortcutOverlay({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "/")) {
        e.preventDefault();
        onClose();
      }
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const groups = [
    {
      title: "Selection",
      shortcuts: [
        { keys: "Click", desc: "Select section / edit element" },
        { keys: "↑ / ↓", desc: "Navigate between sections" },
        { keys: "Escape", desc: "Deselect / exit visual mode" },
        { keys: "Enter", desc: "Open section properties" },
      ],
    },
    {
      title: "Editing",
      shortcuts: [
        { keys: "⌘Z", desc: "Undo" },
        { keys: "⌘⇧Z", desc: "Redo" },
        { keys: "⌘D", desc: "Duplicate section" },
        { keys: "Delete", desc: "Delete section" },
        { keys: "⌘↑ / ⌘↓", desc: "Move section up/down" },
        { keys: "H", desc: "Toggle section visibility" },
      ],
    },
    {
      title: "Clipboard",
      shortcuts: [
        { keys: "⌘C", desc: "Copy section" },
        { keys: "⌘V", desc: "Paste section" },
        { keys: "⌘⌥C", desc: "Copy styles" },
        { keys: "⌘⌥V", desc: "Paste styles" },
      ],
    },
    {
      title: "Text Formatting",
      shortcuts: [
        { keys: "⌘B", desc: "Bold" },
        { keys: "⌘I", desc: "Italic" },
        { keys: "⌘U", desc: "Underline" },
        { keys: "⌘[", desc: "Decrease font size" },
        { keys: "⌘]", desc: "Increase font size" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: "⌘/", desc: "Toggle this cheatsheet" },
        { keys: "⌘K", desc: "Command palette" },
        { keys: "L", desc: "Toggle layers panel" },
        { keys: "G", desc: "Toggle grid overlay" },
      ],
    },
    {
      title: "Zoom",
      shortcuts: [
        { keys: "⌘+", desc: "Zoom in" },
        { keys: "⌘−", desc: "Zoom out" },
        { keys: "⌘0", desc: "Reset zoom" },
      ],
    },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100001,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "mw-ctx-fade 150ms ease",
      }}
    >
      <div
        ref={ref}
        data-visual-ui="shortcut-overlay"
        style={{
          background: "#fff", borderRadius: 16, padding: 24,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)", maxWidth: 600, width: "90%",
          fontFamily: "system-ui,-apple-system,sans-serif",
          animation: "mw-popover-in 200ms ease",
          maxHeight: "80vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, border: "none", background: "#f3f4f6",
              borderRadius: 6, cursor: "pointer", color: "#6b7280",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, lineHeight: 1,
            }}
          >×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                {group.title}
              </h3>
              {group.shortcuts.map((s) => (
                <div key={s.keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>{s.desc}</span>
                  <kbd style={{
                    fontSize: 10, fontWeight: 600, color: "#6b7280",
                    background: "#f3f4f6", border: "1px solid #e5e7eb",
                    borderRadius: 4, padding: "2px 6px", fontFamily: "system-ui",
                    whiteSpace: "nowrap",
                  }}>{s.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Responsive Preview Toggle ─────────────────────
// Desktop/Tablet/Mobile breakpoint buttons

export function ResponsivePreviewBar({
  currentBreakpoint,
  onBreakpointChange,
}: {
  currentBreakpoint: "desktop" | "tablet" | "mobile";
  onBreakpointChange: (bp: "desktop" | "tablet" | "mobile") => void;
}) {
  const breakpoints = [
    { value: "desktop" as const, label: "Desktop", icon: "M2 3h20v14H2V3zM8 21h8M12 17v4", width: "100%" },
    { value: "tablet" as const, label: "Tablet", icon: "M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM12 18h.01", width: "768px" },
    { value: "mobile" as const, label: "Mobile", icon: "M8 2h8a1 1 0 011 1v18a1 1 0 01-1 1H8a1 1 0 01-1-1V3a1 1 0 011-1zM12 18h.01", width: "375px" },
  ];

  return (
    <div
      data-visual-ui="responsive-bar"
      style={{
        display: "flex", alignItems: "center", gap: 2,
        background: "#fff", borderRadius: 8, padding: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}
    >
      {breakpoints.map((bp) => {
        const isActive = currentBreakpoint === bp.value;
        return (
          <button
            key={bp.value}
            title={`${bp.label} (${bp.width})`}
            onClick={() => onBreakpointChange(bp.value)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "4px 10px", border: "none", borderRadius: 6,
              cursor: "pointer", fontSize: 10, fontWeight: 600,
              background: isActive ? "#eef2ff" : "transparent",
              color: isActive ? "#4f46e5" : "#6b7280",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={bp.icon} />
            </svg>
            {bp.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Margin/Padding Visualization ──────────────────
// Shows colored overlays on selected sections

export function useSpacingVisualization(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const overlays: HTMLElement[] = [];

    function showSpacing() {
      removeSpacing();
      const sectionEl = portalTarget!.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
      if (!sectionEl) return;

      const inner = sectionEl.querySelector("section") || sectionEl;
      const computed = window.getComputedStyle(inner);
      const rect = inner.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();

      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      const paddingRight = parseFloat(computed.paddingRight) || 0;

      // Padding overlays (green tint)
      if (paddingTop > 4) {
        const topOverlay = createSpacingOverlay(
          rect.left - sectionRect.left,
          rect.top - sectionRect.top,
          rect.width, paddingTop, "rgba(16,185,129,0.12)", `${Math.round(paddingTop)}px`
        );
        sectionEl.appendChild(topOverlay);
        overlays.push(topOverlay);
      }

      if (paddingBottom > 4) {
        const bottomOverlay = createSpacingOverlay(
          rect.left - sectionRect.left,
          rect.bottom - sectionRect.top - paddingBottom,
          rect.width, paddingBottom, "rgba(16,185,129,0.12)", `${Math.round(paddingBottom)}px`
        );
        sectionEl.appendChild(bottomOverlay);
        overlays.push(bottomOverlay);
      }

      if (paddingLeft > 4) {
        const leftOverlay = createSpacingOverlay(
          rect.left - sectionRect.left,
          rect.top - sectionRect.top + paddingTop,
          paddingLeft, rect.height - paddingTop - paddingBottom,
          "rgba(16,185,129,0.08)", ""
        );
        sectionEl.appendChild(leftOverlay);
        overlays.push(leftOverlay);
      }

      if (paddingRight > 4) {
        const rightOverlay = createSpacingOverlay(
          rect.right - sectionRect.left - paddingRight,
          rect.top - sectionRect.top + paddingTop,
          paddingRight, rect.height - paddingTop - paddingBottom,
          "rgba(16,185,129,0.08)", ""
        );
        sectionEl.appendChild(rightOverlay);
        overlays.push(rightOverlay);
      }
    }

    function createSpacingOverlay(
      left: number, top: number, width: number, height: number,
      color: string, label: string
    ): HTMLElement {
      const el = document.createElement("div");
      el.setAttribute("data-visual-ui", "spacing-viz");
      el.style.cssText = `
        position:absolute; left:${left}px; top:${top}px;
        width:${width}px; height:${height}px;
        background:${color}; pointer-events:none; z-index:40;
        display:flex; align-items:center; justify-content:center;
        border:1px dashed rgba(16,185,129,0.3);
      `;
      if (label && height > 16) {
        el.innerHTML = `<span style="font-size:9px;font-weight:600;color:rgba(16,185,129,0.8);font-family:ui-monospace,monospace;background:rgba(255,255,255,0.7);padding:0 4px;border-radius:2px;">${label}</span>`;
      }
      return el;
    }

    function removeSpacing() {
      overlays.forEach((o) => o.remove());
      overlays.length = 0;
    }

    showSpacing();

    // Update on style changes
    const observer = new MutationObserver(() => {
      requestAnimationFrame(showSpacing);
    });
    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`);
    if (sectionEl) {
      observer.observe(sectionEl, { attributes: true, subtree: true, attributeFilter: ["style"] });
    }

    return () => {
      observer.disconnect();
      removeSpacing();
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Command Palette ───────────────────────────────
// Cmd+K opens a searchable action list

interface CommandPaletteAction {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

export function CommandPalette({
  actions,
  onClose,
}: {
  actions: CommandPaletteAction[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filtered = search
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(search.toLowerCase()) ||
          a.category.toLowerCase().includes(search.toLowerCase())
      )
    : actions;

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      onClose();
    }
    if (e.key === "Escape") {
      onClose();
    }
  }

  // Group by category
  const grouped = new Map<string, CommandPaletteAction[]>();
  filtered.forEach((a) => {
    if (!grouped.has(a.category)) grouped.set(a.category, []);
    grouped.get(a.category)!.push(a);
  });

  let globalIndex = 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100002,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", paddingTop: "15vh",
        animation: "mw-ctx-fade 100ms ease",
      }}
    >
      <div
        ref={ref}
        data-visual-ui="command-palette"
        onKeyDown={handleKeydown}
        style={{
          width: 480, maxWidth: "90%", maxHeight: "60vh",
          background: "#fff", borderRadius: 14,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
          fontFamily: "system-ui,-apple-system,sans-serif",
          animation: "mw-popover-in 150ms ease",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SvgIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} className="" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, sections, pages..."
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 14,
                color: "#111827", background: "transparent",
              }}
            />
            <kbd style={{
              fontSize: 9, color: "#9ca3af", background: "#f3f4f6",
              border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 5px",
            }}>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No matching actions found
            </div>
          )}
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div style={{
                padding: "8px 16px 4px", fontSize: 10, fontWeight: 700,
                color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {category}
              </div>
              {items.map((item) => {
                const idx = globalIndex++;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 16px", border: "none",
                      background: isSelected ? "#f3f4f6" : "transparent",
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "inherit", fontSize: 13, color: "#374151",
                      transition: "background 50ms",
                    }}
                  >
                    {item.icon && <SvgIcon d={item.icon} size={14} className="" />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.shortcut && (
                      <kbd style={{
                        fontSize: 10, color: "#9ca3af", background: "#f3f4f6",
                        border: "1px solid #e5e7eb", borderRadius: 3, padding: "1px 5px",
                      }}>{item.shortcut}</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hover State Style Editor ──────────────────────
// Toggle pseudo-state editing for interactive elements

export function useHoverStateEditor(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId?: string | null
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    // Find all interactive elements (buttons, links) in the section
    const interactives = sectionEl.querySelectorAll("a, button, [data-editable-link]");
    if (interactives.length === 0) return;

    // Add a hover-state toggle button to the section toolbar area
    const toggleBtn = document.createElement("div");
    toggleBtn.setAttribute("data-visual-ui", "hover-state-btn");
    toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></svg><span style="margin-left:4px;font-size:10px;font-weight:600">HOVER</span>`;
    toggleBtn.title = "Preview hover states";
    toggleBtn.style.cssText = `
      position:absolute; top:8px; right:148px; z-index:50;
      display:flex; align-items:center; padding:4px 10px;
      background:rgba(245,158,11,0.9); color:#fff; border-radius:6px;
      cursor:pointer; backdrop-filter:blur(8px);
      font-family:system-ui,-apple-system,sans-serif;
      animation:mw-popover-in 150ms ease;
      transition: transform 150ms;
    `;

    let hoverActive = false;

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      hoverActive = !hoverActive;
      toggleBtn.style.background = hoverActive ? "rgba(245,158,11,1)" : "rgba(245,158,11,0.9)";
      toggleBtn.style.boxShadow = hoverActive ? "0 0 0 2px rgba(245,158,11,0.3)" : "none";

      interactives.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (hoverActive) {
          // Force hover appearance by dispatching mouseenter
          htmlEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
          htmlEl.classList.add("hover");
          // Apply common hover styles
          htmlEl.style.transition = "all 200ms ease";
        } else {
          htmlEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
          htmlEl.classList.remove("hover");
        }
      });

      showToast(hoverActive ? "Hover state preview ON" : "Hover state preview OFF", "info");
    };
    toggleBtn.onmouseenter = () => { toggleBtn.style.transform = "scale(1.05)"; };
    toggleBtn.onmouseleave = () => { toggleBtn.style.transform = ""; };

    sectionEl.appendChild(toggleBtn);

    return () => {
      toggleBtn.remove();
      if (hoverActive) {
        interactives.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.classList.remove("hover");
          htmlEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        });
      }
    };
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Layers Panel ──────────────────────────────────
// Collapsible sidebar showing all sections for quick navigation
// Inspired by Webflow Navigator / Figma Layers

export function LayersPanel({
  sections,
  selectedSectionId,
  onSelectSection,
  onClose,
}: {
  sections: SectionDocument[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const sectionName = (s: SectionDocument) => {
    const heading = (s.props as Record<string, unknown>)?.heading;
    const label = s.type.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    return heading ? `${label}: ${String(heading).slice(0, 30)}` : label;
  };

  const sectionIcon = (type: string): string => {
    const icons: Record<string, string> = {
      hero: "M4 5h16v10H4V5zM8 19h8",
      features: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z",
      cta: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
      testimonials: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076",
      stats: "M3 3v18h18M7 16l4-8 4 4 4-6",
      faq: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01",
      gallery: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      spacer: "M4 12h16",
      divider: "M4 12h16",
      "rich-text": "M4 6h16M4 12h10M4 18h14",
    };
    return icons[type] || "M4 6h16M4 12h16M4 18h16";
  };

  if (collapsed) {
    return (
      <div
        data-visual-ui="layers-collapsed"
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed", left: 12, top: "50%", transform: "translateY(-50%)",
          zIndex: 10000, width: 36, height: 36, borderRadius: 10,
          background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "transform 150ms",
        }}
        title="Open Layers Panel"
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(-50%)"; }}
      >
        <SvgIcon d="M4 6h16M4 12h16M4 18h16" size={16} />
      </div>
    );
  }

  return (
    <div
      data-visual-ui="layers-panel"
      style={{
        position: "fixed", left: 12, top: 80, bottom: 80,
        zIndex: 10000, width: 220,
        background: "#fff", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
        fontFamily: "system-ui,-apple-system,sans-serif",
        display: "flex", flexDirection: "column",
        animation: "mw-popover-in 150ms ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", borderBottom: "1px solid #f3f4f6",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Layers
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 22, height: 22, border: "none", background: "#f3f4f6",
              borderRadius: 5, cursor: "pointer", color: "#6b7280",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Collapse"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            <SvgIcon d="M11 19l-7-7 7-7" size={12} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 22, height: 22, border: "none", background: "#f3f4f6",
              borderRadius: 5, cursor: "pointer", color: "#6b7280",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Close"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            <SvgIcon d="M18 6L6 18M6 6l12 12" size={12} />
          </button>
        </div>
      </div>

      {/* Section count */}
      <div style={{ padding: "6px 12px", fontSize: 10, color: "#9ca3af" }}>
        {sections.length} section{sections.length !== 1 ? "s" : ""}
      </div>

      {/* Section list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 6px" }}>
        {sections.map((s, i) => {
          const isSelected = s.id === selectedSectionId;
          const isHidden = s.visible === false;
          const isDragOver = dragOverIdx === i && dragFromIdx !== null && dragFromIdx !== i;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragFromIdx(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
              onDragEnd={() => { setDragFromIdx(null); setDragOverIdx(null); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFromIdx !== null && dragFromIdx !== i) {
                  sendToParent("MEMBERWISE_SECTION_REORDER", {
                    sectionId: sections[dragFromIdx].id,
                    newIndex: i,
                  });
                }
                setDragFromIdx(null);
                setDragOverIdx(null);
              }}
              onClick={() => {
                onSelectSection(s.id);
                document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 8px", borderRadius: 7, marginBottom: 2,
                cursor: "pointer", transition: "all 100ms",
                background: isSelected ? "#eef2ff" : "transparent",
                borderTop: isDragOver ? "2px solid #6366f1" : "2px solid transparent",
                opacity: isHidden ? 0.45 : dragFromIdx === i ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "#f9fafb";
                // Highlight section in preview
                const el = document.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement;
                if (el && !isSelected) {
                  el.style.outline = "2px dashed #6366f1";
                  el.style.outlineOffset = "-2px";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
                const el = document.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement;
                if (el && !isSelected) {
                  el.style.outline = "2px solid transparent";
                }
              }}
            >
              {/* Drag indicator */}
              <span style={{ color: "#d1d5db", cursor: "grab", flexShrink: 0, lineHeight: 0 }}>
                <SvgIcon d="M8 6h.01M12 6h.01M8 12h.01M12 12h.01M8 18h.01M12 18h.01" size={10} />
              </span>
              {/* Section icon */}
              <span style={{ color: isSelected ? "#6366f1" : "#9ca3af", flexShrink: 0, lineHeight: 0 }}>
                <SvgIcon d={sectionIcon(s.type)} size={13} />
              </span>
              {/* Section name */}
              <span style={{
                flex: 1, fontSize: 11, fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "#4338ca" : "#374151",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {sectionName(s)}
              </span>
              {/* Hidden indicator */}
              {isHidden && (
                <span style={{ color: "#d1d5db", flexShrink: 0, lineHeight: 0 }} title="Hidden">
                  <SvgIcon d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M1 1l22 22" size={11} />
                </span>
              )}
              {/* Quick actions */}
              <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button
                  title={isHidden ? "Show" : "Hide"}
                  onClick={() => sendToParent("MEMBERWISE_SECTION_TOGGLE_VISIBILITY", { sectionId: s.id })}
                  style={{
                    width: 20, height: 20, border: "none", background: "transparent",
                    borderRadius: 4, cursor: "pointer", color: "#9ca3af", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <SvgIcon d={isHidden ? "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8M1 1l22 22" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"} size={10} />
                </button>
                <button
                  title="Delete"
                  onClick={() => { sendToParent("MEMBERWISE_SECTION_DELETE", { sectionId: s.id }); showToast("Section deleted", "success"); }}
                  style={{
                    width: 20, height: 20, border: "none", background: "transparent",
                    borderRadius: 4, cursor: "pointer", color: "#9ca3af", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
                >
                  <SvgIcon d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - add section */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid #f3f4f6" }}>
        <button
          onClick={() => sendToParent("MEMBERWISE_INSERT_SECTION", { position: sections.length })}
          style={{
            width: "100%", padding: "6px 10px", border: "1px dashed #d1d5db",
            borderRadius: 7, background: "transparent", cursor: "pointer",
            fontSize: 11, fontWeight: 500, color: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 150ms", fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.background = "#f5f3ff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; }}
        >
          <SvgIcon d="M12 5v14M5 12h14" size={12} />
          Add Section
        </button>
      </div>
    </div>
  );
}

// ─── Zoom Controls ─────────────────────────────────
// Zoom slider + keyboard shortcuts (Cmd+=/Cmd+-)

export function ZoomControls({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange: (z: number) => void;
}) {
  return (
    <div
      data-visual-ui="zoom-controls"
      style={{
        display: "flex", alignItems: "center", gap: 4,
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}
    >
      <button
        onClick={() => onZoomChange(Math.max(25, zoom - 10))}
        title="Zoom Out (⌘−)"
        style={{
          width: 24, height: 24, border: "none", background: "transparent",
          borderRadius: 5, cursor: "pointer", color: "#6b7280", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <SvgIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM8 11h6" size={14} />
      </button>
      <input
        type="range"
        min={25}
        max={200}
        value={zoom}
        onChange={(e) => onZoomChange(parseInt(e.target.value))}
        style={{
          width: 60, height: 4, appearance: "none" as const, WebkitAppearance: "none",
          background: `linear-gradient(to right, #6366f1 ${((zoom - 25) / 175) * 100}%, #e5e7eb ${((zoom - 25) / 175) * 100}%)`,
          borderRadius: 2, outline: "none", cursor: "pointer",
        }}
        title={`${zoom}%`}
      />
      <button
        onClick={() => onZoomChange(Math.min(200, zoom + 10))}
        title="Zoom In (⌘+)"
        style={{
          width: 24, height: 24, border: "none", background: "transparent",
          borderRadius: 5, cursor: "pointer", color: "#6b7280", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <SvgIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 8v6M7 11h6" size={14} />
      </button>
      <button
        onClick={() => onZoomChange(100)}
        title="Reset to 100%"
        style={{
          fontSize: 10, fontWeight: 600, color: zoom === 100 ? "#6366f1" : "#9ca3af",
          border: "none", background: zoom === 100 ? "#eef2ff" : "transparent",
          borderRadius: 4, cursor: "pointer", padding: "2px 6px",
          fontFamily: "ui-monospace,monospace", transition: "all 150ms",
        }}
        onMouseEnter={(e) => { if (zoom !== 100) e.currentTarget.style.background = "#f3f4f6"; }}
        onMouseLeave={(e) => { if (zoom !== 100) e.currentTarget.style.background = "transparent"; }}
      >
        {zoom}%
      </button>
    </div>
  );
}

// ─── useZoomControls ───────────────────────────────
// Handles zoom keyboard shortcuts and applies CSS transform

export function useZoomControls(visualMode: boolean) {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!visualMode) {
      setZoom(100);
      document.body.style.transform = "";
      document.body.style.transformOrigin = "";
      return;
    }

    function handleKeydown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).contentEditable === "true") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      const metaOrCtrl = e.metaKey || e.ctrlKey;

      if (metaOrCtrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoom((z) => Math.min(200, z + 10));
      }
      if (metaOrCtrl && e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(25, z - 10));
      }
      if (metaOrCtrl && e.key === "0") {
        e.preventDefault();
        setZoom(100);
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [visualMode]);

  // Communicate zoom to parent (parent controls iframe sizing)
  useEffect(() => {
    if (!visualMode) return;
    if (window.parent !== window) {
      window.parent.postMessage({ type: "MEMBERWISE_ZOOM_CHANGE", zoom }, "*");
    }
  }, [zoom, visualMode]);

  return { zoom, setZoom };
}

// ─── Quick Style Presets ────────────────────────────
// One-click section style themes

interface StylePreset {
  label: string;
  icon: string;
  style: Record<string, string>;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    label: "Light",
    icon: "M12 3v1M12 20v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M20 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71",
    style: { backgroundColor: "#ffffff", color: "#111827" },
  },
  {
    label: "Dark",
    icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    style: { backgroundColor: "#111827", color: "#f9fafb" },
  },
  {
    label: "Primary",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    style: { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
  },
  {
    label: "Glass",
    icon: "M7 21h10M12 3v18M3 7l9 4 9-4",
    style: {
      backgroundColor: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid rgba(255,255,255,0.15)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
  },
  {
    label: "Gradient",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    style: {
      background: "linear-gradient(135deg, var(--primary) 0%, #ec4899 100%)",
      color: "#ffffff",
    },
  },
  {
    label: "Muted",
    icon: "M4 4h16v16H4V4z",
    style: { backgroundColor: "var(--muted)", color: "var(--foreground)" },
  },
  {
    label: "Card",
    icon: "M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z",
    style: {
      backgroundColor: "var(--card)",
      color: "var(--card-foreground)",
      borderRadius: "12px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      margin: "0 24px",
    },
  },
  {
    label: "Accent",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    style: { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
  },
];

export function QuickStylePresets({
  sectionId,
  onClose,
}: {
  sectionId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Position near the quick-style button on the selected section
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
    if (sectionEl) {
      const rect = sectionEl.getBoundingClientRect();
      setPos({
        x: Math.min(rect.right - 240, window.innerWidth - 260),
        y: Math.max(rect.bottom - 120, 8),
      });
    }

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, sectionId]);

  return (
    <div
      ref={ref}
      data-visual-ui="style-presets"
      style={{
        position: "fixed", left: pos.x, top: pos.y,
        zIndex: 10001, background: "#fff", borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: 8, fontFamily: "system-ui,-apple-system,sans-serif",
        animation: "mw-popover-in 150ms ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", padding: "2px 6px 6px", letterSpacing: "0.05em" }}>
        Quick Styles
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              sendToParent("MEMBERWISE_STYLE_UPDATE", { sectionId, updates: preset.style });
              showToast(`Applied ${preset.label} style`, "success");
            }}
            title={preset.label}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "6px 4px", border: "1px solid #e5e7eb", borderRadius: 8,
              background: "transparent", cursor: "pointer", transition: "all 150ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#f5f3ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "transparent"; }}
          >
            <SvgIcon d={preset.icon} size={14} />
            <span style={{ fontSize: 9, fontWeight: 500, color: "#374151" }}>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── useQuickStylePresets ──────────────────────────
// Adds a star button on selected section to show style presets

export function useQuickStylePresets(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId: string | null,
  onShowPresets: (sectionId: string) => void,
) {
  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;

    const sectionEl = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!sectionEl) return;

    const btn = document.createElement("div");
    btn.setAttribute("data-visual-ui", "quick-style-btn");
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    btn.title = "Quick Style Presets";
    btn.style.cssText = `
      position:absolute; bottom:8px; right:8px; z-index:50;
      width:32px; height:32px; border-radius:8px;
      background:rgba(99,102,241,0.9); color:#fff;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; backdrop-filter:blur(8px);
      animation:mw-popover-in 150ms ease;
      transition:transform 150ms, background 150ms;
    `;
    btn.onclick = (e) => {
      e.stopPropagation();
      onShowPresets(selectedSectionId);
    };
    btn.onmouseenter = () => { btn.style.transform = "scale(1.1)"; btn.style.background = "rgba(99,102,241,1)"; };
    btn.onmouseleave = () => { btn.style.transform = ""; btn.style.background = "rgba(99,102,241,0.9)"; };

    sectionEl.appendChild(btn);
    return () => { btn.remove(); };
  }, [visualMode, portalTarget, selectedSectionId, onShowPresets]);
}

// ─── Grid Overlay ──────────────────────────────────
// 12-column alignment grid overlay

export function GridOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      data-visual-ui="grid-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 9990,
        pointerEvents: "none",
        display: "flex", justifyContent: "center",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 1280, height: "100%",
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 0,
        padding: "0 24px",
      }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "rgba(99,102,241,0.04)",
              borderLeft: "1px solid rgba(99,102,241,0.08)",
              borderRight: i === 11 ? "1px solid rgba(99,102,241,0.08)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Bottom Toolbar ────────────────────────────────
// Fixed bottom bar with zoom, grid, layers, responsive controls

export function BottomToolbar({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showLayers,
  onToggleLayers,
  currentBreakpoint,
  onBreakpointChange,
}: {
  zoom: number;
  onZoomChange: (z: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showLayers: boolean;
  onToggleLayers: () => void;
  currentBreakpoint: "desktop" | "tablet" | "mobile";
  onBreakpointChange: (bp: "desktop" | "tablet" | "mobile") => void;
}) {
  return (
    <div
      data-visual-ui="bottom-toolbar"
      style={{
        position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 10001, display: "flex", alignItems: "center", gap: 6,
        background: "#fff", borderRadius: 12, padding: "4px 6px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        fontFamily: "system-ui,-apple-system,sans-serif",
        animation: "mw-popover-in 200ms ease",
      }}
    >
      {/* Layers toggle */}
      <BottomToolbarButton
        icon="M4 6h16M4 12h16M4 18h16"
        label={showLayers ? "Hide Layers" : "Show Layers (L)"}
        active={showLayers}
        onClick={onToggleLayers}
      />

      <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

      {/* Responsive breakpoints */}
      <ResponsivePreviewBar
        currentBreakpoint={currentBreakpoint}
        onBreakpointChange={onBreakpointChange}
      />

      <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

      {/* Grid toggle */}
      <BottomToolbarButton
        icon="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z"
        label={showGrid ? "Hide Grid" : "Show Grid (G)"}
        active={showGrid}
        onClick={onToggleGrid}
      />

      <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

      {/* Zoom controls */}
      <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />
    </div>
  );
}

function BottomToolbarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, border: "none", borderRadius: 7,
        background: active ? "#eef2ff" : "transparent",
        color: active ? "#4f46e5" : "#6b7280",
        cursor: "pointer", padding: 0, transition: "all 150ms",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <SvgIcon d={icon} size={16} />
    </button>
  );
}

// ─── Section Outline Flash ─────────────────────────
// Pulse highlight on section when selected from layers panel

export function useSectionFlash(
  visualMode: boolean,
  portalTarget: HTMLElement | null,
  selectedSectionId: string | null
) {
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!visualMode || !portalTarget || !selectedSectionId) return;
    if (prevId.current === selectedSectionId) return;
    prevId.current = selectedSectionId;

    const el = portalTarget.querySelector(`[data-section-id="${selectedSectionId}"]`) as HTMLElement;
    if (!el) return;

    el.style.transition = "box-shadow 300ms ease";
    el.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.3)";
    const timer = setTimeout(() => {
      el.style.boxShadow = "";
    }, 600);

    return () => clearTimeout(timer);
  }, [visualMode, portalTarget, selectedSectionId]);
}

// ─── Minimap ────────────────────────────────────────
// Tiny preview overview of all sections on the right side

export function Minimap({
  sections,
  selectedSectionId,
  onSelectSection,
}: {
  sections: SectionDocument[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
}) {
  const [sectionRects, setSectionRects] = useState<Map<string, { top: number; height: number }>>(new Map());
  const [viewportTop, setViewportTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [totalHeight, setTotalHeight] = useState(1);

  useEffect(() => {
    function measure() {
      const rects = new Map<string, { top: number; height: number }>();
      let maxBottom = 0;
      sections.forEach((s) => {
        const el = document.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement;
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = el.offsetTop;
          rects.set(s.id, { top, height: rect.height });
          maxBottom = Math.max(maxBottom, top + rect.height);
        }
      });
      setSectionRects(rects);
      setTotalHeight(Math.max(maxBottom, 1));
      setViewportTop(window.scrollY);
      setViewportHeight(window.innerHeight);
    }

    measure();

    function onScroll() { setViewportTop(window.scrollY); }
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", measure);

    let measureTimer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(measureTimer);
      measureTimer = setTimeout(measure, 200);
    });
    observer.observe(document.body, { childList: true, subtree: false });

    return () => {
      clearTimeout(measureTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [sections]);

  const minimapHeight = 300;
  const scale = minimapHeight / totalHeight;

  return (
    <div
      data-visual-ui="minimap"
      style={{
        position: "fixed", right: 12, top: "50%", transform: "translateY(-50%)",
        zIndex: 9999, width: 40, height: minimapHeight,
        background: "rgba(255,255,255,0.9)", borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        backdropFilter: "blur(8px)", overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const targetScroll = (clickY / minimapHeight) * totalHeight;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }}
    >
      {/* Viewport indicator */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: viewportTop * scale, height: Math.max(viewportHeight * scale, 8),
        background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 2, transition: "top 50ms linear",
      }} />

      {/* Section bars */}
      {sections.map((s) => {
        const rect = sectionRects.get(s.id);
        if (!rect) return null;
        const isSelected = s.id === selectedSectionId;
        return (
          <div
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection(s.id);
              document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            style={{
              position: "absolute", left: 3, right: 3,
              top: rect.top * scale, height: Math.max(rect.height * scale, 2),
              background: isSelected ? "rgba(99,102,241,0.5)" : s.visible === false ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)",
              borderRadius: 1, transition: "background 150ms",
            }}
            title={s.type.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
          />
        );
      })}
    </div>
  );
}
