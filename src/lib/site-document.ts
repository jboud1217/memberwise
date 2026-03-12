import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getTemplateById } from "@/lib/templates";
import { getThemeById } from "@/lib/themes";
import type { SiteDocument, SectionDocument, PageDocument } from "@/lib/types/site-document";
import { createEmptySiteDocument } from "@/lib/types/site-document";

/**
 * Get the SiteDocument for a given org. Uses React `cache()` for
 * request-level deduplication. Reads from:
 *   1. DB `siteDocument` JSON column (primary)
 *   2. S3 via siteDocumentKey (if configured)
 *   3. Build from template + pageOverrides (legacy fallback)
 */
export const getOrgSiteDocumentCached = cache(async (orgId: string): Promise<SiteDocument | null> => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      siteDocument: true,
      siteDocumentKey: true,
      layoutTemplate: true,
      theme: true,
      pageOverrides: true,
      logo: true,
    },
  });
  if (!org) return null;

  // 1. Try DB-stored document first
  if (org.siteDocument) {
    return org.siteDocument as unknown as SiteDocument;
  }

  // 2. Try S3 if key exists and AWS is configured
  if (org.siteDocumentKey && process.env.AWS_ACCESS_KEY_ID) {
    try {
      const { getSiteDocument: s3GetSiteDocument } = await import("@/lib/s3");
      const doc = await s3GetSiteDocument(orgId);
      if (doc) return doc;
    } catch {
      // Fall through to DB-based construction
    }
  }

  // 3. Fallback: build from template + pageOverrides
  return buildFromDB(org);
});

/**
 * Save SiteDocument. Writes to DB JSON column (always), and to S3 (if configured).
 */
export async function saveSiteDocumentForOrg(orgId: string, doc: SiteDocument): Promise<void> {
  doc.lastModified = new Date().toISOString();

  // Always save to DB
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocument: JSON.parse(JSON.stringify(doc)),
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
      theme: doc.global.theme.baseThemeId,
      layoutTemplate: doc.sourceTemplateId,
    },
  });

  // Also save to S3 if configured
  if (process.env.AWS_ACCESS_KEY_ID) {
    try {
      const { putSiteDocument, orgSiteKey } = await import("@/lib/s3");
      await putSiteDocument(orgId, doc);
      // Update the S3 key reference
      await prisma.organization.update({
        where: { id: orgId },
        data: { siteDocumentKey: orgSiteKey(orgId) },
      });
    } catch {
      // S3 save failed but DB save succeeded — that's fine
    }
  }
}

/**
 * Snapshot the current document before overwriting.
 */
export async function snapshotSiteDocumentForOrg(orgId: string): Promise<void> {
  // Read current document
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { siteDocument: true },
  });
  if (!org?.siteDocument) return;

  // Store snapshot in a separate JSON column or just rely on S3
  if (process.env.AWS_ACCESS_KEY_ID) {
    try {
      const { snapshotSiteDocument } = await import("@/lib/s3");
      await snapshotSiteDocument(orgId);
    } catch {
      // Snapshot failed — non-critical
    }
  }
}

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
