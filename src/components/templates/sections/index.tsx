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
import { RichTextSection } from "./rich-text-section";
import { ImageBannerSection } from "./image-banner-section";
import { VideoEmbedSection } from "./video-embed-section";
import { CustomHtmlSection } from "./custom-html-section";
import { CardsSection } from "./cards-section";
import { PricingSection } from "./pricing-section";
import { TeamSection } from "./team-section";
import { LogoCloudSection } from "./logo-cloud-section";
import { TimelineSection } from "./timeline-section";
import { SocialFeedSection } from "./social-feed-section";
import { GoogleReviewsSection } from "./google-reviews-section";
import { GoogleMapSection } from "./google-map-section";
import { CalendarWidgetSection } from "./calendar-widget-section";
import { NewsletterSignupSection } from "./newsletter-signup-section";
import { CountdownSection } from "./countdown-section";
import { SocialLinksSection } from "./social-links-section";
import { SpacerSection } from "./spacer-section";
import { DividerSection } from "./divider-section";

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
  "rich-text": RichTextSection,
  "image-banner": ImageBannerSection,
  "video-embed": VideoEmbedSection,
  "custom-html": CustomHtmlSection,
  cards: CardsSection,
  pricing: PricingSection,
  team: TeamSection,
  "logo-cloud": LogoCloudSection,
  timeline: TimelineSection,
  "social-feed": SocialFeedSection,
  "google-reviews": GoogleReviewsSection,
  "google-map": GoogleMapSection,
  "calendar-widget": CalendarWidgetSection,
  "newsletter-signup": NewsletterSignupSection,
  countdown: CountdownSection,
  "social-links": SocialLinksSection,
  spacer: SpacerSection,
  divider: DividerSection,
};

export function renderSection(section: PageSection) {
  const Component = SECTION_MAP[section.type];
  if (!Component) return null;
  return <Component key={section.id} {...section.props} />;
}
