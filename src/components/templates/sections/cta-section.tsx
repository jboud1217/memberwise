import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  heading: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
}

export function CtaSection({ heading, description, ctaText, ctaLink }: CtaSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl rounded-[var(--radius)] bg-[var(--primary)] px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-[var(--primary-foreground)] sm:text-3xl" data-editable-text="heading">
          {heading}
        </h2>
        {description && (
          <p className="mt-3 text-[var(--primary-foreground)]/80" data-editable-text="description">{description}</p>
        )}
        <div className="mt-6">
          <a href={ctaLink} data-editable-link="ctaLink" data-link-text-path="ctaText">
            <Button
              size="lg"
              className="bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              data-editable-text="ctaText"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
