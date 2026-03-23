import { ImageIcon } from "lucide-react";

interface GallerySectionProps {
  heading?: string;
  columns?: number;
  images?: string[];
}

export function GallerySection({ heading, columns = 3, images = [] }: GallerySectionProps) {
  const gridCols =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";

  // Show placeholders if no images
  const displayItems = images.length > 0 ? images : Array.from({ length: 6 }, () => "");

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        <div className={`grid gap-4 ${gridCols}`}>
          {displayItems.map((src, i) =>
            src ? (
              <div key={i} className="overflow-hidden rounded-[var(--radius)]" data-editable-image={`images.${i}`} data-array-item="images" data-item-index={i}>
                <img
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ) : (
              <div
                key={i}
                className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)]"
                data-editable-image={`images.${i}`}
                data-array-item="images"
                data-item-index={i}
              >
                <ImageIcon className="h-8 w-8 text-[var(--muted-foreground)]/40" />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
