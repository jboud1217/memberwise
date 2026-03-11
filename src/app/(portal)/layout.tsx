import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/theme-provider";
import { TemplateProvider } from "@/lib/template-context";
import { getTemplateById } from "@/lib/templates";
import { TopBarNav } from "@/components/templates/nav/top-bar-nav";
import { SidebarNav } from "@/components/templates/nav/sidebar-nav";
import { MinimalTopNav } from "@/components/templates/nav/minimal-top-nav";
import type { PortalNavStyle } from "@/lib/templates";

const NAV_COMPONENTS: Record<PortalNavStyle, React.ComponentType> = {
  "top-bar": TopBarNav,
  sidebar: SidebarNav,
  "minimal-top": MinimalTopNav,
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let themeId = "modern-minimal";
  let templateId = "starter";
  let pageOverrides: Record<string, unknown> | null = null;

  const session = await auth();
  if (session?.user?.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { theme: true, layoutTemplate: true, pageOverrides: true },
    });
    if (org?.theme) themeId = org.theme;
    if (org?.layoutTemplate) templateId = org.layoutTemplate;
    if (org?.pageOverrides) pageOverrides = org.pageOverrides as Record<string, unknown>;
  }

  const template = getTemplateById(templateId);
  const NavComponent = NAV_COMPONENTS[template.portalNavStyle];
  const isSidebar = template.portalNavStyle === "sidebar";

  return (
    <ThemeProvider themeId={themeId}>
      <TemplateProvider template={template} overrides={pageOverrides}>
        <div className={`min-h-screen bg-[var(--background)] ${isSidebar ? "flex" : ""}`}>
          <NavComponent />
          <main className={isSidebar ? "flex-1 px-6 py-8" : "mx-auto max-w-5xl px-4 py-8"}>
            {children}
          </main>
        </div>
      </TemplateProvider>
    </ThemeProvider>
  );
}
