import { Code } from "lucide-react";

interface CustomHtmlSectionProps {
  heading?: string;
  html?: string;
}

export function CustomHtmlSection({ heading, html }: CustomHtmlSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-5xl">
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="flex items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12">
            <div className="text-center">
              <Code className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Add custom HTML or embed code
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
