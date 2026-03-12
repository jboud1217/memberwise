import { Play } from "lucide-react";

interface VideoEmbedSectionProps {
  heading?: string;
  description?: string;
  videoUrl?: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function VideoEmbedSection({
  heading,
  description,
  videoUrl,
}: VideoEmbedSectionProps) {
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="mb-4 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {description && (
          <p className="mb-8 text-center text-lg text-[var(--muted-foreground)]">
            {description}
          </p>
        )}
        {embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius)] shadow-lg">
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title={heading || "Video"}
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)]">
            <div className="text-center">
              <Play className="mx-auto h-12 w-12 text-[var(--muted-foreground)]/40" />
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Add a YouTube or Vimeo URL
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
