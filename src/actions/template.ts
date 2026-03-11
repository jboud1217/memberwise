"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getSiteDocument,
  putSiteDocument,
  snapshotSiteDocument,
  getPresignedUploadUrl as s3PresignedUpload,
  orgSiteKey,
} from "@/lib/s3";
import { getTemplateById } from "@/lib/templates";
import { getThemeById } from "@/lib/themes";
import type { SiteDocument, SectionDocument, SectionStyle, PageDocument } from "@/lib/types/site-document";
import { DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_SECTION_STYLE, createEmptySiteDocument } from "@/lib/types/site-document";

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/events");
  revalidatePath("/portal");
  revalidatePath("/settings/template");
}

// ─── Legacy Actions (DB-backed, still used as fallback) ────

export async function updatePageOverrides(
  pageSlug: string,
  sectionId: string,
  overrides: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { pageOverrides: true },
  });

  const current = (org?.pageOverrides as Record<string, Record<string, unknown>>) || {};
  const pageData = current[pageSlug] || {};
  pageData[sectionId] = { ...(pageData[sectionId] as Record<string, unknown>), ...overrides };
  current[pageSlug] = pageData;

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { pageOverrides: JSON.parse(JSON.stringify(current)) },
  });

  revalidateSite();
  return { success: true };
}

export async function savePageContent(
  pageSlug: string,
  sectionOverrides: Record<string, Record<string, unknown>>
) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { pageOverrides: true },
  });

  const current = (org?.pageOverrides as Record<string, Record<string, unknown>>) || {};
  current[pageSlug] = sectionOverrides;

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { pageOverrides: JSON.parse(JSON.stringify(current)) },
  });

  revalidateSite();
  return { success: true };
}

export async function getPageOverrides() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { pageOverrides: true, layoutTemplate: true },
  });

  return {
    overrides: (org?.pageOverrides as Record<string, unknown>) || {},
    layoutTemplate: org?.layoutTemplate || "starter",
  };
}

// ─── S3-backed Site Document Actions ─────────────────────

/**
 * Convert a template + theme into a full SiteDocument and upload to S3.
 * Called when a customer first selects a template or switches templates.
 */
export async function selectTemplate(templateId: string, themeId?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, theme: true, logo: true },
  });
  if (!org) throw new Error("Organization not found");

  const effectiveThemeId = themeId || org.theme || "modern-minimal";
  const template = getTemplateById(templateId);
  const theme = getThemeById(effectiveThemeId);

  // Build the SiteDocument from template
  const doc = createEmptySiteDocument(templateId, org.name, effectiveThemeId, theme?.variables || {});
  doc.global.logo = org.logo || undefined;
  doc.global.portalNavStyle = template.portalNavStyle;

  // Build header nav from template pages
  doc.global.header.navLinks = template.pages.map((p) => ({
    label: p.title,
    href: p.slug === "landing" ? "/" : `/${p.slug}`,
  }));

  // Convert template pages to SiteDocument pages
  doc.pages = template.pages.map((page): PageDocument => ({
    slug: page.slug,
    title: page.title,
    sections: page.sections.map((section): SectionDocument => ({
      id: section.id,
      type: section.type as SectionDocument["type"],
      props: { ...section.props },
      style: { ...DEFAULT_SECTION_STYLE },
      visible: true,
    })),
  }));

  // Snapshot existing doc if there is one
  await snapshotSiteDocument(orgId);

  // Upload to S3
  await putSiteDocument(orgId, doc);

  // Update DB
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      layoutTemplate: templateId,
      theme: effectiveThemeId,
      siteDocumentKey: orgSiteKey(orgId),
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Get the full SiteDocument for the current org.
 * Falls back to building from DB (template + pageOverrides) if no S3 doc exists.
 */
export async function getOrgSiteDocument(): Promise<SiteDocument | null> {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const orgId = session.user.organizationId;
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
    const doc = await getSiteDocument(orgId);
    if (doc) return doc;
  }

  // Fallback: build from DB (legacy path)
  return buildSiteDocumentFromDB(org);
}

/**
 * Save the entire SiteDocument to S3.
 */
export async function saveSiteDocument(doc: SiteDocument) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;

  // Snapshot before saving
  await snapshotSiteDocument(orgId);

  // Save to S3
  await putSiteDocument(orgId, doc);

  // Also sync key fields back to DB for quick access
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentKey: orgSiteKey(orgId),
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
      theme: doc.global.theme.baseThemeId,
      layoutTemplate: doc.sourceTemplateId,
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Save a single page within the site document.
 */
