import { ImageIcon } from "lucide-react";

interface LogoItem {
  src: string;
  alt?: string;
  url?: string;
}

interface LogoCloudSectionProps {
  heading?: string;
  logos?: LogoItem[];
  grayscale?: boolean;
}

export function LogoCloudSection({
  heading,
  logos = [],
  grayscale = true,
}: LogoCloudSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-5xl">
        {heading && (
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {logos.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {logos.map((logo, i) => {
              const img = (
                <img
                  src={logo.src}
                  alt={logo.alt || `Partner ${i + 1}`}
                  className={`h-10 max-w-[140px] object-contain transition-all ${
                    grayscale
                      ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                      : ""
                  }`}
                  data-editable-image={`logos.${i}.src`}
                />
              );
              return logo.url ? (
                <a key={i} href={logo.url} target="_blank" rel="noopener noreferrer" data-array-item="logos" data-item-index={i} data-editable-link={`logos.${i}.url`}>
                  {img}
                </a>
              ) : (
                <div key={i} data-array-item="logos" data-item-index={i}>{img}</div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 w-28 items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)]"
              >
                <ImageIcon className="h-5 w-5 text-[var(--muted-foreground)]/30" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
