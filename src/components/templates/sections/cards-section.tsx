import { ArrowRight, ImageIcon } from "lucide-react";

interface CardItem {
  image?: string;
  title: string;
  description: string;
  linkUrl?: string;
  linkText?: string;
}

interface CardsSectionProps {
  heading?: string;
  subheading?: string;
  columns?: 2 | 3 | 4;
  items?: CardItem[];
}

export function CardsSection({
  heading,
  subheading,
  columns = 3,
  items = [],
}: CardsSectionProps) {
  const gridCols =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-3 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-10 text-center text-lg text-[var(--muted-foreground)]">
            {subheading}
          </p>
        )}
        <div className={`grid gap-6 ${gridCols}`}>
          {items.map((card, i) => (
            <div
              key={i}
              className="group overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-lg"
            >
              {card.image ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-[var(--muted)]">
                  <ImageIcon className="h-8 w-8 text-[var(--muted-foreground)]/30" />
                </div>
              )}
              <div className="p-5">
                <h3 className="mb-2 text-lg font-semibold text-[var(--card-foreground)]">
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">{card.description}</p>
                {card.linkUrl && card.linkText && (
                  <a
                    href={card.linkUrl}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    {card.linkText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
