interface SocialLinkItem {
  platform: string;
  url: string;
  label?: string;
}

interface SocialLinksSectionProps {
  heading?: string;
  subheading?: string;
  links?: SocialLinkItem[];
  layout?: "horizontal" | "grid";
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "👤",
  instagram: "📸",
  twitter: "🐦",
  x: "𝕏",
  linkedin: "💼",
  youtube: "▶️",
  tiktok: "🎵",
  pinterest: "📌",
  github: "💻",
  discord: "💬",
  twitch: "🎮",
  reddit: "🔴",
  snapchat: "👻",
  whatsapp: "📱",
  telegram: "✈️",
  mastodon: "🐘",
};

export function SocialLinksSection({
  heading,
  subheading,
  links = [],
  layout = "horizontal",
}: SocialLinksSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl text-center">
        {heading && (
          <h2 className="mb-2 text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-8 text-lg text-[var(--muted-foreground)]" data-editable-text="subheading">{subheading}</p>
        )}
        {links.length > 0 ? (
          <div
            className={
              layout === "grid"
                ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                : "flex flex-wrap items-center justify-center gap-3"
            }
          >
            {links.map((link, i) => {
              const icon =
                PLATFORM_ICONS[link.platform.toLowerCase()] || "🔗";
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--card-foreground)] transition-all hover:border-[var(--primary)]/50 hover:shadow-sm"
                  data-array-item="links"
                  data-item-index={i}
                  data-editable-link={`links.${i}.url`}
                  data-link-text-path={`links.${i}.label`}
                >
                  <span className="text-lg">{icon}</span>
                  <span data-editable-text={`links.${i}.label`}>{link.label || link.platform}</span>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12">
            <p className="text-sm text-[var(--muted-foreground)]">Add your social media links</p>
          </div>
        )}
      </div>
    </section>
  );
}
