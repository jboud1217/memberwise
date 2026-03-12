"use client";

import { useEffect } from "react";

/**
 * Listens for postMessage events from the dashboard Site Builder
 * and applies real-time theme/style updates without saving to S3.
 *
 * Only active when the URL has ?_preview=1
 */
export function PreviewListener() {
  useEffect(() => {
    // Only activate when embedded in an iframe (Site Builder preview)
    if (window.parent === window) return;

    // Signal to parent that we're ready
    window.parent.postMessage({ type: "MEMBERWISE_PREVIEW_READY" }, "*");

    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== "MEMBERWISE_PREVIEW_UPDATE") return;

      const { themeVariables, fonts, customCss, header, footer } = e.data.payload;

      // ─── Apply theme CSS variables ────────────────
      if (themeVariables) {
        const root = document.documentElement;
        // Also check the first themed container
        const themedEl = document.querySelector("[data-theme-container]") as HTMLElement;
        const target = themedEl || root;

        Object.entries(themeVariables).forEach(([key, value]) => {
          target.style.setProperty(key, value as string);
        });
      }

      // ─── Apply font changes ───────────────────────
      if (fonts) {
        // Load fonts via Google Fonts
        const families = new Set([fonts.heading, fonts.body].filter(Boolean));
        if (families.size > 0) {
          const query = Array.from(families)
            .map((f: string) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
            .join("&");
          const fontUrl = `https://fonts.googleapis.com/css2?${query}&display=swap`;

          // Only add if not already loaded
          if (!document.querySelector(`link[href="${fontUrl}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = fontUrl;
            document.head.appendChild(link);
          }
        }

        // Apply body font
        if (fonts.body) {
          const themedEl = document.querySelector("[data-theme-container]") as HTMLElement;
          if (themedEl) {
            themedEl.style.fontFamily = `"${fonts.body}", sans-serif`;
          }
        }

        // Apply heading font to all headings
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
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function applyHeaderChanges(header: {
  layout?: string;
  showLogo?: boolean;
  navLinks?: { label: string; href: string; external?: boolean }[];
  ctaButton?: { label: string; href: string } | null;
}) {
  const headerEl = document.querySelector("header");
  if (!headerEl) return;

  // Update nav links
  const nav = headerEl.querySelector("nav");
  if (nav && header.navLinks) {
    // Clear existing nav links
    const existingLinks = nav.querySelectorAll("a:not([data-cta])");
    existingLinks.forEach((el) => el.remove());

    // Add new links before CTA
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

    // Update or create CTA button
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

  // Update copyright text
  if (footer.copyright) {
    const copyrightEl = footerEl.querySelector("p");
    if (copyrightEl) {
      copyrightEl.textContent = footer.copyright
        .replace("{year}", new Date().getFullYear().toString())
        .replace("{orgName}", document.title || "");
    }
  }
}
