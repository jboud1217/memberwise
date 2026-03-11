/**
 * SiteDocument — the fully-resolved site definition stored per-org on S3.
 *
 * When a customer selects a template, the catalog template is deep-cloned
 * into their org's S3 location. All edits mutate this document directly.
 * Rendering reads this document (cached) — no merge logic at render time.
 */

export interface SectionStyle {
  backgroundColor?: string;
  textColor?: string;
  padding?: { top: string; bottom: string };
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  backgroundImage?: string;
  backgroundOverlay?: string;
  borderRadius?: string;
  customClassName?: string;
  fontFamily?: string;
}

export interface SiteFonts {
  heading: string;
  body: string;
}

export const AVAILABLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Playfair Display",
  "Merriweather",
  "Source Sans 3",
  "Nunito",
  "Work Sans",
  "DM Sans",
  "Outfit",
  "Space Grotesk",
  "IBM Plex Sans",
  "Libre Baskerville",
  "Crimson Text",
  "Bitter",
  "Josefin Sans",
] as const;

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface SiteHeader {
  layout: "centered" | "left-aligned" | "logo-center";
  showLogo: boolean;
  navLinks: NavLink[];
  ctaButton?: { label: string; href: string };
  style: SectionStyle;
}

export interface SiteFooter {
  layout: "simple" | "columns" | "minimal";
  columns?: FooterColumn[];
  copyright?: string;
  socialLinks?: SocialLink[];
  style: SectionStyle;
}

export interface SiteTheme {
  baseThemeId: string;
  variables: Record<string, string>;
}

export interface SiteGlobal {
  siteName: string;
  logo?: string;
  favicon?: string;
  portalNavStyle: "top-bar" | "sidebar" | "minimal-top";
  theme: SiteTheme;
  fonts?: SiteFonts;
  customCss?: string;
  header: SiteHeader;
  footer: SiteFooter;
}

export type SectionType =
  | "hero"
  | "features"
  | "cta"
  | "testimonials"
  | "stats"
  | "contact-form"
  | "events-list"
  | "directory-grid"
  | "faq"
  | "gallery";

export interface SectionDocument {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
  style: SectionStyle;
  visible: boolean;
}

export interface PageDocument {
  slug: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: SectionDocument[];
}

export interface SiteDocument {
  version: 2;
  sourceTemplateId: string;
  sourceTemplateVersion: string;
  lastModified: string;
  global: SiteGlobal;
  pages: PageDocument[];
}

// ─── Defaults ─────────────────────────────────────────

export const DEFAULT_SECTION_STYLE: SectionStyle = {};

export const DEFAULT_HEADER: SiteHeader = {
  layout: "left-aligned",
  showLogo: true,
  navLinks: [],
  style: {},
};

export const DEFAULT_FOOTER: SiteFooter = {
  layout: "simple",
  copyright: "© {year} {orgName}. All rights reserved.",
  style: {},
};

// ─── Helpers ──────────────────────────────────────────

export function createEmptySiteDocument(
  templateId: string,
  orgName: string,
  themeId: string,
  themeVars: Record<string, string>
): SiteDocument {
  return {
    version: 2,
    sourceTemplateId: templateId,
    sourceTemplateVersion: "1.0.0",
    lastModified: new Date().toISOString(),
    global: {
      siteName: orgName,
      portalNavStyle: "top-bar",
      theme: { baseThemeId: themeId, variables: themeVars },
      header: {
        ...DEFAULT_HEADER,
        navLinks: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Events", href: "/events" },
          { label: "Contact", href: "/contact" },
        ],
      },
      footer: {
        ...DEFAULT_FOOTER,
        copyright: `© ${new Date().getFullYear()} ${orgName}. All rights reserved.`,
      },
    },
    pages: [],
  };
}
