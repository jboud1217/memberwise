import type { PageTemplate, PageSection, SectionType } from "@/lib/templates";
import type { PageDocument, SectionDocument } from "@/lib/types/site-document";
import { renderSection } from "./sections";
import { SectionWrapper } from "./sections/section-wrapper";

// ─── Legacy renderer (DB-based with overrides) ─────────

interface LegacyPageRendererProps {
  page: PageTemplate;
  overrides?: Record<string, Record<string, unknown>>;
}

export function PageRenderer({ page, overrides }: LegacyPageRendererProps) {
  // If a custom layout exists, use it instead of the template default
  const layout = overrides?.__layout__ as unknown as { id: string; type: SectionType }[] | undefined;
  const sections: PageSection[] = layout
    ? layout.map((entry) => {
        const templateSection = page.sections.find((s) => s.id === entry.id);
        return {
          id: entry.id,
          type: entry.type,
          props: templateSection?.props || {},
        };
      })
    : page.sections;

  return (
    <div>
      {sections.map((section) => {
        const sectionOverrides = overrides?.[section.id];
        const mergedProps = sectionOverrides
          ? { ...section.props, ...sectionOverrides }
          : section.props;
        return renderSection({ ...section, props: mergedProps });
      })}
    </div>
  );
}

// ─── S3-backed renderer (SiteDocument) ──────────────────

interface SitePageRendererProps {
  page: PageDocument;
}

export function SitePageRenderer({ page }: SitePageRendererProps) {
  return (
    <div>
      {page.sections
        .filter((section) => section.visible !== false)
        .map((section) => (
          <SectionWrapper key={section.id} style={section.style}>
            {renderSection({
              id: section.id,
              type: section.type,
              props: section.props,
            })}
          </SectionWrapper>
        ))}
    </div>
  );
}
