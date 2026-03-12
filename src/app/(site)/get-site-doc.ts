import { prisma } from "@/lib/prisma";
import { getOrgSiteDocumentCached } from "@/lib/site-document";
import { headers } from "next/headers";
import type { SiteDocument } from "@/lib/types/site-document";

function resolveSlug(headersList: Headers): string {
  // Prefer x-org-slug header set by middleware (subdomain or ?site= param)
  const slugHeader = headersList.get("x-org-slug");
  if (slugHeader) return slugHeader;
  // Fallback: extract from host
  const host = headersList.get("host") || "";
  return host.split(".")[0];
}

export async function getSiteDoc(): Promise<SiteDocument | null> {
  const headersList = await headers();
  const slug = resolveSlug(headersList);
  const host = headersList.get("host") || "";
  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { customDomain: host }] },
    select: { id: true },
  });
  if (!org) return null;
  return getOrgSiteDocumentCached(org.id);
}
