import { ImageIcon } from "lucide-react";

interface ImageBannerSectionProps {
  imageUrl?: string;
  alt?: string;
  caption?: string;
  overlayText?: string;
  overlayPosition?: "center" | "bottom-left" | "bottom-right";
  height?: "small" | "medium" | "large" | "full";
  linkUrl?: string;
}

export function ImageBannerSection({
  imageUrl,
  alt = "",
  caption,
  overlayText,
  overlayPosition = "center",
  height = "medium",
  linkUrl,
}: ImageBannerSectionProps) {
  const heightClass =
    height === "small"
      ? "h-48 sm:h-64"
      : height === "large"
      ? "h-96 sm:h-[32rem]"
      : height === "full"
      ? "h-screen"
      : "h-64 sm:h-96";

  const positionClass =
    overlayPosition === "bottom-left"
      ? "items-end justify-start text-left p-8"
      : overlayPosition === "bottom-right"
      ? "items-end justify-end text-right p-8"
      : "items-center justify-center text-center";

  const content = imageUrl ? (
    <div className={`relative ${heightClass} w-full overflow-hidden`} data-editable-image="imageUrl">
      <img
        src={imageUrl}
        alt={alt}
        className="h-full w-full object-cover"
      />
      {overlayText && (
        <div className={`absolute inset-0 flex bg-black/40 ${positionClass}`}>
          <p className="max-w-2xl text-2xl font-bold text-white sm:text-4xl" data-editable-text="overlayText">
            {overlayText}
          </p>
        </div>
      )}
    </div>
  ) : (
    <div
      className={`flex ${heightClass} w-full items-center justify-center bg-[var(--muted)] border border-dashed border-[var(--border)]`}
      data-editable-image="imageUrl"
    >
      <div className="text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-[var(--muted-foreground)]/40" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Add an image</p>
      </div>
    </div>
  );

  return (
    <section className="py-4 px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[var(--radius)]">
        {linkUrl ? <a href={linkUrl} data-editable-link="linkUrl">{content}</a> : content}
        {caption && (
          <p className="mt-2 text-center text-sm text-[var(--muted-foreground)] italic" data-editable-text="caption">
            {caption}
          </p>
        )}
      </div>
    </section>
  );
}
