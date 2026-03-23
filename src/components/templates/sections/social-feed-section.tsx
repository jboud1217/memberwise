"use client";

interface SocialFeedSectionProps {
  heading?: string;
  platform?: "instagram" | "facebook" | "twitter";
  embedCode?: string;
  profileUrl?: string;
}

export function SocialFeedSection({
  heading,
  platform = "instagram",
  embedCode,
  profileUrl,
}: SocialFeedSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {embedCode ? (
          <div
            className="mx-auto max-w-2xl"
            dangerouslySetInnerHTML={{ __html: embedCode }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
            <span className="text-3xl mb-3">
              {platform === "instagram" ? "📸" : platform === "facebook" ? "👤" : "🐦"}
            </span>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {platform.charAt(0).toUpperCase() + platform.slice(1)} Feed
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {profileUrl
                ? "Paste your embed code to display your feed"
                : "Add your profile URL and embed code"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
