"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { PageDocument } from "@/lib/types/site-document";
import { SectionWrapper } from "@/components/templates/sections/section-wrapper";
import { renderSection } from "@/components/templates/sections";
import {
  FloatingToolbar,
  InsertionPoint,
  SectionLabel,
  DragHandle,
  DropIndicator,
  VisualModeStyles,
  useInlineEditing,
  useContextMenu,
  ContextMenu,
  InlineIconPicker,
  useBackgroundDrag,
  useSpacingDrag,
  InlineLinkEditor,
  useStylePanel,
  SectionStylePanel,
  useDimensionOverlay,
  useAnimationPicker,
  AnimationPicker,
  useArrayAddItem,
  useSpacerResize,
  useEmptySectionHelper,
  useDividerControls,
  useVideoUrlEditor,
  useToastNotifications,
  useBreadcrumbs,
  useCopyPasteStyles,
  KeyboardShortcutOverlay,
  ResponsivePreviewBar,
  useSpacingVisualization,
  CommandPalette,
  useHoverStateEditor,
  showToast,
  LayersPanel,
  useZoomControls,
  useQuickStylePresets,
  QuickStylePresets,
  GridOverlay,
  BottomToolbar,
  useSectionFlash,
  Minimap,
} from "./visual-editing-ui";

/**
 * Listens for postMessage events from the dashboard Site Builder
 * and applies real-time theme/style/content updates without saving to S3.
 *
 * Only active when embedded in an iframe (Site Builder preview).
 */
