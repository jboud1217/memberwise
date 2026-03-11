import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSiteDocument as s3GetSiteDocument } from "@/lib/s3";
import { getTemplateById } from "@/lib/templates";
import { getThemeById } from "@/lib/themes";
import type { SiteDocument, SectionDocument, PageDocument } from "@/lib/types/site-document";
import { createEmptySiteDocument } from "@/lib/types/site-document";

/**
 * Get the SiteDocument for a given org. Uses React `cache()` for
 * request-level deduplication. Tries S3 first, falls back to building
 * from DB columns (legacy path).
 */
export const getOrgSiteDocumentCached = cache(async (orgId: string): Promise<SiteDocument | null> => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      siteDocumentKey: true,
      layoutTemplate: true,
      theme: true,
      pageOverrides: true,
      logo: true,
    },
  });
  if (!org) return null;

  // Try S3 first
  if (org.siteDocumentKey) {
    try {
      const doc = await s3GetSiteDocument(orgId);
      if (doc) return doc;
    } catch {
      // Fall through to DB-based construction
    }
  }

  // Fallback: build from DB (legacy)
  return buildFromDB(org);
});

function buildFromDB(org: {
  name: string;
  layoutTemplate: string | null;
  theme: string | null;
  pageOverrides: unknown;
  logo: string | null;
}): SiteDocument {
  const templateId = org.layoutTemplate || "starter";
  const themeId = org.theme || "modern-minimal";
  const template = getTemplateById(templateId);
  const theme = getThemeById(themeId);
  const overrides = (org.pageOverrides as Record<string, Record<string, Record<string, unknown>>>) || {};

  const doc = createEmptySiteDocument(templateId, org.name, themeId, theme?.variables || {});
  doc.global.logo = org.logo || undefined;
  doc.global.portalNavStyle = template.portalNavStyle;
  doc.global.header.navLinks = template.pages.map((p) => ({
    label: p.title,
    href: p.slug === "landing" ? "/" : `/${p.slug}`,
  }));

  doc.pages = template.pages.map((page): PageDocument => {
    const pageOverrides = overrides[page.slug] || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __layout__, ...sectionOverrides } = pageOverrides as Record<string, Record<string, unknown>>;
    const layout = __layout__ as unknown as { id: string; type: string }[] | undefined;

    const sections = layout
      ? layout.map((entry): SectionDocument => {
          const templateSection = page.sections.find((s) => s.id === entry.id);
          return {
            id: entry.id,
            type: entry.type as SectionDocument["type"],
            props: { ...(templateSection?.props || {}), ...(sectionOverrides[entry.id] || {}) },
            style: {},
            visible: true,
          };
        })
      : page.sections.map((section): SectionDocument => ({
          id: section.id,
          type: section.type as SectionDocument["type"],
          props: { ...section.props, ...(sectionOverrides[section.id] || {}) },
          style: {},
          visible: true,
        }));

    return { slug: page.slug, title: page.title, sections };
  });

  return doc;
}
