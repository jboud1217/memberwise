import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrgSiteDocumentCached } from "@/lib/site-document";
import { SiteBuilder } from "./site-builder";

export default async function TemplateSettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      layoutTemplate: true,
      theme: true,
      slug: true,
      customDomain: true,
      name: true,
      siteDocumentUpdatedAt: true,
    },
  });

  const siteDoc = await getOrgSiteDocumentCached(session.user.organizationId);

  // Build site URL for preview
  let siteUrl: string | null = null;
  if (org?.customDomain) {
    siteUrl = `https://${org.customDomain}`;
  } else if (org?.slug) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    siteUrl = `${appUrl}?site=${org.slug}`;
  }

  return (
    <SiteBuilder
      siteDoc={siteDoc}
      siteUrl={siteUrl}
      currentTemplate={org?.layoutTemplate || "starter"}
      currentTheme={org?.theme || "modern-minimal"}
      siteName={org?.name || "Organization"}
      lastUpdated={org?.siteDocumentUpdatedAt?.toISOString()}
    />
  );
}
