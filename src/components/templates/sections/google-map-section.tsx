import { MapPin } from "lucide-react";

interface GoogleMapSectionProps {
  heading?: string;
  embedUrl?: string;
  address?: string;
  height?: "small" | "medium" | "large";
}

export function GoogleMapSection({
  heading,
  embedUrl,
  address,
  height = "medium",
}: GoogleMapSectionProps) {
  const heightClass =
    height === "small" ? "h-64" : height === "large" ? "h-[32rem]" : "h-96";

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-5xl">
        {heading && (
          <h2 className="mb-4 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {address && (
          <p className="mb-6 text-center text-[var(--muted-foreground)]" data-editable-text="address">
            <MapPin className="mr-1 inline h-4 w-4" />
            {address}
          </p>
        )}
        {embedUrl ? (
          <div className={`${heightClass} w-full overflow-hidden rounded-[var(--radius)] shadow-md`}>
            <iframe
              src={embedUrl}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={heading || "Google Map"}
            />
          </div>
        ) : (
          <div
            className={`flex ${heightClass} w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)]`}
          >
            <div className="text-center">
              <MapPin className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/40" />
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Add a Google Maps embed URL
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
