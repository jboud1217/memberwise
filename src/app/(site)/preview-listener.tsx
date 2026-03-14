"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PageDocument } from "@/lib/types/site-document";
import { SectionWrapper } from "@/components/templates/sections/section-wrapper";
import { renderSection } from "@/components/templates/sections";

/**
 * Listens for postMessage events from the dashboard Site Builder
 * and applies real-time theme/style/content updates without saving to S3.
 *
 * Only active when embedded in an iframe (Site Builder preview).
 */
export function PreviewListener() {
  const [draftPages, setDraftPages] = useState<PageDocument[] | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Only activate when embedded in an iframe (Site Builder preview)
    if (window.parent === window) return;

    // Signal to parent that we're ready
    window.parent.postMessage({ type: "MEMBERWISE_PREVIEW_READY" }, "*");

    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== "MEMBERWISE_PREVIEW_UPDATE") return;

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

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  // Render draft sections via portal
  if (!draftPages || !portalTarget) return null;

  const currentPath = window.location.pathname;
  const currentSlug = currentPath === "/" ? "landing" : currentPath.replace(/^\//, "");
  const page = draftPages.find((p) => p.slug === currentSlug);

  if (!page) return null;

  return createPortal(
    <>
      {page.sections
        .filter((s) => s.visible !== false)
        .map((section) => (
          <SectionWrapper key={section.id} style={section.style}>
            {renderSection({
              id: section.id,
              type: section.type,
              props: section.props,
            })}
          </SectionWrapper>
        ))}
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
