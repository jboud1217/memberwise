import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TemplatePicker } from "./template-picker";
import { PageEditor } from "./page-editor";
import { SiteGlobalsEditor } from "./site-globals-editor";
import { MediaLibrary } from "./media-library";
import { SnapshotControls } from "./snapshot-controls";
import { LivePreview } from "./live-preview";
import { getOrgSiteDocumentCached } from "@/lib/site-document";
import { DEFAULT_HEADER, DEFAULT_FOOTER } from "@/lib/types/site-document";
import {
  Layout,
  PanelTop,
  Image,
  FileText,
  History,
  Globe,
  Sparkles,
  Eye,
} from "lucide-react";

function SectionCard({
  icon: Icon,
  iconGradient,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${iconGradient} shadow-md`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default async function TemplateSettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { layoutTemplate: true, pageOverrides: true, slug: true, customDomain: true, name: true, siteDocumentUpdatedAt: true },
  });

  const siteDoc = await getOrgSiteDocumentCached(session.user.organizationId);

  // Build site URL for preview
  const siteUrl = org?.customDomain
    ? `https://${org.customDomain}`
    : org?.slug
      ? `http://${org.slug}.localhost:3000`
      : null;

  return (
    <div className="space-y-8 stagger-children">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--accent-foreground)]">
            <Sparkles className="h-3 w-3" />
            Site Builder
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Design Your Site</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Build and customize your public website and member portal
          </p>
        </div>
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_2px_12px_rgba(99,102,241,0.3)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98]"
          >
            <Globe className="h-4 w-4" />
            View Live Site
          </a>
        )}
      </div>

      {/* Live Preview */}
      {siteUrl && (
        <SectionCard
          icon={Eye}
          iconGradient="from-cyan-500 to-blue-600"
          title="Live Preview"
          description="Preview your site across different screen sizes"
        >
          <LivePreview siteUrl={siteUrl} />
        </SectionCard>
      )}

      {/* Template picker */}
      <SectionCard
        icon={Layout}
        iconGradient="from-indigo-500 to-purple-600"
        title="Layout Template"
        description="Choose a starting layout for your public site"
      >
        <TemplatePicker currentTemplate={org?.layoutTemplate || "starter"} />
      </SectionCard>

      {/* Header & Footer */}
      <SectionCard
        icon={PanelTop}
        iconGradient="from-violet-500 to-purple-600"
        title="Header, Footer & Styling"
        description="Customize navigation, colors, fonts, and footer content"
      >
        <SiteGlobalsEditor
          header={siteDoc?.global.header || DEFAULT_HEADER}
          footer={siteDoc?.global.footer || DEFAULT_FOOTER}
          siteName={org?.name || "Organization"}
          fonts={siteDoc?.global.fonts}
          themeVariables={siteDoc?.global.theme?.variables}
          customCss={siteDoc?.global.customCss}
        />
      </SectionCard>

      {/* Page Editor */}
      <SectionCard
        icon={FileText}
        iconGradient="from-blue-500 to-indigo-600"
        title="Page Content"
        description="Edit content and styling on each page, add sections, reorder with drag & drop"
      >
        <PageEditor
          templateId={org?.layoutTemplate || "starter"}
          currentOverrides={
            (org?.pageOverrides as Record<string, Record<string, Record<string, unknown>>>) || {}
          }
          siteSubdomain={org?.slug || ""}
          customDomain={org?.customDomain || undefined}
        />
      </SectionCard>

      {/* Media Library */}
      <SectionCard
        icon={Image}
        iconGradient="from-emerald-500 to-teal-600"
        title="Media Library"
        description="Upload and manage images for use across your site"
      >
        <MediaLibrary />
      </SectionCard>

      {/* Version History */}
      <SectionCard
        icon={History}
        iconGradient="from-amber-500 to-orange-600"
        title="Version History"
        description="Revert to a previous version of your site"
      >
        <SnapshotControls lastUpdated={org?.siteDocumentUpdatedAt?.toISOString()} />
      </SectionCard>
    </div>
  );
}