export async function saveSiteDocumentPage(pageSlug: string, page: PageDocument) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;

  // Get current doc
  const doc = await getSiteDocument(orgId);
  if (!doc) throw new Error("No site document found. Select a template first.");

  // Replace the page
  const pageIndex = doc.pages.findIndex((p) => p.slug === pageSlug);
  if (pageIndex >= 0) {
    doc.pages[pageIndex] = page;
  } else {
    doc.pages.push(page);
  }

  await putSiteDocument(orgId, doc);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Create a new page in the site document.
 */
export async function createPage(title: string, slug: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const doc = await getSiteDocument(orgId);
  if (!doc) throw new Error("No site document found. Select a template first.");

  if (doc.pages.some((p) => p.slug === slug)) {
    throw new Error(`Page with slug "${slug}" already exists`);
  }

  const newPage: PageDocument = {
    slug,
    title,
    sections: [
      {
        id: "hero",
        type: "hero",
        props: { heading: title, subheading: "Add your content here.", size: "small" },
        style: {},
        visible: true,
      },
    ],
  };

  doc.pages.push(newPage);
  await putSiteDocument(orgId, doc);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true, page: newPage };
}

/**
 * Rename a page (update title and/or slug).
 */
export async function renamePage(oldSlug: string, newTitle: string, newSlug: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const doc = await getSiteDocument(orgId);
  if (!doc) throw new Error("No site document found.");

  const page = doc.pages.find((p) => p.slug === oldSlug);
  if (!page) throw new Error(`Page "${oldSlug}" not found`);

  if (newSlug !== oldSlug && doc.pages.some((p) => p.slug === newSlug)) {
    throw new Error(`Page with slug "${newSlug}" already exists`);
  }

  page.title = newTitle;
  page.slug = newSlug;
  await putSiteDocument(orgId, doc);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Delete a page from the site document.
 */
export async function deletePage(slug: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const doc = await getSiteDocument(orgId);
  if (!doc) throw new Error("No site document found.");

  doc.pages = doc.pages.filter((p) => p.slug !== slug);
  await putSiteDocument(orgId, doc);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Update global site settings (header, footer, theme).
 */
export async function saveSiteGlobals(globals: Partial<SiteDocument["global"]>) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const doc = await getSiteDocument(orgId);
  if (!doc) throw new Error("No site document found. Select a template first.");

  doc.global = { ...doc.global, ...globals };
  await putSiteDocument(orgId, doc);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
      ...(globals.theme ? { theme: globals.theme.baseThemeId } : {}),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * Get a presigned URL for uploading an asset (image) to S3.
 */
export async function getAssetUploadUrl(filename: string, contentType: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  return s3PresignedUpload(session.user.organizationId, filename, contentType);
}

/**
 * Revert to the last snapshot.
 */
export async function revertSiteToSnapshot() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;
  const { revertToSnapshot } = await import("@/lib/s3");
  const doc = await revertToSnapshot(orgId);
  if (!doc) throw new Error("No snapshot found");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      siteDocumentVersion: { increment: 1 },
      siteDocumentUpdatedAt: new Date(),
    },
  });

  revalidateSite();
  return { success: true };
}

/**
 * List all uploaded assets for the current org.
 */
export async function listAssets() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const { listOrgAssets } = await import("@/lib/s3");
  return listOrgAssets(session.user.organizationId);
}

/**
 * Delete an uploaded asset.
 */
export async function deleteAsset(filename: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const { deleteOrgAsset } = await import("@/lib/s3");
  await deleteOrgAsset(session.user.organizationId, filename);
  return { success: true };
}

// ─── Helpers ──────────────────────────────────────────────

function buildSiteDocumentFromDB(org: {
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
          const mergedProps = {
            ...(templateSection?.props || {}),
            ...(sectionOverrides[entry.id] || {}),
          };
          return {
            id: entry.id,
            type: entry.type as SectionDocument["type"],
            props: mergedProps,
            style: {},
            visible: true,
          };
        })
      : page.sections.map((section): SectionDocument => {
          const mergedProps = {
            ...section.props,
            ...(sectionOverrides[section.id] || {}),
          };
          return {
            id: section.id,
            type: section.type as SectionDocument["type"],
            props: mergedProps,
            style: {},
            visible: true,
          };
        });

    return { slug: page.slug, title: page.title, sections };
  });

  return doc;
}