export function PreviewListener() {
  const [draftPages, setDraftPages] = useState<PageDocument[] | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [visualMode, setVisualMode] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [iconPickerState, setIconPickerState] = useState<{
    target: HTMLElement;
    sectionId: string;
    propPath: string;
    currentIcon: string;
    rect: DOMRect;
  } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [responsiveBreakpoint, setResponsiveBreakpoint] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showLayers, setShowLayers] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [stylePresetsSection, setStylePresetsSection] = useState<string | null>(null);

  useEffect(() => {
    // Only activate when embedded in an iframe (Site Builder preview)
    if (window.parent === window) return;

    // Signal to parent that we're ready
    window.parent.postMessage({ type: "MEMBERWISE_PREVIEW_READY" }, "*");

    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "MEMBERWISE_PREVIEW_UPDATE") {
        const { themeVariables, fonts, customCss, header, footer, pages } = e.data.payload;

        // ─── Apply theme CSS variables ────────────────
        if (themeVariables) {
          const root = document.documentElement;
          const themedEl = document.querySelector("[data-theme-container]") as HTMLElement;
          const target = themedEl || root;

          Object.entries(themeVariables).forEach(([key, value]) => {
            target.style.setProperty(key, value as string);
          });
        }

        // ─── Apply font changes ───────────────────────
        if (fonts) {
          const families = new Set([fonts.heading, fonts.body].filter(Boolean));
          if (families.size > 0) {
            const query = Array.from(families)
              .map((f: string) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
              .join("&");
            const fontUrl = `https://fonts.googleapis.com/css2?${query}&display=swap`;

            if (!document.querySelector(`link[href="${fontUrl}"]`)) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = fontUrl;
              document.head.appendChild(link);
            }
          }

          if (fonts.body) {
            const themedEl = document.querySelector("[data-theme-container]") as HTMLElement;
            if (themedEl) {
              themedEl.style.fontFamily = `"${fonts.body}", sans-serif`;
            }
          }

          if (fonts.heading) {
            document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
              (el as HTMLElement).style.fontFamily = `"${fonts.heading}", sans-serif`;
            });
          }
        }

        // ─── Apply custom CSS ─────────────────────────
        if (customCss !== undefined) {
          let styleEl = document.getElementById("preview-custom-css");
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "preview-custom-css";
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = customCss;
        }

        // ─── Apply header changes ─────────────────────
        if (header) {
          applyHeaderChanges(header);
        }

        // ─── Apply footer changes ─────────────────────
        if (footer) {
          applyFooterChanges(footer);
        }

        // ─── Apply page content changes ───────────────
        if (pages) {
          setDraftPages(pages);
        }
      }

      // ─── Visual editing mode toggle ───────────────
      if (e.data?.type === "MEMBERWISE_VISUAL_MODE") {
        setVisualMode(e.data.enabled);
        if (!e.data.enabled) {
          setSelectedSectionId(null);
          setDraggingId(null);
          setDragOverIndex(null);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Click outside to deselect section
  useEffect(() => {
    if (!visualMode) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-section-id]") && !target.closest("[data-visual-ui]")) {
        setSelectedSectionId(null);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [visualMode]);

  // Listen for section selection from inline editing (custom event)
  useEffect(() => {
    if (!visualMode) return;

    function handleVisualSelect(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.sectionId) {
        setSelectedSectionId(detail.sectionId);
      }
    }

    document.addEventListener("visual-select-section", handleVisualSelect);
    return () => document.removeEventListener("visual-select-section", handleVisualSelect);
  }, [visualMode]);

  // ─── Global link/button/form interception in visual mode ───
  // Prevents ALL navigation, form submissions, and button actions
  // so the user can edit elements instead of triggering them.
  useEffect(() => {
    if (!visualMode) return;

    function interceptClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Don't intercept clicks on visual editor UI
      if (target.closest("[data-visual-ui]")) return;

      // Intercept all anchor clicks
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor && anchor.closest("[data-section-id]")) {
        e.preventDefault();
        // Don't stop propagation — let it bubble to section click / inline editing handlers
        return;
      }

      // Intercept button clicks that might have side effects (form submits, etc)
      const button = target.closest("button") as HTMLButtonElement | null;
      if (button && button.closest("[data-section-id]") && !button.closest("[data-visual-ui]")) {
        // Allow contentEditable interactions
        if (button.contentEditable === "true") return;
        e.preventDefault();
        return;
      }
    }

    function interceptSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      if (form.closest("[data-section-id]")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // Use capture phase to intercept before any other handlers
    document.addEventListener("click", interceptClick, true);
    document.addEventListener("submit", interceptSubmit, true);
    return () => {
      document.removeEventListener("click", interceptClick, true);
      document.removeEventListener("submit", interceptSubmit, true);
    };
  }, [visualMode]);

  // Get current page and sections
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const currentSlug = currentPath === "/" ? "landing" : currentPath.replace(/^\//, "");
  const page = draftPages?.find((p) => p.slug === currentSlug);
  // In visual mode, show ALL sections (including hidden ones) so users can toggle visibility
  // In normal mode, only show visible sections
  const visibleSections = visualMode
    ? (page?.sections || [])
    : (page?.sections.filter((s) => s.visible !== false) || []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!visualMode) return;

    function handleKeydown(e: KeyboardEvent) {
      // Don't capture when editing text
      if ((e.target as HTMLElement).contentEditable === "true") return;
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;

      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Escape — deselect section or signal exit visual mode
      if (e.key === "Escape") {
        if (selectedSectionId) {
          setSelectedSectionId(null);
        } else {
          window.parent.postMessage({ type: "MEMBERWISE_EXIT_VISUAL_MODE" }, "*");
        }
        return;
      }

      // Cmd+Z / Cmd+Shift+Z — forward undo/redo to parent
      if (metaOrCtrl && e.key === "z") {
        e.preventDefault();
        window.parent.postMessage({ type: e.shiftKey ? "MEMBERWISE_REDO" : "MEMBERWISE_UNDO" }, "*");
        return;
      }

      // Cmd+/ — toggle keyboard shortcuts overlay
      if (metaOrCtrl && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Cmd+K — toggle command palette
      if (metaOrCtrl && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      // L — toggle layers panel
      if (e.key === "l" && !metaOrCtrl) {
        e.preventDefault();
        setShowLayers((prev) => !prev);
        return;
      }

      // G — toggle grid overlay
      if (e.key === "g" && !metaOrCtrl) {
        e.preventDefault();
        setShowGrid((prev) => !prev);
        return;
      }

      if (!selectedSectionId) return;
      const sections = visibleSections;
      const idx = sections.findIndex((s) => s.id === selectedSectionId);
      if (idx === -1) return;

      // Delete / Backspace — remove section
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_DELETE", sectionId: selectedSectionId }, "*");
        showToast("Section deleted", "success");
        // Select next section or previous
        const next = sections[idx + 1] || sections[idx - 1];
        setSelectedSectionId(next?.id || null);
        return;
      }

      // Cmd+D — duplicate section
      if (metaOrCtrl && e.key === "d") {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_DUPLICATE", sectionId: selectedSectionId }, "*");
        showToast("Section duplicated", "success");
        return;
      }

      // Arrow Up — move section up (with Cmd/Ctrl) or select previous
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (metaOrCtrl && idx > 0) {
          window.parent.postMessage({ type: "MEMBERWISE_SECTION_MOVE", sectionId: selectedSectionId, direction: "up" }, "*");
        } else if (!metaOrCtrl && idx > 0) {
          setSelectedSectionId(sections[idx - 1].id);
          document.querySelector(`[data-section-id="${sections[idx - 1].id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Arrow Down — move section down (with Cmd/Ctrl) or select next
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (metaOrCtrl && idx < sections.length - 1) {
          window.parent.postMessage({ type: "MEMBERWISE_SECTION_MOVE", sectionId: selectedSectionId, direction: "down" }, "*");
        } else if (!metaOrCtrl && idx < sections.length - 1) {
          setSelectedSectionId(sections[idx + 1].id);
          document.querySelector(`[data-section-id="${sections[idx + 1].id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Cmd+C — copy section
      if (metaOrCtrl && e.key === "c") {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_COPY", sectionId: selectedSectionId }, "*");
        showToast("Section copied", "success");
        return;
      }

      // Cmd+V — paste section
      if (metaOrCtrl && e.key === "v") {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_PASTE", sectionId: selectedSectionId }, "*");
        showToast("Section pasted", "success");
        return;
      }

      // H — toggle visibility
      if (e.key === "h" && !metaOrCtrl) {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_TOGGLE_VISIBILITY", sectionId: selectedSectionId }, "*");
        showToast("Visibility toggled", "info");
        return;
      }

      // Enter — edit section properties
      if (e.key === "Enter" && !metaOrCtrl) {
        e.preventDefault();
        window.parent.postMessage({ type: "MEMBERWISE_SECTION_EDIT", sectionId: selectedSectionId }, "*");
        return;
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [visualMode, selectedSectionId, visibleSections]);

  // Set up portal target when draft pages arrive
  useEffect(() => {
    if (!draftPages) return;

    const main = document.querySelector("main");
    if (!main) return;

    // Hide original server-rendered children
    Array.from(main.children).forEach((child) => {
      const el = child as HTMLElement;
      if (el.dataset?.previewDraft) return;
      el.style.display = "none";
    });

    // Create or find the portal target
    let target = main.querySelector("[data-preview-draft]") as HTMLElement;
    if (!target) {
      target = document.createElement("div");
      target.setAttribute("data-preview-draft", "true");
      main.appendChild(target);
    }
    setPortalTarget(target);

    return () => {
      // Restore original children on cleanup
      Array.from(main.children).forEach((child) => {
        const el = child as HTMLElement;
        if (el.dataset?.previewDraft) {
          el.remove();
          return;
        }
        el.style.display = "";
      });
    };
  }, [draftPages]);

  // Set visual mode data attribute on body for CSS
  useEffect(() => {
    if (visualMode) {
      document.body.setAttribute("data-visual-mode", "true");
    } else {
      document.body.removeAttribute("data-visual-mode");
    }
  }, [visualMode]);

  // Apply persisted element styles from _elementStyles prop
  useEffect(() => {
    if (!portalTarget || !visibleSections.length) return;
    visibleSections.forEach((section) => {
      const elStyles = (section.props as Record<string, unknown>)._elementStyles as Record<string, Record<string, string>> | undefined;
      if (!elStyles) return;
      const sectionEl = portalTarget.querySelector(`[data-section-id="${section.id}"]`);
      if (!sectionEl) return;
      Object.entries(elStyles).forEach(([propPath, styles]) => {
        const el = sectionEl.querySelector(`[data-editable-text="${propPath}"], [data-editable-link="${propPath}"]`) as HTMLElement;
        if (el) {
          Object.entries(styles).forEach(([prop, value]) => {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
          });
        }
      });
    });
  }, [portalTarget, visibleSections]);

  // Inline editing hook (single-click when selected, double-click always)
  const handleOpenIconPicker = useCallback(
    (target: HTMLElement, sectionId: string, propPath: string, currentIcon: string) => {
      setIconPickerState({
        target,
        sectionId,
        propPath,
        currentIcon,
        rect: target.getBoundingClientRect(),
      });
    },
    []
  );
  const handleOpenImageEdit = useCallback(
    (sectionId: string, propPath: string) => {
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: "MEMBERWISE_IMAGE_EDIT", sectionId, propPath },
          "*"
        );
      }
    },
    []
  );

  // Link editor state
  const [linkEditorState, setLinkEditorState] = useState<{
    sectionId: string;
    linkPath: string;
    textPath: string;
    currentUrl: string;
    currentText: string;
    rect: DOMRect;
  } | null>(null);

  const handleOpenLinkEditor = useCallback(
    (sectionId: string, linkPath: string, textPath: string, currentUrl: string, currentText: string, rect: DOMRect) => {
      setLinkEditorState({ sectionId, linkPath, textPath, currentUrl, currentText, rect });
    },
    []
  );

  useInlineEditing(visualMode, portalTarget, visibleSections, selectedSectionId, handleOpenIconPicker, handleOpenImageEdit, handleOpenLinkEditor);

  // Background drag repositioning
  useBackgroundDrag(visualMode, portalTarget, selectedSectionId);

  // Spacing drag handles
  useSpacingDrag(visualMode, portalTarget, selectedSectionId);

  // Style panel (paintbrush button on selected section)
  const { styleState, closeStylePanel } = useStylePanel(visualMode, portalTarget, selectedSectionId);

  // Dimension overlay (padding/height measurements on selected section)
  useDimensionOverlay(visualMode, portalTarget, selectedSectionId);

  // Animation picker (effect + delay on selected section)
  const { animState, closeAnimPicker } = useAnimationPicker(visualMode, portalTarget, selectedSectionId);

  // Array add-item button
  useArrayAddItem(visualMode, portalTarget, selectedSectionId);

  // Spacer drag-to-resize
  useSpacerResize(visualMode, portalTarget, selectedSectionId);

  // Empty section helper (shows hint on sections with no editable content)
  useEmptySectionHelper(visualMode, portalTarget, selectedSectionId);

  // Divider section inline controls (style/width/color picker)
  useDividerControls(visualMode, portalTarget, selectedSectionId, visibleSections);

  // Video URL inline editor (shows URL input when video-embed has no video)
  useVideoUrlEditor(visualMode, portalTarget, selectedSectionId, visibleSections);

  // Toast notifications
  useToastNotifications(visualMode, portalTarget);

  // Breadcrumb bar (shows element ancestry on hover)
  useBreadcrumbs(visualMode, portalTarget, selectedSectionId, visibleSections);

  // Copy/paste styles (Cmd+Alt+C / Cmd+Alt+V)
  useCopyPasteStyles(visualMode, portalTarget, selectedSectionId);

  // Spacing visualization (green padding overlays on selected section)
  useSpacingVisualization(visualMode, portalTarget, selectedSectionId);

  // Hover state preview toggle
  useHoverStateEditor(visualMode, portalTarget, selectedSectionId);

  // Zoom controls (Cmd+=/Cmd+-/Cmd+0)
  const { zoom, setZoom } = useZoomControls(visualMode);

  // Quick style presets (star button on selected section)
  const handleShowPresets = useCallback((sectionId: string) => {
    setStylePresetsSection(sectionId);
  }, []);
  useQuickStylePresets(visualMode, portalTarget, selectedSectionId, handleShowPresets);

  // Section flash animation on selection
  useSectionFlash(visualMode, portalTarget, selectedSectionId);

  // Responsive breakpoint communication to parent
  useEffect(() => {
    if (!visualMode) return;
    if (window.parent !== window) {
      window.parent.postMessage({ type: "MEMBERWISE_VIEWPORT_CHANGE", breakpoint: responsiveBreakpoint }, "*");
    }
  }, [responsiveBreakpoint, visualMode]);

  // Right-click context menu
  const { menu: contextMenu, closeMenu } = useContextMenu(visualMode, portalTarget, visibleSections);

  // Render draft sections via portal
  if (!draftPages || !portalTarget) return null;
  if (!page) return null;

  return createPortal(
    <>
      {visualMode && <VisualModeStyles />}

      {/* Context menu */}
      {contextMenu && <ContextMenu menu={contextMenu} onClose={closeMenu} />}

      {/* Inline icon picker */}
      {iconPickerState && (
        <InlineIconPicker
          state={iconPickerState}
          onSelect={(sectionId, propPath, icon) => {
            if (window.parent !== window) {
              window.parent.postMessage(
                { type: "MEMBERWISE_INLINE_EDIT", sectionId, propPath, value: icon },
                "*"
              );
            }
          }}
          onClose={() => setIconPickerState(null)}
        />
      )}

      {/* Inline link editor */}
      {linkEditorState && (
        <InlineLinkEditor
          state={linkEditorState}
          onSave={(sectionId, updates) => {
            if (window.parent !== window) {
              window.parent.postMessage(
                { type: "MEMBERWISE_LINK_EDIT", sectionId, updates },
                "*"
              );
            }
          }}
          onClose={() => setLinkEditorState(null)}
        />
      )}

      {/* Section style panel */}
      {styleState && (
        <SectionStylePanel
          state={styleState}
          onUpdate={(sectionId, updates) => {
            if (window.parent !== window) {
              window.parent.postMessage(
                { type: "MEMBERWISE_STYLE_UPDATE", sectionId, updates },
                "*"
              );
            }
          }}
          onClose={closeStylePanel}
        />
      )}

      {/* Animation picker */}
      {animState && (
        <AnimationPicker
          state={animState}
          onUpdate={(sectionId, animation, delay) => {
            if (window.parent !== window) {
              window.parent.postMessage(
                { type: "MEMBERWISE_ANIMATION_UPDATE", sectionId, animation, delay },
                "*"
              );
            }
          }}
          onClose={closeAnimPicker}
        />
      )}

      {/* Keyboard shortcuts cheatsheet */}
      {showShortcuts && <KeyboardShortcutOverlay onClose={() => setShowShortcuts(false)} />}

      {/* Command palette */}
      {showCommandPalette && (
        <CommandPalette
          actions={[
            ...visibleSections.map((s, i) => ({
              id: `section-${s.id}`,
              label: s.type.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" "),
              category: "Sections",
              icon: "M4 6h16M4 12h16M4 18h16",
              action: () => {
                setSelectedSectionId(s.id);
                document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              },
            })),
            { id: "undo", label: "Undo", category: "Edit", shortcut: "⌘Z", icon: "M3 10h10a5 5 0 015 5v2a5 5 0 01-5 5H3", action: () => window.parent.postMessage({ type: "MEMBERWISE_UNDO" }, "*") },
            { id: "redo", label: "Redo", category: "Edit", shortcut: "⌘⇧Z", icon: "M21 10H11a5 5 0 00-5 5v2a5 5 0 005 5h10", action: () => window.parent.postMessage({ type: "MEMBERWISE_REDO" }, "*") },
            { id: "add-section", label: "Add Section", category: "Edit", icon: "M12 5v14M5 12h14", action: () => window.parent.postMessage({ type: "MEMBERWISE_INSERT_SECTION", position: visibleSections.length }, "*") },
            { id: "toggle-layers", label: "Toggle Layers Panel", category: "View", shortcut: "L", icon: "M4 6h16M4 12h16M4 18h16", action: () => setShowLayers((p) => !p) },
            { id: "toggle-grid", label: "Toggle Grid Overlay", category: "View", shortcut: "G", icon: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z", action: () => setShowGrid((p) => !p) },
            { id: "zoom-in", label: "Zoom In", category: "View", shortcut: "⌘+", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 8v6M7 11h6", action: () => setZoom((z) => Math.min(200, z + 10)) },
            { id: "zoom-out", label: "Zoom Out", category: "View", shortcut: "⌘−", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM8 11h6", action: () => setZoom((z) => Math.max(25, z - 10)) },
            { id: "zoom-reset", label: "Reset Zoom", category: "View", shortcut: "⌘0", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", action: () => setZoom(100) },
            { id: "shortcuts", label: "Keyboard Shortcuts", category: "Help", shortcut: "⌘/", icon: "M18 3a3 3 0 00-3 3v12a3 3 0 003 3M6 3a3 3 0 013 3v12a3 3 0 01-3 3", action: () => setShowShortcuts(true) },
            { id: "exit-visual", label: "Exit Visual Mode", category: "Navigation", shortcut: "Esc", icon: "M18 6L6 18M6 6l12 12", action: () => window.parent.postMessage({ type: "MEMBERWISE_EXIT_VISUAL_MODE" }, "*") },
          ]}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {/* Layers panel */}
      {visualMode && showLayers && (
        <LayersPanel
          sections={visibleSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* Grid overlay */}
      {visualMode && <GridOverlay visible={showGrid} />}

      {/* Minimap */}
      {visualMode && visibleSections.length > 3 && (
        <Minimap
          sections={visibleSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
        />
      )}

      {/* Quick style presets popover */}
      {stylePresetsSection && (
        <QuickStylePresets
          sectionId={stylePresetsSection}
          onClose={() => setStylePresetsSection(null)}
        />
      )}

      {/* Bottom toolbar with zoom, grid, layers, responsive */}
      {visualMode && (
        <BottomToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((p) => !p)}
          showLayers={showLayers}
          onToggleLayers={() => setShowLayers((p) => !p)}
          currentBreakpoint={responsiveBreakpoint}
          onBreakpointChange={setResponsiveBreakpoint}
        />
      )}

      {/* First insertion point */}
      {visualMode && <InsertionPoint position={0} />}

      {visibleSections.map((section, index) => (
        <div key={section.id}>
          <div
            data-section-id={section.id}
            onDragOver={(e) => {
              if (!visualMode || !draggingId || draggingId === section.id) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const rect = e.currentTarget.getBoundingClientRect();
              const midY = rect.top + rect.height / 2;
              // Show indicator above or below based on cursor position
              setDragOverIndex(e.clientY < midY ? index : index + 1);
            }}
            onDragLeave={() => {
              // Only clear if leaving the section entirely
              setDragOverIndex(null);
            }}
            onDrop={(e) => {
              if (!visualMode) return;
              e.preventDefault();
              const draggedId = e.dataTransfer.getData("text/plain");
              if (draggedId && dragOverIndex !== null) {
                window.parent.postMessage(
                  {
                    type: "MEMBERWISE_SECTION_REORDER",
                    sectionId: draggedId,
                    newIndex: dragOverIndex,
                  },
                  "*"
                );
              }
              setDraggingId(null);
              setDragOverIndex(null);
            }}
            onClick={(e) => {
              // Don't handle if clicking on a contentEditable element
              if ((e.target as HTMLElement).contentEditable === "true") return;
              // Don't handle if clicking on visual editor UI (toolbar, drag handle, etc.)
              if ((e.target as HTMLElement).closest("[data-visual-ui]")) return;

              if (visualMode) {
                setSelectedSectionId(section.id);
              }
              // Always notify parent of section click
              if (window.parent !== window) {
                window.parent.postMessage(
                  { type: "MEMBERWISE_SECTION_CLICK", sectionId: section.id },
                  "*"
                );
              }
            }}
            style={{
              position: "relative",
              outline:
                visualMode && selectedSectionId === section.id
                  ? "2px solid var(--primary, #6366f1)"
                  : "2px solid transparent",
              outlineOffset: "-2px",
              transition: "outline-color 150ms ease, opacity 200ms ease",
              cursor: visualMode ? "default" : "default",
              opacity: draggingId === section.id ? 0.4 : section.visible === false && visualMode ? 0.35 : 1,
              filter: section.visible === false && visualMode ? "grayscale(0.5)" : undefined,
            }}
            onMouseEnter={(e) => {
              if (visualMode && selectedSectionId !== section.id && draggingId !== section.id) {
                e.currentTarget.style.outline = "2px dashed var(--primary, #6366f1)";
                e.currentTarget.style.outlineOffset = "-2px";
              }
            }}
            onMouseLeave={(e) => {
              if (visualMode && selectedSectionId !== section.id) {
                e.currentTarget.style.outline = "2px solid transparent";
              }
            }}
          >
            {/* Section label */}
            {visualMode && (
              <SectionLabel type={section.type} selected={selectedSectionId === section.id} />
            )}

            {/* Drag handle — only drag trigger for sections */}
            {visualMode && (
              <DragHandle
                sectionId={section.id}
                onDragStart={(id) => setDraggingId(id)}
                onDragEnd={() => { setDraggingId(null); setDragOverIndex(null); }}
              />
            )}

            {/* Floating toolbar for selected section */}
            {visualMode && selectedSectionId === section.id && (
              <div data-visual-ui="toolbar">
                <FloatingToolbar
                  sectionId={section.id}
                  sectionType={section.type}
                  isFirst={index === 0}
                  isLast={index === visibleSections.length - 1}
                  isHidden={section.visible === false}
                />
              </div>
            )}

            {/* Drop indicator */}
            {dragOverIndex === index && draggingId && draggingId !== section.id && (
              <DropIndicator />
            )}

            <SectionWrapper style={section.style}>
              {renderSection({
                id: section.id,
                type: section.type,
                props: section.props,
              })}
            </SectionWrapper>
          </div>

          {/* Insertion point between sections */}
          {visualMode && <InsertionPoint position={index + 1} />}
        </div>
      ))}

      {/* Drop indicator at the very end */}
      {dragOverIndex === visibleSections.length && draggingId && (
        <div
          style={{
            height: 3,
            background: "var(--primary, #6366f1)",
            borderRadius: 2,
            boxShadow: "0 0 8px rgba(99,102,241,0.5)",
            marginTop: -1,
          }}
        />
      )}
    </>,
    portalTarget
  );
}

function applyHeaderChanges(header: {
  layout?: string;
  showLogo?: boolean;
  navLinks?: { label: string; href: string; external?: boolean }[];
  ctaButton?: { label: string; href: string } | null;
}) {
  const headerEl = document.querySelector("header");
  if (!headerEl) return;

  const nav = headerEl.querySelector("nav");
  if (nav && header.navLinks) {
    const existingLinks = nav.querySelectorAll("a:not([data-cta])");
    existingLinks.forEach((el) => el.remove());

    const ctaEl = nav.querySelector("[data-cta]");
    header.navLinks.forEach((link) => {
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      a.className = "rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]";
      if (link.external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      if (ctaEl) {
        nav.insertBefore(a, ctaEl);
      } else {
        nav.appendChild(a);
      }
    });

    if (header.ctaButton) {
      let cta = nav.querySelector("[data-cta]") as HTMLAnchorElement;
      if (!cta) {
        cta = document.createElement("a") as HTMLAnchorElement;
        cta.setAttribute("data-cta", "true");
        cta.className = "ml-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_2px_8px_rgba(99,102,241,0.25)]";
        nav.appendChild(cta);
      }
      cta.textContent = header.ctaButton.label;
      cta.href = header.ctaButton.href;
    } else {
      const cta = nav.querySelector("[data-cta]");
      cta?.remove();
    }
  }
}

function applyFooterChanges(footer: {
  copyright?: string;
  socialLinks?: { platform: string; url: string }[];
}) {
  const footerEl = document.querySelector("footer");
  if (!footerEl) return;

  if (footer.copyright) {
    const copyrightEl = footerEl.querySelector("p");
    if (copyrightEl) {
      copyrightEl.textContent = footer.copyright
        .replace("{year}", new Date().getFullYear().toString())
        .replace("{orgName}", document.title || "");
    }
  }
}
