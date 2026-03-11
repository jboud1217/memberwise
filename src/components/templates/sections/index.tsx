import type { PageSection } from "@/lib/templates";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { CtaSection } from "./cta-section";
import { TestimonialsSection } from "./testimonials-section";
import { StatsSection } from "./stats-section";
import { ContactFormSection } from "./contact-form-section";
import { EventsListSection } from "./events-list-section";
import { DirectoryGridSection } from "./directory-grid-section";
import { FaqSection } from "./faq-section";
import { GallerySection } from "./gallery-section";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_MAP: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  features: FeaturesSection,
  cta: CtaSection,
  testimonials: TestimonialsSection,
  stats: StatsSection,
  "contact-form": ContactFormSection,
  "events-list": EventsListSection,
  "directory-grid": DirectoryGridSection,
  faq: FaqSection,
  gallery: GallerySection,
};

export function renderSection(section: PageSection) {
  const Component = SECTION_MAP[section.type];
  if (!Component) return null;
  return <Component key={section.id} {...section.props} />;
}
