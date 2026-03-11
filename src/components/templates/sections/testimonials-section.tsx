import { Quote } from "lucide-react";

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
}

interface TestimonialsSectionProps {
  heading?: string;
  items: TestimonialItem[];
}

export function TestimonialsSection({ heading, items }: TestimonialsSectionProps) {
  return (
    <section className="bg-[var(--muted)] py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-12 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6"
            >
              <Quote className="mb-3 h-6 w-6 text-[var(--primary)]/40" />
              <p className="mb-4 text-sm leading-relaxed text-[var(--card-foreground)]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-medium text-[var(--card-foreground)]">{item.author}</p>
                {item.role && (
                  <p className="text-xs text-[var(--muted-foreground)]">{item.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
