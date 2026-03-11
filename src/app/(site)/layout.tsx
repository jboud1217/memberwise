import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/theme-provider";
import { getOrgSiteDocumentCached } from "@/lib/site-document";
import { headers } from "next/headers";
import Link from "next/link";
import type { SiteHeader, SiteFooter, SiteFonts } from "@/lib/types/site-document";

async function getOrgFromHost() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  // Prefer x-org-slug header set by middleware (subdomain or ?site= param)
  const slugHeader = headersList.get("x-org-slug");
  const slug = slugHeader || host.split(".")[0];

  return prisma.organization.findFirst({
    where: {
      OR: [{ slug }, { customDomain: host }],
    },
    select: { id: true, name: true, theme: true, logo: true },
  });
}

// ─── Data-driven Header ──────────────────────────────

function DataDrivenHeader({ header, siteName, logo }: { header: SiteHeader; siteName: string; logo?: string }) {
  const layoutClass =
    header.layout === "centered"
      ? "flex-col items-center gap-4"
      : header.layout === "logo-center"
        ? "flex-col items-center gap-2"
        : "items-center justify-between";

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-lg"
      style={header.style?.backgroundColor ? { backgroundColor: header.style.backgroundColor } : undefined}
    >
      <div className={`mx-auto flex max-w-5xl px-6 py-4 ${layoutClass}`}>
        {header.showLogo && (
          <Link href="/" className="flex items-center gap-2.5 group">
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logo} alt={siteName} className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.25)]">
                <span className="text-xs font-bold text-white">{siteName.charAt(0)}</span>
              </div>
            )}
            <span className="text-lg font-semibold tracking-tight text-[var(--card-foreground)] transition-colors group-hover:text-[var(--primary)]">{siteName}</span>
          </Link>
        )}
        <nav className={`flex items-center gap-1 ${header.layout === "logo-center" ? "flex-wrap justify-center" : ""}`}>
          {header.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
            >
              {link.label}
            </Link>
          ))}
          {header.ctaButton && (
            <Link
              href={header.ctaButton.href}
              className="ml-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_2px_8px_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] active:scale-[0.98]"
            >
              {header.ctaButton.label}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Data-driven Footer ──────────────────────────────

function DataDrivenFooter({ footer, siteName }: { footer: SiteFooter; siteName: string }) {
  const copyright = footer.copyright
    ?.replace("{year}", new Date().getFullYear().toString())
    ?.replace("{orgName}", siteName);

  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--card)]"
      style={footer.style?.backgroundColor ? { backgroundColor: footer.style.backgroundColor } : undefined}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        {footer.layout === "columns" && footer.columns && (
          <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            {footer.columns.map((col) => (
              <div key={col.heading}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--card-foreground)]">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className={`flex items-center ${footer.layout === "minimal" ? "justify-center" : "justify-between"} gap-4 pt-2`}>
          <p className="text-sm text-[var(--muted-foreground)]">
            {copyright || `\u00A9 ${new Date().getFullYear()} ${siteName}`}
          </p>
          {footer.socialLinks && footer.socialLinks.length > 0 && (
            <div className="flex gap-2">
              {footer.socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─── Font Loader ─────────────────────────────────────

function FontLoader({ fonts }: { fonts?: SiteFonts }) {
  if (!fonts) return null;
  const families = new Set([fonts.heading, fonts.body].filter(Boolean));
  if (families.size === 0) return null;
  const query = Array.from(families)
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={`https://fonts.googleapis.com/css2?${query}&display=swap`} rel="stylesheet" />
    </>
  );
}

// ─── Layout ──────────────────────────────────────────

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getOrgFromHost();
  const themeId = org?.theme || "modern-minimal";

  // Load the full S3-backed site document (with DB fallback)
  const siteDoc = org?.id ? await getOrgSiteDocumentCached(org.id) : null;

  // Theme variable overrides from the document
  const themeVarOverrides = siteDoc?.global.theme?.variables || {};

  // Build body font style
  const bodyFont = siteDoc?.global.fonts?.body;

  return (
    <ThemeProvider themeId={themeId}>
      <div
        className="min-h-screen bg-[var(--background)]"
        style={{
          ...themeVarOverrides,
          ...(bodyFont ? { fontFamily: `"${bodyFont}", sans-serif` } : {}),
        } as React.CSSProperties}
      >
        <FontLoader fonts={siteDoc?.global.fonts} />

        {/* Custom CSS injection */}
        {siteDoc?.global.customCss && (
          <style dangerouslySetInnerHTML={{ __html: siteDoc.global.customCss }} />
        )}

        {/* Data-driven header from SiteDocument */}
        {siteDoc?.global.header ? (
          <DataDrivenHeader
            header={siteDoc.global.header}
            siteName={org?.name || "MemberWise"}
            logo={org?.logo || siteDoc.global.logo}
          />
        ) : (
          <header className="border-b border-[var(--border)] bg-[var(--card)]">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
              <Link href="/" className="text-lg font-semibold text-[var(--card-foreground)]">
                {org?.name || "MemberWise"}
              </Link>
            </div>
          </header>
        )}

        <main>{children}</main>

        {/* Data-driven footer from SiteDocument */}
        {siteDoc?.global.footer && (
          <DataDrivenFooter footer={siteDoc.global.footer} siteName={org?.name || "MemberWise"} />
        )}
      </div>
    </ThemeProvider>
  );
}
